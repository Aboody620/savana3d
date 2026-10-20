import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { designsPathFromUrl } from "../../../lib/storagePath";

// رابط تحميل مؤقت (10 دقائق) لملف التصميم — فقط لصاحب الحق:
//  - المصمم: ملفات تصاميمه
//  - صاحب الطابعة: ملف الطلب المدفوع اللي قبله
//  - الزبون: ملف طلبه المخصص اللي رفعه بنفسه
const UUID = /^[0-9a-f-]{36}$/i;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const bearer = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!bearer) return res.status(401).json({ error: "يرجى تسجيل الدخول" });

  try {
    const { data: auth, error: authError } = await supabaseAdmin.auth.getUser(bearer);
    if (authError || !auth?.user) return res.status(401).json({ error: "يرجى تسجيل الدخول مجددًا" });
    const userId = auth.user.id;
    const { orderId, designId, quoteId } = req.body || {};

    let fileUrl = null;
    const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
    const isAdmin = Boolean(adminRow);

    if (isAdmin && typeof orderId === "string" && UUID.test(orderId)) {
      // صاحب المتجر يحمّل ملف أي طلب عشان يرسله للطابع
      const { data: order } = await supabaseAdmin
        .from("orders").select("custom_file_url, designs(file_url)").eq("id", orderId).maybeSingle();
      fileUrl = order?.custom_file_url || order?.designs?.file_url || null;
    } else if (isAdmin && typeof designId === "string" && UUID.test(designId)) {
      const { data: design } = await supabaseAdmin.from("designs").select("file_url").eq("id", designId).maybeSingle();
      fileUrl = design?.file_url || null;
    } else if (typeof designId === "string" && UUID.test(designId)) {
      const { data: design } = await supabaseAdmin
        .from("designs").select("designer_id, file_url").eq("id", designId).maybeSingle();
      if (design && design.designer_id === userId) fileUrl = design.file_url;
    } else if (typeof orderId === "string" && UUID.test(orderId)) {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("customer_id, printer_id, payment_status, custom_file_url, designs(file_url)")
        .eq("id", orderId).maybeSingle();
      if (order) {
        const isPrinter = order.printer_id === userId && order.payment_status === "paid";
        const isOwnCustomFile = order.customer_id === userId && order.custom_file_url;
        if (isPrinter) fileUrl = order.custom_file_url || order.designs?.file_url;
        else if (isOwnCustomFile) fileUrl = order.custom_file_url;
      }
    } else if (typeof quoteId === "string" && UUID.test(quoteId)) {
      // صاحب الطابعة يحمّل الملف عشان يقيّمه قبل ما يرسل السعر
      const [{ data: profile }, { data: quote }] = await Promise.all([
        supabaseAdmin.from("profiles").select("role").eq("id", userId).maybeSingle(),
        supabaseAdmin.from("print_quotes").select("status, printer_id, designs(file_url)").eq("id", quoteId).maybeSingle(),
      ]);
      const canAssess = profile?.role === "printer" && quote &&
        (quote.status === "open" || (quote.status === "offered" && quote.printer_id === userId));
      if (canAssess) fileUrl = quote.designs?.file_url;
    } else {
      return res.status(400).json({ error: "طلب غير صالح" });
    }

    if (!fileUrl) return res.status(403).json({ error: "ما عندك صلاحية لهذا الملف" });
    const path = designsPathFromUrl(fileUrl, process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (!path) return res.status(404).json({ error: "الملف غير موجود" });

    const { data, error } = await supabaseAdmin.storage.from("designs").createSignedUrl(path, 600, { download: true });
    if (error || !data?.signedUrl) return res.status(404).json({ error: "تعذر تجهيز الملف" });
    return res.status(200).json({ url: data.signedUrl });
  } catch (err) {
    console.error("file download", err);
    return res.status(500).json({ error: "تعذر تجهيز الملف" });
  }
}
