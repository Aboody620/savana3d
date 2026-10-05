import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { buildOtoOrder } from "../../../lib/otoOrder";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const bearer = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!bearer) return res.status(401).json({ error: "يرجى تسجيل الدخول" });
  const refreshToken = process.env.OTO_REFRESH_TOKEN?.trim();
  if (!refreshToken) return res.status(503).json({ error: "ربط الشحن غير متاح حاليًا" });
  try {
    const { data: auth, error: authError } = await supabaseAdmin.auth.getUser(bearer);
    if (authError || !auth?.user) return res.status(401).json({ error: "يرجى تسجيل الدخول مجددًا" });
    const orderId = req.body?.orderId;
    if (typeof orderId !== "string" || !/^[0-9a-f-]{36}$/i.test(orderId)) return res.status(400).json({ error: "رقم الطلب غير صالح" });
    const { data: profile, error: profileError } = await supabaseAdmin.from("profiles")
      .select("role").eq("id", auth.user.id).single();
    if (profileError || profile?.role !== "printer") return res.status(403).json({ error: "هذه الخطوة خاصة بصاحب الطابعة" });
    const { data: order, error } = await supabaseAdmin.from("orders")
      .select("*, designs(title)").eq("id", orderId).eq("printer_id", auth.user.id).single();
    if (error || !order) return res.status(404).json({ error: "الطلب غير متاح" });
    if (order.payment_status !== "paid" || !order.payment_reference || !["accepted", "printing"].includes(order.status)) {
      return res.status(409).json({ error: "يلزم طلب مدفوع مقبول أو قيد الطباعة" });
    }
    let payload;
    try { payload = buildOtoOrder(order, req.body.sender, req.body.parcel); }
    catch (validationError) { return res.status(400).json({ error: validationError.message }); }
    const tokenResponse = await fetch("https://api.tryoto.com/rest/v2/refreshToken", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }), signal: AbortSignal.timeout(15000),
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || typeof tokenData.access_token !== "string") {
      return res.status(502).json({ error: "تعذر الاتصال بحساب OTO. يرجى مراجعة إعداد الربط" });
    }
    const otoResponse = await fetch("https://api.tryoto.com/rest/v2/createOrder", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenData.access_token}` },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
    });
    const result = await otoResponse.json();
    if (!otoResponse.ok || result.success !== true) {
      // Never relay provider responses containing addresses or credentials to the browser.
      return res.status(502).json({ error: "لم يؤكد OTO إنشاء الطلب. راجع لوحة OTO بنفس رقم الطلب قبل إعادة المحاولة", orderId: payload.orderId });
    }
    return res.status(200).json({ success: true, orderId: payload.orderId });
  } catch {
    return res.status(502).json({ error: "تعذر تأكيد تجهيز الشحن. راجع لوحة OTO قبل إعادة المحاولة" });
  }
}
