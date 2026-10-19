// تأكيد الدفع — يُستخدم من صفحة الرجوع (/api/verify-payment) ومن Webhook ميسر.
// ما نثق بأي شي جاي من المتصفح أو من جسم الإشعار: دايمًا نجيب العملية من API ميسر
// بالمفتاح السري ونقارنها بالطلبات المحفوظة بقاعدة البيانات.
// بدون imports عشان يسهل اختباره؛ نمرر له supabaseAdmin و fetch.

const ID = /^[a-zA-Z0-9-]{1,100}$/;

export function validIds(paymentId, orderIds) {
  return typeof paymentId === "string" && ID.test(paymentId) &&
    Array.isArray(orderIds) && orderIds.length > 0 && orderIds.length <= 100 &&
    orderIds.every((id) => typeof id === "string" && ID.test(id)) &&
    new Set(orderIds).size === orderIds.length;
}

// يستخرج أرقام الطلبات من رابط الرجوع المخزّن عند ميسر، ويتأكد إنه لموقعنا
export function orderIdsFromCallback(callbackUrl, siteUrl) {
  try {
    const callback = new URL(callbackUrl);
    const site = new URL(siteUrl);
    const host = (value) => value.replace(/^www\./, "");
    if (callback.protocol !== site.protocol || host(callback.host) !== host(site.host) ||
        callback.pathname !== "/order-success") return null;
    const ids = (callback.searchParams.get("order_ids") || "").split(",").filter(Boolean);
    return ids.length ? ids : null;
  } catch {
    return null;
  }
}

export async function fetchMoyasarPayment(paymentId, { fetchImpl, secretKey }) {
  const token = Buffer.from(`${(secretKey || "").trim()}:`).toString("base64");
  const response = await fetchImpl(
    `https://api.moyasar.com/v1/payments/${encodeURIComponent(paymentId)}`,
    { headers: { Authorization: `Basic ${token}` }, signal: AbortSignal.timeout(15000) }
  );
  if (!response.ok) return null;
  return response.json();
}

// يرجّع { status, body } بنفس شكل رد الـ API
export async function confirmPayment({ admin, fetchImpl, env, paymentId, orderIds }) {
  if (!validIds(paymentId, orderIds)) {
    return { status: 400, body: { error: "paymentId و orderIds مطلوبين" } };
  }

  const { data: orders, error: ordersError } = await admin
    .from("orders").select("*").in("id", orderIds);
  if (ordersError) return { status: 503, body: { error: "تعذر قراءة الطلبات، حاول مرة ثانية" } };
  if (!orders || orders.length !== orderIds.length) {
    return { status: 404, body: { error: "بعض الطلبات غير موجودة" } };
  }

  const payment = await fetchMoyasarPayment(paymentId, { fetchImpl, secretKey: env.MOYASAR_SECRET_KEY });
  if (!payment) return { status: 400, body: { error: "تعذر التحقق من عملية الدفع" } };

  // ميسر يحفظ رابط الرجوع لحظة إنشاء العملية — نربط الدفع بنفس مجموعة الطلبات بالضبط،
  // عشان ما تنستخدم عملية مدفوعة بنفس المبلغ لطلب ثاني
  const boundOrderIds = orderIdsFromCallback(payment.callback_url, env.NEXT_PUBLIC_SITE_URL);
  if (!boundOrderIds) return { status: 400, body: { error: "عملية الدفع غير مرتبطة بطلبات المتجر" } };
  if (JSON.stringify([...boundOrderIds].sort()) !== JSON.stringify([...orderIds].sort())) {
    return { status: 400, body: { error: "عملية الدفع مرتبطة بطلبات أخرى" } };
  }

  const expectedAmount = Math.round(
    orders.reduce((sum, o) => sum + Number(o.total_price) + Number(o.shipping_cost || 0), 0) * 100
  );
  const isValid = payment.id === paymentId && payment.status === "paid" &&
    Number.isFinite(expectedAmount) && expectedAmount > 0 &&
    payment.amount === expectedAmount && payment.currency === "SAR";
  if (!isValid) {
    return { status: 400, body: { error: "بيانات الدفع غير مطابقة أو لم تكتمل", status: payment.status } };
  }

  // نحدّث فقط الطلبات اللي لسا بانتظار الدفع — لو انفتحت الصفحة مرتين أو وصل
  // الـ webhook بعد الصفحة، ما نرجّع حالة طلب تقدم فيه الطابع
  const { error: updateError } = await admin
    .from("orders")
    .update({ payment_status: "paid", status: "pending", payment_reference: payment.id })
    .in("id", orderIds)
    .eq("status", "pending_payment")
    .eq("payment_status", "unpaid");
  if (updateError) {
    return { status: 500, body: { error: "تعذر حفظ تأكيد الدفع. يرجى إعادة المحاولة، دون دفع المبلغ مرة أخرى." } };
  }

  const { data: confirmed, error: confirmError } = await admin
    .from("orders").select("id, payment_status, payment_reference").in("id", orderIds);
  if (confirmError || confirmed?.length !== orderIds.length ||
      confirmed.some((o) => o.payment_status !== "paid" || o.payment_reference !== payment.id)) {
    return { status: 409, body: { error: "تعذر مطابقة الدفع مع حالة الطلب الحالية" } };
  }
  return { status: 200, body: { success: true } };
}
