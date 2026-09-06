// إدارة سلة المشتريات محليًا (localStorage) — السلة نفسها لا تُخزّن بقاعدة البيانات،
// وتتحول لطلبات فعلية فقط لحظة إتمام الشراء من صفحة السلة.

const CART_KEY = "savana3d_cart";

function readCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function getCart() {
  return readCart();
}

export function getCartCount() {
  return readCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function addToCart(design) {
  const items = readCart();
  const existing = items.find((i) => i.id === design.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({
      id: design.id,
      title: design.title,
      price: design.price,
      preview_image_url: design.preview_image_url,
      quantity: 1,
    });
  }
  writeCart(items);
}

export function removeFromCart(designId) {
  const items = readCart().filter((i) => i.id !== designId);
  writeCart(items);
}

export function updateQuantity(designId, quantity) {
  const items = readCart();
  const item = items.find((i) => i.id === designId);
  if (!item) return;
  if (quantity <= 0) {
    return removeFromCart(designId);
  }
  item.quantity = quantity;
  writeCart(items);
}

export function clearCart() {
  writeCart([]);
}

export function getCartSubtotal() {
  return readCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}
