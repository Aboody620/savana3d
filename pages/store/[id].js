import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { addToCart } from "../../lib/cart";
import { useLanguage } from "../../lib/LanguageContext";
import { getT } from "../../lib/translations";
import QuoteRequestForm from "../../components/QuoteRequestForm";

export default function DesignDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { lang, dir } = useLanguage();
  const t = getT(lang);

  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

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

  const isQuote = design.pricing_mode === "quote";
  const images = (design.preview_image_urls?.length ? design.preview_image_urls : [design.preview_image_url]).filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/store"
        className="inline-flex items-center gap-1 text-graphite dark:text-[#e7ebe6] text-sm font-medium mb-5 hover:text-gold"
      >
        <span>{dir === "rtl" ? "→" : "←"}</span>
        <span>{t("detail_back")}</span>
      </Link>

      <div className="grid gap-6 md:gap-10 md:grid-cols-[1.05fr_0.95fr] items-start">
        <div className="rounded-3xl overflow-hidden border border-line dark:border-[#323b37] bg-[#e2e6df] dark:bg-[#232a27] md:sticky md:top-24">
        <div className="aspect-square">
          {images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[Math.min(activeImage, images.length - 1)]}
              alt={design.title}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-300">
              {t("store_no_preview")}
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-3 border-t border-line dark:border-[#323b37]" role="list">
            {images.map((url, index) => (
              <button
                key={url}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`${design.title} ${index + 1}`}
                aria-current={index === activeImage}
                className={`h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border-2 ${index === activeImage ? "border-teal" : "border-transparent"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        </div>
        <div className="md:pt-2">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-graphite dark:text-[#e7ebe6] leading-tight mb-3">{design.title}</h1>

          <div className="flex flex-wrap gap-2 text-sm text-[#4a5551] dark:text-gray-400 mb-5">
            {design.print_time_hours && (
              <span className="rounded-full border border-line dark:border-[#323b37] px-3 py-1">{t("card_print_time")}: {design.print_time_hours} {t("card_hours")}</span>
            )}
            {design.material && <span className="rounded-full border border-line dark:border-[#323b37] px-3 py-1">{design.material}</span>}
            <span className="rounded-full border border-line dark:border-[#323b37] px-3 py-1">{design.multi_color ? t("card_colors_multi") : t("card_colors_one")}</span>
          </div>

          <p className="text-[#4a5551] dark:text-gray-400 mb-7 whitespace-pre-wrap max-w-[60ch]">{design.description}</p>

          {isQuote ? (
            <QuoteRequestForm designId={design.id} lang={lang} />
          ) : (
            <>
          <div className="flex items-baseline justify-between border-y border-line dark:border-[#323b37] py-4 mb-6">
            <span className="text-gray-500 text-sm">{t("detail_price_label")}</span>
            <span className="font-display text-3xl font-bold text-gold">{design.price} {t("riyal")}</span>
          </div>

          {!added ? (
            <button
              onClick={handleAddToCart}
              className="w-full bg-gold text-white py-3.5 rounded-xl font-display font-semibold hover:bg-[#bf3e0b] transition-colors"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
