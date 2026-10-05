import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function OrderPickupForm({ orderId, lang }) {
  const en = lang === "en";
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [prepared, setPrepared] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setMessage("");
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error(en ? "Please sign in again." : "يرجى تسجيل الدخول مجددًا");
      const response = await fetch("/api/shipping/prepare", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ orderId,
          sender: { name: values.name, phone: values.phone, city: values.city, address: values.address, shortAddress: values.shortAddress },
          parcel: { weight: values.weight, width: values.width, length: values.length, height: values.height } }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setPrepared(true);
      setMessage(en ? `Prepared in OTO: ${result.orderId}. A shipping label has not been purchased.` : `تم تجهيز الطلب في OTO: ${result.orderId}. لم تُشترَ بوليصة شحن بعد.`);
    } catch (error) { setMessage(error.message || (en ? "Could not prepare shipping." : "تعذر تجهيز الشحن")); }
    finally { setBusy(false); }
  }
  const fields = [
    ["name", en ? "Sender name" : "اسم صاحب الطابعة", "text"],
    ["phone", en ? "Sender mobile" : "جوال صاحب الطابعة", "tel"],
    ["city", en ? "Pickup city" : "مدينة الاستلام", "text"],
    ["shortAddress", en ? "National short address (ABCD1234)" : "العنوان الوطني المختصر (ABCD1234)", "text"],
    ["address", en ? "Pickup address" : "العنوان التفصيلي للاستلام", "text"],
    ["weight", en ? "Parcel weight (kg)" : "وزن الطرد (كجم)", "number"],
    ["width", en ? "Width (cm)" : "العرض (سم)", "number"],
    ["length", en ? "Length (cm)" : "الطول (سم)", "number"],
    ["height", en ? "Height (cm)" : "الارتفاع (سم)", "number"],
  ];
  return <details className="my-4 rounded-xl border p-3">
    <summary className="cursor-pointer font-bold">{en ? "Prepare pickup from your address" : "تجهيز الاستلام من عنوانك"}</summary>
    <p className="my-3 text-sm">{en ? "Use the pickup address for this order. These details will be sent to OTO to prepare shipping. Buy the label in OTO after reviewing its price, then enter tracking below." : "أدخل عنوان الاستلام لهذا الطلب. سترسل البيانات إلى OTO لتجهيز الشحن. اشترِ البوليصة من لوحة OTO بعد مراجعة السعر، ثم أدخل رقم التتبع أدناه."}</p>
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <fieldset disabled={busy || prepared} className="contents">
        {fields.map(([name, label, type]) => <label key={name} className="min-w-0 text-sm">
          {label}<input name={name} type={type} required maxLength={name === "address" ? 500 : 100}
            min={type === "number" ? "0.001" : undefined} max={type === "number" ? "1000" : undefined}
            step={type === "number" ? "any" : undefined}
            className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>)}
        <button className="rounded-lg bg-navy px-4 py-2 text-white sm:col-span-2" type="submit">
          {busy ? (en ? "Preparing…" : "جاري التجهيز…") : (en ? "Send pickup details to OTO" : "إرسال بيانات الاستلام إلى OTO")}
        </button>
      </fieldset>
      {message && <p role="status" className="break-words text-sm sm:col-span-2">{message}</p>}
    </form>
  </details>;
}
