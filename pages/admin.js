import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";
import { parseColors, swatchFor } from "../lib/colors";

// لوحة صاحب المتجر: الطلبات المدفوعة والمنتجات.
// الصلاحية الحقيقية في قاعدة البيانات (is_admin + سياسات RLS)؛ هذي الصفحة واجهة فقط.

const STATUS = {
  pending: { label: "طلب جديد", tone: "bg-gold text-white" },
  accepted: { label: "طلب جديد", tone: "bg-gold text-white" },
  printing: { label: "عند الطابع", tone: "bg-[#f6d9c9] text-[#8a3208]" },
  shipped: { label: "تم الشحن", tone: "bg-teal/15 text-teal" },
  completed: { label: "مكتمل", tone: "bg-[#e2e6df] text-[#4a5551]" },
  cancelled: { label: "ملغي", tone: "bg-red-50 text-red-700" },
};
const CATEGORIES = [["decor", "ديكور"], ["home", "أدوات منزلية"], ["toys", "ألعاب وهدايا"], ["hobby", "هوايات"], ["edu", "تعليمي"]];
const field = "w-full rounded-xl border border-line bg-white px-3 py-2.5 mt-1";

async function downloadFile(body) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch("/api/files/download", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` },
    body: JSON.stringify(body),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok || !result.url) throw new Error(result.error || "تعذر تحميل الملف");
  window.location.href = result.url;
}

export default function Admin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null);
  const [tab, setTab] = useState("orders");

  useEffect(() => {
    if (!user) return;
    supabase.rpc("is_admin").then(({ data }) => setIsAdmin(Boolean(data)));
  }, [user]);

  if (loading || (user && isAdmin === null)) return <p className="text-center py-20">جاري التحميل…</p>;
  if (!user) return <p className="text-center py-20"><Link href="/login" className="text-gold font-semibold">سجّل الدخول</Link></p>;
  if (!isAdmin) return <p className="text-center py-20">هذي الصفحة لصاحب المتجر فقط.</p>;

  return (
    <div dir="rtl">
      <Head><title>لوحة المتجر | Savana3D</title><meta name="robots" content="noindex,nofollow" /></Head>
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <h1 className="font-bold text-3xl text-graphite me-auto">لوحة المتجر</h1>
        {[["orders", "الطلبات"], ["products", "المنتجات"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} aria-pressed={tab === key}
            className={`rounded-full px-5 py-2 font-semibold ${tab === key ? "bg-graphite text-white" : "text-graphite hover:bg-graphite/5"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "orders" ? <Orders /> : <Products userId={user.id} />}
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [tracking, setTracking] = useState({});
  const [filter, setFilter] = useState("open");

  const load = useCallback(async () => {
    const { data, error: e } = await supabase
      .from("orders")
      .select("*, designs(title, file_url)")
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false })
      .limit(200);
    if (e) setError("تعذر تحميل الطلبات");
    setOrders(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function move(order, status, extra = {}) {
    setBusy(order.id); setError("");
    const { error: e } = await supabase.from("orders").update({ status, ...extra }).eq("id", order.id).eq("status", order.status);
    setBusy(null);
    if (e) { setError("تعذر تحديث الطلب. حدّث الصفحة وحاول مرة ثانية."); return; }
    load();
  }

  if (!orders) return <p>جاري تحميل الطلبات…</p>;
  const open = orders.filter((o) => !["completed", "cancelled"].includes(o.status));
  const shown = filter === "open" ? open : orders;
  const sales = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total_price) + Number(o.shipping_cost || 0), 0);

  return (
    <section>
      <div className="flex flex-wrap gap-6 mb-6 text-sm text-[#4a5551]">
        <p><span className="text-2xl font-bold text-graphite">{open.length}</span> طلب مفتوح</p>
        <p><span className="text-2xl font-bold text-graphite">{orders.length}</span> طلب مدفوع</p>
        <p><span className="text-2xl font-bold text-graphite">{sales.toFixed(0)}</span> ريال مبيعات</p>
        <div className="ms-auto flex gap-1">
          {[["open", "المفتوحة"], ["all", "الكل"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} aria-pressed={filter === k}
              className={`rounded-full px-4 py-1.5 font-semibold ${filter === k ? "bg-graphite text-white" : "hover:bg-graphite/5"}`}>{l}</button>
          ))}
        </div>
      </div>
      {error && <p role="alert" className="text-red-600 mb-4">{error}</p>}
      {shown.length === 0 && <p className="py-12 text-center text-[#5d6864]">ما فيه طلبات {filter === "open" ? "مفتوحة" : ""} حاليًا.</p>}
      <ul className="space-y-4">
        {shown.map((o) => {
          const st = STATUS[o.status] || { label: o.status, tone: "bg-[#e2e6df]" };
          const local = /المدينة|المدينه|madinah|medina/i.test(o.shipping_city || "");
          return (
            <li key={o.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start gap-3 mb-3">
                <div className="me-auto">
                  <p className="font-bold text-lg text-graphite">{o.designs?.title || "طلب طباعة"} × {o.quantity || 1}</p>
                  <p className="text-sm text-[#5d6864]">
                    {[o.color, o.quality === "high" ? "جودة عالية" : "جودة عادية"].filter(Boolean).join(" · ")}
                    {" · "}{new Date(o.created_at).toLocaleDateString("ar-SA-u-ca-gregory", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${st.tone}`}>{st.label}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-[#3d4744] mb-4">
                <p><span className="text-[#7b8681]">الزبون: </span>{o.shipping_name}</p>
                <p><span className="text-[#7b8681]">الجوال: </span><a dir="ltr" href={`tel:+${o.shipping_phone}`} className="text-gold">+{o.shipping_phone}</a></p>
                <p className="sm:col-span-2"><span className="text-[#7b8681]">العنوان: </span>{o.shipping_city} — {o.shipping_address}</p>
                <p><span className="text-[#7b8681]">المبلغ: </span>{o.total_price} + توصيل {o.shipping_cost} ريال</p>
                <p><span className="text-[#7b8681]">التوصيل: </span>{local ? "أوصله بنفسي (داخل المدينة)" : "شحن عن طريق OTO"}</p>
                {o.notes && <p className="sm:col-span-2"><span className="text-[#7b8681]">ملاحظات: </span>{o.notes}</p>}
                {o.tracking_number && <p className="sm:col-span-2"><span className="text-[#7b8681]">رقم التتبع: </span>{o.tracking_number}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(o.designs?.file_url || o.custom_file_url) && (
                  <button onClick={() => downloadFile({ orderId: o.id }).catch((e) => setError(e.message))}
                    className="rounded-xl border border-graphite/60 px-4 py-2 text-sm font-semibold">تحميل ملف التصميم للطابع</button>
                )}
                {["pending", "accepted"].includes(o.status) && (
                  <button disabled={busy === o.id} onClick={() => move(o, "printing")}
                    className="rounded-xl bg-gold text-white px-4 py-2 text-sm font-bold disabled:opacity-50">أرسلته للطابع</button>
                )}
                {o.status === "printing" && (
                  <>
                    {!local && (
                      <input value={tracking[o.id] || ""} onChange={(e) => setTracking({ ...tracking, [o.id]: e.target.value })}
                        placeholder="رقم التتبع (اختياري)" className="rounded-xl border border-line px-3 py-2 text-sm" />
                    )}
                    <button disabled={busy === o.id}
                      onClick={() => move(o, "shipped", tracking[o.id]?.trim() ? { tracking_number: tracking[o.id].trim().slice(0, 100) } : {})}
                      className="rounded-xl bg-graphite text-white px-4 py-2 text-sm font-bold disabled:opacity-50">
                      {local ? "طلع للتوصيل" : "تم الشحن"}
                    </button>
                  </>
                )}
                {o.status === "shipped" && (
                  <button disabled={busy === o.id} onClick={() => move(o, "completed")}
                    className="rounded-xl bg-teal text-white px-4 py-2 text-sm font-bold disabled:opacity-50">وصل للزبون</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Products({ userId }) {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | design
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: e } = await supabase.from("designs").select("*").order("created_at", { ascending: false });
    if (e) setError("تعذر تحميل المنتجات");
    setItems(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggle(d) {
    const { error: e } = await supabase.from("designs").update({ is_active: !d.is_active }).eq("id", d.id);
    if (e) setError("تعذر التحديث"); else load();
  }

  if (editing) return <ProductForm userId={userId} design={editing === "new" ? null : editing} onDone={() => { setEditing(null); load(); }} />;
  if (!items) return <p>جاري تحميل المنتجات…</p>;

  return (
    <section>
      <button onClick={() => setEditing("new")} className="mb-6 rounded-2xl bg-gold text-white px-6 py-3 font-bold">+ إضافة منتج</button>
      {error && <p role="alert" className="text-red-600 mb-4">{error}</p>}
      {items.length === 0 && <p className="py-12 text-center text-[#5d6864]">ما فيه منتجات للحين. أضف أول منتج.</p>}
      <ul className="grid gap-3">
        {items.map((d) => (
          <li key={d.id} className={`flex items-center gap-4 rounded-2xl border border-line bg-white p-3 ${d.is_active === false ? "opacity-60" : ""}`}>
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#e2e6df]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {d.preview_image_url && <img src={d.preview_image_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 me-auto">
              <p className="font-bold text-graphite truncate">{d.title}</p>
              <p className="text-sm text-[#5d6864]">
                {d.price} ريال{d.price_high ? ` · عالية ${d.price_high}` : ""}
                {d.colors?.length ? ` · ${d.colors.length} ألوان` : ""}
                {d.is_active === false ? " · مخفي" : ""}
              </p>
            </div>
            <button onClick={() => toggle(d)} className="text-sm font-semibold px-3 py-2 rounded-xl hover:bg-graphite/5">
              {d.is_active === false ? "إظهار" : "إخفاء"}
            </button>
            <button onClick={() => setEditing(d)} className="text-sm font-semibold px-3 py-2 rounded-xl border border-line">تعديل</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductForm({ userId, design, onDone }) {
  const [v, setV] = useState({
    title: design?.title || "",
    description: design?.description || "",
    category: design?.category || "decor",
    price: design?.price ?? "",
    price_high: design?.price_high ?? "",
    colors: (design?.colors || []).join("، "),
    lead_time_days: design?.lead_time_days ?? 3,
  });
  const [images, setImages] = useState([]);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const colors = parseColors(v.colors);

  async function upload(bucket, f) {
    const ext = (f.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: e } = await supabase.storage.from(bucket).upload(path, f);
    if (e) throw e;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async function save(e) {
    e.preventDefault();
    const price = Number(v.price);
    const priceHigh = v.price_high === "" ? null : Number(v.price_high);
    if (!v.title.trim()) return setError("اكتب اسم المنتج");
    if (!(price > 0)) return setError("اكتب سعر صحيح");
    if (priceHigh !== null && !(priceHigh > price)) return setError("سعر الجودة العالية لازم يكون أعلى من العادي، أو خلّه فاضي");
    if (!design && images.length === 0) return setError("أضف صورة واحدة على الأقل");
    if (images.some((f) => !/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 5 * 1024 * 1024)) return setError("الصور لازم تكون JPG أو PNG أو WEBP وأقل من 5MB");
    if (file && (!/\.(stl|obj|3mf|step|stp)$/i.test(file.name) || file.size > 50 * 1024 * 1024)) return setError("ملف التصميم لازم يكون STL أو OBJ أو 3MF وأقل من 50MB");

    setBusy(true); setError("");
    try {
      const imageUrls = [];
      for (const img of images) imageUrls.push(await upload("previews", img));
      const fileUrl = file ? await upload("designs", file) : null;
      const row = {
        title: v.title.trim().slice(0, 120),
        description: v.description.trim().slice(0, 2000) || null,
        category: v.category,
        price,
        price_high: priceHigh,
        colors,
        lead_time_days: Math.min(30, Math.max(1, Number(v.lead_time_days) || 3)),
        pricing_mode: "fixed",
        ...(imageUrls.length ? { preview_image_url: imageUrls[0], preview_image_urls: imageUrls } : {}),
        ...(fileUrl ? { file_url: fileUrl } : {}),
      };
      const { error: dbError } = design
        ? await supabase.from("designs").update(row).eq("id", design.id)
        : await supabase.from("designs").insert({ ...row, designer_id: userId, file_url: fileUrl || "", is_active: true });
      if (dbError) throw dbError;
      onDone();
    } catch (err) {
      setError(`تعذر الحفظ: ${err.message || "حاول مرة ثانية"}`);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-5">
      <h2 className="font-bold text-2xl text-graphite">{design ? "تعديل المنتج" : "منتج جديد"}</h2>
      <label className="block font-medium">اسم المنتج<input value={v.title} onChange={set("title")} required maxLength={120} className={field} /></label>
      <label className="block font-medium">الوصف<textarea value={v.description} onChange={set("description")} rows={3} maxLength={2000} className={field}
        placeholder="المقاس، الاستخدام، أي تفاصيل تهم الزبون" /></label>
      <div className="grid sm:grid-cols-3 gap-4">
        <label className="block font-medium">السعر (ريال)<input type="number" inputMode="decimal" min="1" step="0.5" value={v.price} onChange={set("price")} required className={field} /></label>
        <label className="block font-medium">سعر الجودة العالية<input type="number" inputMode="decimal" min="1" step="0.5" value={v.price_high} onChange={set("price_high")} className={field} placeholder="اختياري" /></label>
        <label className="block font-medium">مدة التجهيز (أيام)<input type="number" min="1" max="30" value={v.lead_time_days} onChange={set("lead_time_days")} className={field} /></label>
      </div>
      <label className="block font-medium">الألوان المتوفرة
        <input value={v.colors} onChange={set("colors")} className={field} placeholder="مثلًا: أسود، أبيض، رمادي" />
        <span className="text-sm font-normal text-[#5d6864]">افصل بينها بفاصلة. اتركها فاضية لو المنتج بلون واحد.</span>
      </label>
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <span key={c} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm">
              <span className="h-3.5 w-3.5 rounded-full border border-black/15" style={{ background: swatchFor(c) }} />{c}
            </span>
          ))}
        </div>
      )}
      <label className="block font-medium">التصنيف
        <select value={v.category} onChange={set("category")} className={field}>
          {CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
      <label className="block font-medium">{design ? "صور جديدة (تستبدل الحالية)" : "صور المنتج"}
        <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => setImages(Array.from(e.target.files || []))} className="block mt-2 text-sm" />
        <span className="text-sm font-normal text-[#5d6864]">أول صورة هي الرئيسية. صور حقيقية للقطعة المطبوعة تبيع أكثر.</span>
      </label>
      <label className="block font-medium">ملف التصميم للطابع (STL / OBJ / 3MF){design?.file_url ? " — موجود، ارفع ملف جديد لو تبي تستبدله" : ""}
        <input type="file" accept=".stl,.obj,.3mf,.step,.stp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block mt-2 text-sm" />
        <span className="text-sm font-normal text-[#5d6864]">خاص، ما يشوفه الزبون. تحمّله من الطلب وترسله للطابع.</span>
      </label>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button disabled={busy} className="rounded-2xl bg-gold text-white px-8 py-3 font-bold disabled:opacity-50">{busy ? "جاري الحفظ…" : design ? "حفظ التعديلات" : "نشر المنتج"}</button>
        <button type="button" onClick={onDone} className="rounded-2xl px-6 py-3 font-semibold hover:bg-graphite/5">إلغاء</button>
      </div>
    </form>
  );
}
