import { supabaseAdmin } from "../../lib/supabaseAdmin";
import {
  CheckoutError,
  buildCustomOrder,
  buildStoreOrders,
  normalizeCartItems,
} from "../../lib/checkout";

// ينشئ الطلبات على السيرفر بأسعار قاعدة البيانات، ويرجّع المبلغ اللي لازم يندفع.
// المتصفح ما عاد يقدر يكتب بجدول orders مباشرة (انظر migration_server_checkout.sql).
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const bearer = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!bearer) return res.status(401).json({ error: "يرجى تسجيل الدخول" });

  try {
    const { data: auth, error: authError } = await supabaseAdmin.auth.getUser(bearer);
    if (authError || !auth?.user) return res.status(401).json({ error: "يرجى تسجيل الدخول مجددًا" });
    const customerId = auth.user.id;
    const body = req.body || {};

    let built;
    if (body.type === "store") {
      const items = normalizeCartItems(body.items);
      const { data: designs, error } = await supabaseAdmin
        .from("designs")
        .select("id, price, title, pricing_mode")
        .in("id", items.map((i) => i.id));
      if (error) throw new CheckoutError("تعذر قراءة المنتجات، حاول مرة ثانية", 503);
      built = buildStoreOrders({ customerId, items, designs, shipping: body.shipping });
    } else if (body.type === "custom") {
      built = buildCustomOrder({
        customerId,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        fileUrl: body.fileUrl,
        price: body.price,
        notes: body.notes,
        shipping: body.shipping,
      });
    } else {
      return res.status(400).json({ error: "نوع الطلب غير معروف" });
    }

    const { data: orders, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert(built.rows)
      .select("id, total_price, shipping_cost");
    if (insertError || !orders || orders.length !== built.rows.length) {
      console.error("checkout insert failed", insertError);
      return res.status(500).json({ error: "تعذر إنشاء الطلب، حاول مرة ثانية" });
    }

    // نحسب المبلغ من الصفوف المحفوظة نفسها — هي اللي بيقارن معها التحقق من الدفع
    const total = orders.reduce((sum, o) => sum + Number(o.total_price) + Number(o.shipping_cost), 0);
    return res.status(200).json({
      orderIds: orders.map((o) => o.id),
      total: Math.round(total * 100) / 100,
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return res.status(err.status).json({ error: err.message, missing: err.missing });
    }
    console.error(err);
    return res.status(500).json({ error: "صار خطأ غير متوقع، حاول مرة ثانية" });
  }
}
