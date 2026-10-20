// منطق إنشاء الطلبات على السيرفر فقط.
// المتصفح يرسل "وش يبغى" (معرّفات المنتجات والكميات) — والسيرفر هو اللي
// يحدد الأسعار من قاعدة البيانات، عشان ما أحد يقدر يدفع أقل من السعر الحقيقي.

export const SHIPPING_COST = 25;        // التوصيل خارج المدينة المنورة (عن طريق OTO)
export const LOCAL_SHIPPING_COST = 15;  // التوصيل داخل المدينة المنورة (يوصله صاحب المتجر)
export const LOCAL_CITY = "المدينة المنورة";

// هل المدينة هي المدينة المنورة؟ يقبل الكتابات الشائعة
export function isLocalCity(city) {
  const c = (typeof city === "string" ? city : "").replace(/[\u064B-\u0652]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  return ["المدينة المنورة", "المدينه المنوره", "المدينة", "المدينه", "madinah", "medina", "al madinah", "almadinah"].includes(c);
}

export function shippingFor(city) {
  return isLocalCity(city) ? LOCAL_SHIPPING_COST : SHIPPING_COST;
}
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

// يتحقق من محتوى السلة القادم من المتصفح ويجمع السطور المتطابقة (نفس المنتج واللون والجودة)
export function normalizeCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new CheckoutError("السلة فاضية");
  if (items.length > MAX_ITEMS) throw new CheckoutError("عدد المنتجات بالسلة كبير جدًا");
  const lines = new Map();
  for (const item of items) {
    const id = clean(item?.id);
    const quantity = Number(item?.quantity);
    const color = clean(item?.color).slice(0, 50);
    const quality = item?.quality === "high" ? "high" : "standard";
    if (!UUID.test(id)) throw new CheckoutError("منتج غير صالح بالسلة");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new CheckoutError(`الكمية لازم تكون بين 1 و ${MAX_QUANTITY}`);
    }
    const key = `${id}|${color}|${quality}`;
    const prev = lines.get(key);
    lines.set(key, { id, color, quality, quantity: Math.min(MAX_QUANTITY, (prev?.quantity || 0) + quantity) });
  }
  return [...lines.values()];
}

const money = (value) => Math.round(Number(value) * 100) / 100;

// يبني صفوف الطلبات باستخدام الأسعار الموجودة بقاعدة البيانات فقط.
// designs: صفوف جدول designs (id, price, title) كما رجعت من السيرفر.
export function buildStoreOrders({ customerId, items, designs, shipping }) {
  const byId = new Map((designs || []).filter((d) => d.is_active !== false).map((d) => [d.id, d]));
  const missing = [...new Set(items.filter((item) => !byId.has(item.id)).map((item) => item.id))];
  if (missing.length) {
    const error = new CheckoutError("بعض المنتجات ما عادت متوفرة", 409);
    error.missing = missing;
    throw error;
  }
  const address = validateShipping(shipping);
  const shippingCost = shippingFor(address.shipping_city);
  const rows = items.map((item, index) => {
    const design = byId.get(item.id);
    if (design.pricing_mode === "quote") throw new CheckoutError("هذا المنتج غير متاح للطلب حاليًا", 409);
    const colors = Array.isArray(design.colors) ? design.colors : [];
    if (colors.length > 0 && !colors.includes(item.color)) {
      throw new CheckoutError(`اللون المختار ما عاد متوفر لـ ${design.title || "المنتج"}، اختر لون ثاني`, 409);
    }
    const high = item.quality === "high";
    if (high && !(Number(design.price_high) > 0)) throw new CheckoutError("الجودة العالية غير متاحة لهذا المنتج", 409);
    const price = Number(high ? design.price_high : design.price);
    if (!Number.isFinite(price) || price <= 0) throw new CheckoutError("سعر منتج غير صالح", 409);
    return {
      customer_id: customerId,
      design_id: item.id,
      quantity: item.quantity,
      color: colors.length > 0 ? item.color : null,
      quality: high ? "high" : "standard",
      total_price: money(price * item.quantity),
      // التوصيل كامل على أول طلب فقط، عشان مجموع الطلبات = مبلغ الدفع الواحد
      shipping_cost: index === 0 ? shippingCost : 0,
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
    shipping_cost: shippingFor(shipping?.city),
    notes: note || null,
    status: "pending_payment",
    payment_status: "unpaid",
    ...validateShipping(shipping),
  };
  return { rows: [row], total: money(amount + row.shipping_cost) };
}
