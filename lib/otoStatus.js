// تحويل إشعارات OTO لحالة الطلب في Savana3D. بدون imports عشان يسهل اختباره.

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// رقم الطلب عندنا في OTO هو SAVANA-<uuid> (أو بدون البادئة لو انضبط orderPrefix)
export function savanaOrderIdFromOto(otoOrderId) {
  if (typeof otoOrderId !== "string") return null;
  const match = otoOrderId.match(UUID);
  return match ? match[0].toLowerCase() : null;
}

const DELIVERED = new Set(["delivered", "completed"]);
const IN_TRANSIT = new Set([
  "pickedup", "picked_up", "shipmentinprogress", "intransit", "in_transit",
  "outfordelivery", "out_for_delivery", "shipped", "atdeliverycompanywarehouse",
]);

// ترتيب الحالات — ما نرجع الطلب لورا أبد
const RANK = { pending_payment: 0, pending: 1, accepted: 2, printing: 3, shipped: 4, completed: 5 };

export function nextOrderStatus(currentStatus, otoStatus) {
  const key = String(otoStatus || "").replace(/[\s-]/g, "").toLowerCase();
  let target = null;
  if (DELIVERED.has(key)) target = "completed";
  else if (IN_TRANSIT.has(key)) target = "shipped";
  if (!target || currentStatus === "cancelled" || !(currentStatus in RANK)) return currentStatus;
  // ما ننقل لطلب ما بدأ طباعته (حماية من إشعار غلط)
  if (RANK[currentStatus] < RANK.printing) return currentStatus;
  return RANK[target] > RANK[currentStatus] ? target : currentStatus;
}

const text = (value, max) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);

export function safeHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString().slice(0, 500) : null;
  } catch {
    return null;
  }
}

// يبني التحديث المسموح من جسم الإشعار
export function buildOtoUpdate(order, event) {
  const update = {};
  const status = text(event?.status, 60);
  const dcStatus = text(event?.dcStatus, 60);
  if (status || dcStatus) update.shipping_status = [status, dcStatus].filter(Boolean).join(" / ");
  const tracking = text(event?.dcTrackingNumber, 100) || text(event?.trackingNumber, 100);
  if (tracking) update.tracking_number = tracking;
  const trackingUrl = safeHttpsUrl(event?.trackingUrl);
  if (trackingUrl) update.tracking_url = trackingUrl;
  const carrier = text(event?.deliveryCompany, 100);
  if (carrier) update.shipping_carrier = carrier;
  const next = nextOrderStatus(order.status, status);
  if (next !== order.status) update.status = next;
  return update;
}
