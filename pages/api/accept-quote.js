import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { CheckoutError, validateShipping } from "../../lib/checkout";
import { buildQuoteOrder } from "../../lib/quoteOrder";

// الزبون يوافق على عرض الطابع: نحجز العرض، ننشئ طلب بانتظار الدفع بنفس السعر
// المحفوظ (مو اللي يرسله المتصفح)، ونربطه بالطابع اللي سعّر.
const UUID = /^[0-9a-f-]{36}$/i;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const bearer = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!bearer) return res.status(401).json({ error: "يرجى تسجيل الدخول" });

  const { id, name, phone, address } = req.body || {};
  if (typeof id !== "string" || !UUID.test(id)) return res.status(400).json({ error: "طلب غير صالح" });

  try {
    const { data: auth, error: authError } = await supabaseAdmin.auth.getUser(bearer);
    if (authError || !auth?.user) return res.status(401).json({ error: "يرجى تسجيل الدخول مجددًا" });

    const { data: quote, error: quoteError } = await supabaseAdmin
      .from("print_quotes").select("*").eq("id", id).eq("customer_id", auth.user.id).maybeSingle();
    if (quoteError) return res.status(503).json({ error: "تعذر قراءة العرض، حاول مرة ثانية" });
    if (!quote) return res.status(404).json({ error: "العرض غير موجود" });
    // ضغطة مكررة بعد الموافقة: نرجّع نفس الطلب بدل ما ننشئ طلب ثاني
    if (quote.status === "accepted" && quote.order_id) return res.status(200).json({ orderId: quote.order_id });
    if (quote.status !== "offered" || !quote.printer_id) {
      return res.status(409).json({ error: "العرض ما عاد متاحًا للموافقة" });
    }

    let row;
    try { row = buildQuoteOrder(quote, { name, phone, address }, validateShipping); }
    catch (err) { return res.status(err.status || 400).json({ error: err.message }); }

    // نحجز العرض أول (يمنع إنشاء طلبين لو انضغط الزر مرتين بنفس اللحظة)
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from("print_quotes").update({ status: "accepted" })
      .eq("id", id).eq("status", "offered").select("id");
    if (claimError) return res.status(503).json({ error: "تعذر حفظ الموافقة، حاول مرة ثانية" });
    if (!claimed?.length) return res.status(409).json({ error: "العرض ما عاد متاحًا للموافقة. حدّث الصفحة" });

    const { data: order, error: insertError } = await supabaseAdmin
      .from("orders").insert(row).select("id").single();
    if (insertError || !order) {
      await supabaseAdmin.from("print_quotes").update({ status: "offered" }).eq("id", id).eq("status", "accepted");
      console.error("accept-quote insert", insertError);
      return res.status(500).json({ error: "تعذر إنشاء الطلب، حاول مرة ثانية" });
    }

    const { error: linkError } = await supabaseAdmin
      .from("print_quotes").update({ order_id: order.id }).eq("id", id);
    if (linkError) console.error("accept-quote link", linkError);
    return res.status(200).json({ orderId: order.id });
  } catch (err) {
    if (err instanceof CheckoutError) return res.status(err.status).json({ error: err.message });
    console.error("accept-quote", err);
    return res.status(500).json({ error: "صار خطأ غير متوقع، حاول مرة ثانية" });
  }
}
