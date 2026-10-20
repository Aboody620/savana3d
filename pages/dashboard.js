import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../lib/LanguageContext";

// طلباتي: الزبون يتابع طلباته من الدفع إلى الوصول
const STEPS = ["pending", "printing", "shipped", "completed"];
const LABELS = {
  ar: { pending_payment: "بانتظار الدفع", pending: "استلمنا طلبك", accepted: "استلمنا طلبك", printing: "قيد الطباعة", shipped: "في الطريق لك", completed: "وصل", cancelled: "ملغي" },
  en: { pending_payment: "Awaiting payment", pending: "Order received", accepted: "Order received", printing: "Printing", shipped: "On its way", completed: "Delivered", cancelled: "Cancelled" },
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { lang } = useLanguage();
  const ar = lang !== "en";
  const L = LABELS[ar ? "ar" : "en"];
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*, designs(title, preview_image_url)")
      .eq("customer_id", user.id)
      .neq("payment_status", "unpaid")
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data || []));
  }, [user]);

  if (loading) return <p className="text-center py-20">{ar ? "جاري التحميل…" : "Loading…"}</p>;
  if (!user) {
    return (
      <p className="text-center py-20">
        <Link href="/login" className="text-gold font-semibold">{ar ? "سجّل الدخول لمتابعة طلباتك" : "Log in to see your orders"}</Link>
      </p>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Head><title>{ar ? "طلباتي | Savana3D" : "My orders | Savana3D"}</title><meta name="robots" content="noindex,nofollow" /></Head>
      <h1 className="font-bold text-3xl text-graphite dark:text-[#e7ebe6] mb-8">{ar ? "طلباتي" : "My orders"}</h1>

      {!orders ? (
        <p>{ar ? "جاري تحميل طلباتك…" : "Loading your orders…"}</p>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-bold text-lg mb-3">{ar ? "ما عندك طلبات للحين" : "No orders yet"}</p>
          <Link href="/store" className="text-gold font-semibold">{ar ? "تصفّح المتجر" : "Browse the store"}</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => {
            const step = Math.max(0, STEPS.indexOf(o.status === "accepted" ? "pending" : o.status));
            return (
              <li key={o.id} className="rounded-2xl border border-line dark:border-[#323b37] bg-white dark:bg-[#1a201e] p-5">
                <div className="flex gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#e2e6df] dark:bg-[#232a27]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {o.designs?.preview_image_url && <img src={o.designs.preview_image_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 me-auto">
                    <p className="font-bold text-graphite dark:text-[#e7ebe6]">{o.designs?.title || (ar ? "طلب طباعة" : "Print order")} × {o.quantity || 1}</p>
                    <p className="text-sm text-[#5d6864] dark:text-gray-400">
                      {[o.color, o.quality === "high" ? (ar ? "جودة عالية" : "High quality") : null].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-sm text-[#5d6864] dark:text-gray-400">
                      {Number(o.total_price) + Number(o.shipping_cost || 0)} {ar ? "ريال" : "SAR"} · {new Date(o.created_at).toLocaleDateString(ar ? "ar-SA-u-ca-gregory" : "en-GB")}
                    </p>
                  </div>
                  <span className="self-start rounded-full bg-gold/10 text-gold px-3 py-1 text-sm font-semibold">{L[o.status] || o.status}</span>
                </div>

                {o.status !== "cancelled" && (
                  <ol className="mt-5 grid grid-cols-4 gap-1" aria-label={ar ? "حالة الطلب" : "Order progress"}>
                    {STEPS.map((s, i) => (
                      <li key={s} className="text-center">
                        <span className={`block h-1.5 rounded-full ${i <= step ? "bg-gold" : "bg-[#e2e6df] dark:bg-[#323b37]"}`} />
                        <span className={`mt-1.5 block text-[11px] sm:text-xs ${i <= step ? "text-graphite dark:text-[#e7ebe6] font-semibold" : "text-[#7b8681]"}`}>{L[s]}</span>
                      </li>
                    ))}
                  </ol>
                )}

                {(o.tracking_number || o.tracking_url) && (
                  <p className="mt-4 text-sm">
                    {ar ? "رقم التتبع" : "Tracking"}: <span className="font-semibold">{o.tracking_number}</span>
                    {o.shipping_carrier && ` (${o.shipping_carrier})`}
                    {o.tracking_url && (
                      <a href={o.tracking_url} target="_blank" rel="noopener noreferrer" className="ms-3 text-gold font-semibold">{ar ? "تتبّع الشحنة" : "Track"}</a>
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
