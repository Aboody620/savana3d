import { supabaseAdmin } from "../../lib/supabaseAdmin";

// Moyasar تستخدم HTTP Basic Auth: المفتاح السري كاسم مستخدم، وكلمة مرور فاضية
function moyasarAuthHeader() {
  const token = Buffer.from(`${process.env.MOYASAR_SECRET_KEY}:`).toString(
    "base64"
  );
  return `Basic ${token}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { paymentId, orderId } = req.body;

  if (!paymentId || !orderId) {
    return res.status(400).json({ error: "paymentId و orderId مطلوبين" });
  }

  try {
    // 1) نجيب الطلب من قاعدة البيانات عشان نتأكد من المبلغ المطلوب
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: "الطلب غير موجود" });
    }

    // 2) نتحقق من حالة الدفع مباشرة من سيرفرات Moyasar (مو من المتصفح)
    // هذا أهم خطوة أمان: لا نثق بأي شي راجع من المتصفح لوحده
    const moyasarRes = await fetch(
      `https://api.moyasar.com/v1/payments/${paymentId}`,
      { headers: { Authorization: moyasarAuthHeader() } }
    );

    if (!moyasarRes.ok) {
      return res.status(400).json({ error: "تعذر التحقق من عملية الدفع" });
    }

    const payment = await moyasarRes.json();

    const expectedAmount = Math.round(
      (order.total_price + order.shipping_cost) * 100
    );

    const isValid =
      payment.status === "paid" &&
      payment.amount === expectedAmount &&
      payment.currency === "SAR";

    if (!isValid) {
      return res.status(400).json({
        error: "بيانات الدفع غير مطابقة أو لم تكتمل",
        status: payment.status,
      });
    }

    // 3) الدفع سليم فعلًا: نحدّث الطلب لـ "مدفوع" و"بانتظار طابع"
    await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "pending",
        payment_reference: payment.id,
      })
      .eq("id", orderId);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
