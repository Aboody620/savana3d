import { supabaseAdmin } from "../../lib/supabaseAdmin";

// Moyasar تستخدم HTTP Basic Auth: المفتاح السري كاسم مستخدم، وكلمة مرور فاضية
function moyasarAuthHeader() {
  const token = Buffer.from(`${(process.env.MOYASAR_SECRET_KEY || "").trim()}:`).toString(
    "base64"
  );
  return `Basic ${token}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { paymentId, orderIds } = req.body || {};

  if (typeof paymentId !== "string" || !/^[a-zA-Z0-9-]{1,100}$/.test(paymentId) ||
      !Array.isArray(orderIds) || orderIds.length === 0 || orderIds.length > 100 ||
      orderIds.some((id) => typeof id !== "string" || !/^[a-zA-Z0-9-]{1,100}$/.test(id)) ||
      new Set(orderIds).size !== orderIds.length) {
    return res.status(400).json({ error: "paymentId و orderIds مطلوبين" });
  }

  try {
    // 1) نجيب كل الطلبات المرتبطة بهذي العملية عشان نتأكد من المبلغ الكلي
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .in("id", orderIds);

    if (ordersError || !orders || orders.length !== orderIds.length) {
      return res.status(404).json({ error: "بعض الطلبات غير موجودة" });
    }

    const expectedTotal = orders.reduce(
      (sum, o) => sum + Number(o.total_price) + Number(o.shipping_cost),
      0
    );

    // 2) نتحقق من حالة الدفع مباشرة من سيرفرات Moyasar (مو من المتصفح)
    const moyasarRes = await fetch(
      `https://api.moyasar.com/v1/payments/${encodeURIComponent(paymentId)}`,
      { headers: { Authorization: moyasarAuthHeader() }, signal: AbortSignal.timeout(15000) }
    );

    if (!moyasarRes.ok) {
      return res.status(400).json({ error: "تعذر التحقق من عملية الدفع" });
    }

    const payment = await moyasarRes.json();

    // The gateway stores the callback from creation. Bind the payment to that
    // exact order set, so an equal-value payment cannot pay a second order.
    let boundOrderIds;
    try {
      const callback = new URL(payment.callback_url);
      const site = new URL(process.env.NEXT_PUBLIC_SITE_URL);
      const host = (value) => value.replace(/^www\./, "");
      if (callback.protocol !== site.protocol || host(callback.host) !== host(site.host) ||
          callback.pathname !== "/order-success") throw new Error("Invalid callback");
      boundOrderIds = (callback.searchParams.get("order_ids") || "").split(",").sort();
    } catch {
      return res.status(400).json({ error: "عملية الدفع غير مرتبطة بطلبات المتجر" });
    }
    if (JSON.stringify(boundOrderIds) !== JSON.stringify([...orderIds].sort())) {
      return res.status(400).json({ error: "عملية الدفع مرتبطة بطلبات أخرى" });
    }

    const expectedAmount = Math.round(expectedTotal * 100);

    const isValid =
      payment.id === paymentId && payment.status === "paid" &&
      Number.isFinite(expectedAmount) && expectedAmount > 0 &&
      payment.amount === expectedAmount &&
      payment.currency === "SAR";

    if (!isValid) {
      return res.status(400).json({
        error: "بيانات الدفع غير مطابقة أو لم تكتمل",
        status: payment.status,
      });
    }

    // 3) الدفع سليم فعلًا: نحدّث كل الطلبات المرتبطة لـ "مدفوع" و"بانتظار طابع"
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "pending",
        payment_reference: payment.id,
      })
      .in("id", orderIds)
      .eq("status", "pending_payment")
      .eq("payment_status", "unpaid");

    if (updateError) {
      return res.status(500).json({ error: "تعذر حفظ تأكيد الدفع. يرجى إعادة المحاولة، دون دفع المبلغ مرة أخرى." });
    }

    const { data: confirmed, error: confirmError } = await supabaseAdmin
      .from("orders")
      .select("id, payment_status, payment_reference")
      .in("id", orderIds);
    if (confirmError || confirmed?.length !== orderIds.length ||
        confirmed.some((order) => order.payment_status !== "paid" || order.payment_reference !== payment.id)) {
      return res.status(409).json({ error: "تعذر مطابقة الدفع مع حالة الطلب الحالية" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
