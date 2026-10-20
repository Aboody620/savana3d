import { paymentReadiness } from "../../lib/paymentConfig";

// فحص سريع لإعداد ميسر: يرجّع وضع المفاتيح (test/live) وهل هي متطابقة،
// بدون أي قيمة سرية. افتح /api/payment-status بعد أي تعديل على مفاتيح Vercel.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const status = paymentReadiness(process.env);
  const messages = {
    missing_publishable_key: "المفتاح العام (NEXT_PUBLIC_MOYASAR_KEY) ناقص أو غير صحيح",
    missing_secret_key: "المفتاح السري (MOYASAR_SECRET_KEY) ناقص أو غير صحيح",
    key_mode_mismatch: "المفتاح العام والسري من وضعين مختلفين (واحد test والثاني live)",
  };
  return res.status(200).json({ ...status, message: status.ready ? "إعداد ميسر سليم" : messages[status.problem] });
}
