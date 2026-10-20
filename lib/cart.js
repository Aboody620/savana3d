// سلة المشتريات محليًا (localStorage). كل سطر = منتج + لون + جودة.
// الأسعار هنا للعرض فقط؛ السيرفر يعيد حسابها من قاعدة البيانات عند الدفع.

const CART_KEY = "savana3d_cart";

export function lineKey(item) {
  return `${item.id}|${item.color || ""}|${item.quality || "standard"}`;
}

function readCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items.map((i) => ({ quality: "standard", color: "", ...i, key: lineKey(i) })) : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // التخزين غير متاح — نكمل بدون حفظ
  }
  window.dispatchEvent(new Event("cart-updated"));
}

export function getCart() {
  return readCart();
}

export function getCartCount() {
  return readCart().reduce((sum, item) => sum + item.quantity, 0);
}

// options: { color, quality } — السعر المعروض يحدده المنتج والجودة
export function addToCart(design, options = {}) {
  if (design.pricing_mode === "quote") return;
  const quality = options.quality === "high" && Number(design.price_high) > 0 ? "high" : "standard";
  const line = {
    id: design.id,
    title: design.title,
    color: options.color || "",
    quality,
    price: Number(quality === "high" ? design.price_high : design.price),
    preview_image_url: design.preview_image_url,
    quantity: 1,
  };
  const items = readCart();
  const existing = items.find((i) => i.key === lineKey(line));
  if (existing) existing.quantity += 1;
  else items.push(line);
  writeCart(items.map(({ key, ...rest }) => rest));
}

export function removeFromCart(key) {
  writeCart(readCart().filter((i) => i.key !== key && i.id !== key).map(({ key: _k, ...rest }) => rest));
}

export function updateQuantity(key, quantity) {
  const items = readCart();
  const item = items.find((i) => i.key === key);
  if (!item) return;
  if (quantity <= 0) return removeFromCart(key);
  item.quantity = Math.min(quantity, 20);
  writeCart(items.map(({ key: _k, ...rest }) => rest));
}

export function clearCart() {
  writeCart([]);
}

export function getCartSubtotal() {
  return readCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}
