import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import Head from "next/head";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";
import { useLanguage } from "../lib/LanguageContext";
import { getT } from "../lib/translations";

const SHIPPING_COST = 25;

const ALLOWED_DESIGN_EXTENSIONS = ["stl", "obj", "3mf", "step", "stp"];
const MAX_DESIGN_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function getExtension(fileName) {
  return (fileName.split(".").pop() || "").toLowerCase();
}

function validateDesignFile(file) {
  if (!file) return "upload_select_file_error";
  const ext = getExtension(file.name);
  if (!ALLOWED_DESIGN_EXTENSIONS.includes(ext)) return "upload_file_type_error";
  if (file.size > MAX_DESIGN_FILE_SIZE) return "upload_file_size_error";
  if (file.size === 0) return "upload_file_empty_error";
  return null;
}

export default function CustomOrder() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const t = getT(lang);

  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [shipping, setShipping] = useState({ name: "", phone: "", city: "", address: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeCheckout, setActiveCheckout] = useState(null); // { orderId, total }
  const [moyasarReady, setMoyasarReady] = useState(false);

  useEffect(() => {
    if (!activeCheckout || !moyasarReady || !window.Moyasar) return;

    window.Moyasar.init({
      element: ".mysr-form",
      amount: Math.round(activeCheckout.total * 100),
      currency: "SAR",
      description: `طلب تصميم مخصص Savana3D`,
      publishable_api_key: process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-success?order_ids=${activeCheckout.orderId}`,
      supported_networks: ["mada", "visa", "mastercard"],
      methods: ["creditcard"],
    });
  }, [activeCheckout, moyasarReady]);

  if (authLoading) return <p className="text-center">{t("dash_loading")}</p>;

  if (!user) {
    return (
      <p className="text-center text-gray-600">
        {lang === "en" ? "Log in to upload your own design." : "سجّل الدخول عشان ترفع تصميمك الخاص."}
      </p>
    );
  }

  function handleFileChange(e) {
    const selected = e.target.files[0];
    const errorKey = validateDesignFile(selected);
    if (errorKey) {
      setError(t(errorKey));
      setFile(null);
      e.target.value = "";
      return;
    }
    setError("");
    setFile(selected);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const fileErrorKey = validateDesignFile(file);
    if (fileErrorKey) {
      setError(t(fileErrorKey));
      return;
    }

    const numericPrice = parseFloat(price);
    if (!numericPrice || numericPrice <= 0) {
      setError(
        lang === "en"
          ? "Please enter a valid price"
          : "الرجاء إدخال سعر صحيح"
      );
      return;
    }

    setSubmitting(true);

    try {
      const fileExt = getExtension(file.name);
      const filePath = `custom/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("designs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: fileUrlData } = supabase.storage
        .from("designs")
        .getPublicUrl(filePath);

      const total = numericPrice + SHIPPING_COST;

      const { data: order, error: insertError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          design_id: null,
          custom_file_url: fileUrlData.publicUrl,
          total_price: numericPrice,
          shipping_cost: SHIPPING_COST,
          status: "pending_payment",
          payment_status: "unpaid",
          notes,
          shipping_name: shipping.name,
          shipping_phone: shipping.phone,
          shipping_city: shipping.city,
          shipping_address: shipping.address,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setActiveCheckout({ orderId: order.id, total });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <link href="https://cdn.moyasar.com/mpf/1.14.0/moyasar.css" rel="stylesheet" />
      </Head>
      <Script src="https://cdn.moyasar.com/mpf/1.14.0/moyasar.js" onLoad={() => setMoyasarReady(true)} />

      <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-navy mb-2">
          {lang === "en" ? "Upload Your Own Design" : "ارفع تصميمك الخاص"}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {lang === "en"
            ? "Upload your own STL/OBJ file to have it printed and delivered to you."
            : "ارفع ملف STL/OBJ الخاص بك عشان نطبعه ونوصله لك."}
        </p>

        {!activeCheckout && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("upload_design_file")}</label>
              <input
                type="file"
                required
                accept=".stl,.obj,.3mf,.step,.stp"
                onChange={handleFileChange}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {lang === "en" ? "Notes (optional)" : "ملاحظات (اختياري)"}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {lang === "en"
                  ? "Your offered price for printing (SAR)"
                  : "السعر اللي تعرضه للطباعة (ريال)"}
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
              <p className="text-xs text-gray-400 mt-1">
                {lang === "en"
                  ? "A printer owner will review and accept your order at this price."
                  : "صاحب الطابعة يراجع طلبك ويقبله بهذا السعر."}
              </p>
            </div>

            <div className="pt-2 border-t">
              <h2 className="font-bold text-navy text-sm mb-3">{t("cart_shipping_info")}</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder={t("cart_full_name")}
                  value={shipping.name}
                  onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
                <input
                  type="tel"
                  required
                  placeholder="05xxxxxxxx"
                  value={shipping.phone}
                  onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  required
                  placeholder={t("cart_city")}
                  value={shipping.city}
                  onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
                <textarea
                  required
                  rows={2}
                  placeholder={t("cart_address")}
                  value={shipping.address}
                  onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal text-white py-2.5 rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? t("cart_preparing") : t("cart_continue_payment")}
            </button>
          </form>
        )}

        {activeCheckout && (
          <div>
            <h2 className="font-bold text-navy mb-4">{t("cart_complete_payment")}</h2>
            <div className="mysr-form"></div>
          </div>
        )}
      </div>
    </>
  );
}
