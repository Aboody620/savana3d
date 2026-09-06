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

  const { paymentId, orderIds } = req.body;

  if (!paymentId || !Array.isArray(orderIds) || orderIds.length === 0) {
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
      `https://api.moyasar.com/v1/payments/${paymentId}`,
      { headers: { Authorization: moyasarAuthHeader() } }
    );

    if (!moyasarRes.ok) {
      return res.status(400).json({ error: "تعذر التحقق من عملية الدفع" });
    }

    const payment = await moyasarRes.json();

    const expectedAmount = Math.round(expectedTotal * 100);

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

    // 3) الدفع سليم فعلًا: نحدّث كل الطلبات المرتبطة لـ "مدفوع" و"بانتظار طابع"
    await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "pending",
        payment_reference: payment.id,
      })
      .in("id", orderIds);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
