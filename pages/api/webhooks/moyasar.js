import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { confirmPayment, orderIdsFromCallback } from "../../../lib/confirmPayment";

// Webhook ميسر: يأكد الدفع حتى لو الزبون قفل المتصفح قبل ما يرجع للموقع.
// الإعداد: لوحة ميسر → Settings → Webhooks → رابط https://savana3d.com/api/webhooks/moyasar
// وحدث payment_paid، ونفس الـ Secret Token بمتغير MOYASAR_WEBHOOK_SECRET في Vercel.

function sameSecret(received, expected) {
  if (typeof received !== "string" || !expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const expected = (process.env.MOYASAR_WEBHOOK_SECRET || "").trim();
  if (!expected) return res.status(503).json({ error: "webhook not configured" });

  const event = req.body || {};
  if (!sameSecret(event.secret_token, expected)) return res.status(401).json({ error: "unauthorized" });

  // نتجاهل الأحداث الثانية بـ 200 عشان ما يعيد ميسر إرسالها
  if (event.type !== "payment_paid") return res.status(200).json({ ignored: true });

  const paymentId = event.data?.id;
  const orderIds = orderIdsFromCallback(event.data?.callback_url, process.env.NEXT_PUBLIC_SITE_URL);
  if (!paymentId || !orderIds) return res.status(200).json({ ignored: true });

  try {
    // confirmPayment يجيب العملية من API ميسر نفسه — ما نعتمد على جسم الإشعار
    const result = await confirmPayment({
      admin: supabaseAdmin, fetchImpl: fetch, env: process.env, paymentId, orderIds,
    });
    if (result.status === 200) return res.status(200).json({ ok: true });
    // أخطاء مؤقتة (قاعدة البيانات) نرجّع 500 عشان ميسر يعيد المحاولة؛ الباقي نسجله ونقفله
    if (result.status >= 500) return res.status(500).json({ retry: true });
    console.warn("moyasar webhook rejected", paymentId, result.body?.error);
    return res.status(200).json({ ignored: true });
  } catch (err) {
    console.error("moyasar webhook", err);
    return res.status(500).json({ retry: true });
  }
}
