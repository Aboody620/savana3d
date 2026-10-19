// منطق إنشاء الطلبات على السيرفر فقط.
// المتصفح يرسل "وش يبغى" (معرّفات المنتجات والكميات) — والسيرفر هو اللي
// يحدد الأسعار من قاعدة البيانات، عشان ما أحد يقدر يدفع أقل من السعر الحقيقي.

export const SHIPPING_COST = 25; // شحن ثابت لكل عملية دفع بالمرحلة الأولى
export const MAX_QUANTITY = 20;
export const MAX_ITEMS = 30;
export const MIN_CUSTOM_PRICE = 10;
export const MAX_CUSTOM_PRICE = 5000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CheckoutError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const clean = (value) => (typeof value === "string" ? value.trim() : "");

export function normalizeSaudiMobile(value) {
  const digits = clean(value).replace(/[\s()-]/g, "").replace(/^\+/, "");
  if (/^05\d{8}$/.test(digits)) return `966${digits.slice(1)}`;
  if (/^5\d{8}$/.test(digits)) return `966${digits}`;
  if (/^9665\d{8}$/.test(digits)) return digits;
  return null;
}

export function validateShipping(shipping) {
  const name = clean(shipping?.name);
  const city = clean(shipping?.city);
  const address = clean(shipping?.address);
  const phone = normalizeSaudiMobile(shipping?.phone);
  if (name.length < 2 || name.length > 100) throw new CheckoutError("أدخل اسم المستلم");
  if (!phone) throw new CheckoutError("أدخل رقم جوال سعودي صحيح يبدأ بـ 05");
  if (city.length < 2 || city.length > 100) throw new CheckoutError("أدخل المدينة");
  if (address.length < 5 || address.length > 500) throw new CheckoutError("أدخل عنوان التوصيل بالتفصيل");
  return {
    shipping_name: name,
    shipping_phone: phone,
    shipping_city: city,
    shipping_address: address,
  };
}

// يتحقق من محتوى السلة القادم من المتصفح ويجمع الكميات المكررة
export function normalizeCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new CheckoutError("السلة فاضية");
  if (items.length > MAX_ITEMS) throw new CheckoutError("عدد المنتجات بالسلة كبير جدًا");
  const quantities = new Map();
  for (const item of items) {
    const id = clean(item?.id);
    const quantity = Number(item?.quantity);
    if (!UUID.test(id)) throw new CheckoutError("منتج غير صالح بالسلة");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new CheckoutError(`الكمية لازم تكون بين 1 و ${MAX_QUANTITY}`);
    }
    quantities.set(id, Math.min(MAX_QUANTITY, (quantities.get(id) || 0) + quantity));
  }
  return [...quantities].map(([id, quantity]) => ({ id, quantity }));
}

const money = (value) => Math.round(Number(value) * 100) / 100;

// يبني صفوف الطلبات باستخدام الأسعار الموجودة بقاعدة البيانات فقط.
// designs: صفوف جدول designs (id, price, title) كما رجعت من السيرفر.
export function buildStoreOrders({ customerId, items, designs, shipping }) {
  const byId = new Map((designs || []).map((d) => [d.id, d]));
  const missing = items.filter((item) => !byId.has(item.id)).map((item) => item.id);
  if (missing.length) {
    const error = new CheckoutError("بعض المنتجات ما عادت متوفرة", 409);
    error.missing = missing;
    throw error;
  }
  const address = validateShipping(shipping);
  const rows = items.map((item, index) => {
    const price = Number(byId.get(item.id).price);
    if (!Number.isFinite(price) || price <= 0) throw new CheckoutError("سعر منتج غير صالح", 409);
    return {
      customer_id: customerId,
      design_id: item.id,
      quantity: item.quantity,
      total_price: money(price * item.quantity),
      // الشحن كامل على أول طلب فقط، عشان مجموع الطلبات = مبلغ الدفع الواحد
      shipping_cost: index === 0 ? SHIPPING_COST : 0,
      status: "pending_payment",
      payment_status: "unpaid",
      ...address,
    };
  });
  return { rows, total: money(rows.reduce((sum, r) => sum + r.total_price + r.shipping_cost, 0)) };
}

// الطلب المخصص: الزبون يحدد السعر اللي يعرضه على أصحاب الطابعات،
// بس السيرفر يتحقق من الحدود ومن إن الملف فعلًا مرفوع بمجلد هذا الزبون.
export function buildCustomOrder({ customerId, supabaseUrl, fileUrl, price, notes, shipping }) {
  const amount = money(price);
  if (!Number.isFinite(amount) || amount < MIN_CUSTOM_PRICE || amount > MAX_CUSTOM_PRICE) {
    throw new CheckoutError(`السعر لازم يكون بين ${MIN_CUSTOM_PRICE} و ${MAX_CUSTOM_PRICE} ريال`);
  }
  let origin;
  try { origin = new URL(supabaseUrl).origin; } catch { throw new CheckoutError("إعداد التخزين غير مكتمل", 500); }
  const expectedPrefix = `${origin}/storage/v1/object/public/designs/custom/${customerId}/`;
  const url = clean(fileUrl);
  if (!url.startsWith(expectedPrefix) || url.includes("..") || url.length > 500) {
    throw new CheckoutError("ملف التصميم غير صالح، ارفعه من جديد");
  }
  const note = clean(notes);
  if (note.length > 2000) throw new CheckoutError("الملاحظات طويلة جدًا");
  const row = {
    customer_id: customerId,
    design_id: null,
    custom_file_url: url,
    quantity: 1,
    total_price: amount,
    shipping_cost: SHIPPING_COST,
    notes: note || null,
    status: "pending_payment",
    payment_status: "unpaid",
    ...validateShipping(shipping),
  };
  return { rows: [row], total: money(amount + SHIPPING_COST) };
}
