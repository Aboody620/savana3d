import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { addToCart } from "../../lib/cart";
import { useLanguage } from "../../lib/LanguageContext";
import { getT } from "../../lib/translations";

export default function DesignDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { lang, dir } = useLanguage();
  const t = getT(lang);

  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function loadDesign() {
      const { data } = await supabase
        .from("designs")
        .select("*")
        .eq("id", id)
        .single();
      setDesign(data);
      setLoading(false);
    }
    loadDesign();
  }, [id]);

  function handleAddToCart() {
    addToCart(design);
    setAdded(true);
  }

  if (loading) return <p className="text-center">{t("detail_loading")}</p>;
  if (!design) return <p className="text-center">{t("detail_not_found")}</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/store"
        className="inline-flex items-center gap-1 text-navy text-sm font-medium mb-4 hover:opacity-70"
      >
        <span>{dir === "rtl" ? "→" : "←"}</span>
        <span>{t("detail_back")}</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="aspect-square bg-[#EEF2F6]">
          {design.preview_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={design.preview_image_url}
              alt={design.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-300">
              {t("store_no_preview")}
            </div>
          )}
        </div>

        <div className="p-6 md:p-8">
          <h1 className="text-2xl font-bold text-navy mb-2">{design.title}</h1>
          <p className="text-gray-600 mb-6">{design.description}</p>

          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-500 text-sm">{t("detail_price_label")}</span>
            <span className="text-2xl font-bold text-teal">{design.price} {t("riyal")}</span>
          </div>

          {!added ? (
            <button
              onClick={handleAddToCart}
              className="w-full bg-navy text-white py-3 rounded-xl font-bold hover:opacity-90 transition"
            >
              {t("store_add_to_cart")}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-teal/10 text-teal text-center py-3 rounded-xl font-bold">
                {t("detail_added")}
              </div>
              <div className="flex gap-3">
                <Link
                  href="/cart"
                  className="flex-1 text-center bg-teal text-white py-3 rounded-xl font-bold hover:opacity-90 transition"
                >
                  {t("detail_go_to_cart")}
                </Link>
                <Link
                  href="/store"
                  className="flex-1 text-center bg-gray-100 text-navy py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  {t("detail_continue_shopping")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
