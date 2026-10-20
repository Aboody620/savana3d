import { paymentReadiness } from "../../lib/paymentConfig";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { CheckoutError, validateShipping } from "../../lib/checkout";
import { quoteRecipient } from "../../lib/quoteOrder";

// الزبون يوافق على عرض الطابع: نتحقق من بيانات التوصيل، وبعدها دالة
// accept_print_quote تنشئ الطلب بسعر العرض المحفوظ وتربطه بالطابع (داخل معاملة واحدة).
const UUID = /^[0-9a-f-]{36}$/i;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const bearer = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!bearer) return res.status(401).json({ error: "يرجى تسجيل الدخول" });

  // ما ننشئ طلب إذا ميسر مو مضبوط — عشان ما يدفع الزبون ويفشل التأكيد بعدين
  const payment = paymentReadiness(process.env);
  if (!payment.ready) {
    console.error("moyasar not ready:", payment.problem);
    return res.status(503).json({ error: "الدفع غير متاح مؤقتًا. حاول بعد شوي." });
  }

  const { id, name, phone, address } = req.body || {};
  if (typeof id !== "string" || !UUID.test(id)) return res.status(400).json({ error: "طلب غير صالح" });

  try {
    const { data: auth, error: authError } = await supabaseAdmin.auth.getUser(bearer);
    if (authError || !auth?.user) return res.status(401).json({ error: "يرجى تسجيل الدخول مجددًا" });

    const { data: quote, error: quoteError } = await supabaseAdmin
      .from("print_quotes").select("id, city, status, order_id")
      .eq("id", id).eq("customer_id", auth.user.id).maybeSingle();
    if (quoteError) return res.status(503).json({ error: "تعذر قراءة العرض، حاول مرة ثانية" });
    if (!quote) return res.status(404).json({ error: "العرض غير موجود" });
    if (quote.status === "accepted" && quote.order_id) return res.status(200).json({ orderId: quote.order_id });
    if (quote.status !== "offered") return res.status(409).json({ error: "العرض ما عاد متاحًا للموافقة. حدّث الصفحة" });

    let recipient;
    try { recipient = quoteRecipient(quote, { name, phone, address }, validateShipping); }
    catch (err) { return res.status(err.status || 400).json({ error: err.message }); }

    const { data: orderId, error } = await supabaseAdmin.rpc("accept_print_quote", {
      p_id: id, p_customer: auth.user.id, ...recipient,
    });
    if (error || !orderId) {
      console.error("accept-quote", error);
      return res.status(409).json({ error: "تعذر اعتماد العرض. حدّث الصفحة وحاول مرة ثانية" });
    }
    return res.status(200).json({ orderId });
  } catch (err) {
    if (err instanceof CheckoutError) return res.status(err.status).json({ error: err.message });
    console.error("accept-quote", err);
    return res.status(500).json({ error: "صار خطأ غير متوقع، حاول مرة ثانية" });
  }
}
