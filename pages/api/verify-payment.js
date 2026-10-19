import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { confirmPayment } from "../../lib/confirmPayment";

// صفحة الرجوع بعد الدفع تنادي هذا المسار. التحقق الفعلي في lib/confirmPayment.js
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { paymentId, orderIds } = req.body || {};
  try {
    const result = await confirmPayment({
      admin: supabaseAdmin, fetchImpl: fetch, env: process.env, paymentId, orderIds,
    });
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error("verify-payment", err);
    return res.status(500).json({ error: "تعذر التحقق من الدفع، حاول مرة ثانية" });
  }
}
