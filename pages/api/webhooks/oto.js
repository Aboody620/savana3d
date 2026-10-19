import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { buildOtoUpdate, savanaOrderIdFromOto } from "../../../lib/otoStatus";

// يستقبل تحديثات حالة الشحنة من OTO ويحدّث رقم التتبع وحالة الطلب تلقائيًا.
// التسجيل: POST https://api.tryoto.com/rest/v2/webhook
//   { "method": "POST", "url": "https://savana3d.com/api/webhooks/oto?key=<OTO_WEBHOOK_SECRET>",
//     "authorizationKey": "<OTO_WEBHOOK_SECRET>", "webhookType": "orderStatus" }

function same(a, b) {
  if (typeof a !== "string" || !b) return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });
  const secret = (process.env.OTO_WEBHOOK_SECRET || "").trim();
  if (!secret) return res.status(503).json({ error: "webhook not configured" });

  const header = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  const key = typeof req.query.key === "string" ? req.query.key : "";
  if (!same(header, secret) && !same(key, secret)) return res.status(401).json({ error: "unauthorized" });

  const event = req.body || {};
  const orderId = savanaOrderIdFromOto(event.orderId);
  if (!orderId) return res.status(200).json({ ignored: true });

  try {
    const { data: order, error } = await supabaseAdmin
      .from("orders").select("id, status, payment_status").eq("id", orderId).maybeSingle();
    if (error) return res.status(500).json({ retry: true });
    if (!order || order.payment_status !== "paid") return res.status(200).json({ ignored: true });

    const update = buildOtoUpdate(order, event);
    if (Object.keys(update).length === 0) return res.status(200).json({ ok: true });

    const { error: updateError } = await supabaseAdmin
      .from("orders").update(update).eq("id", orderId).eq("status", order.status);
    if (updateError) return res.status(500).json({ retry: true });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("oto webhook", err);
    return res.status(500).json({ retry: true });
  }
}
