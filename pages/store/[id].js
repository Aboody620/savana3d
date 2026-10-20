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
      <Link href="/store" className="inline-flex items-center gap-1 text-sm font-medium text-[#5d6864] dark:text-gray-400 mb-4 hover:text-gold">
        <span aria-hidden="true">{dir === "rtl" ? "→" : "←"}</span>
        <span>{lang === "ar" ? "المتجر" : "Store"}</span>
      </Link>

      <div className="grid gap-6 md:gap-12 md:grid-cols-2 items-start">
        <div className="md:sticky md:top-24">
          <div className="aspect-square rounded-3xl overflow-hidden bg-[#e2e6df] dark:bg-[#232a27]">
            {images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[Math.min(activeImage, images.length - 1)]} alt={design.title} className="h-full w-full object-contain" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[#7b8681]">{t("store_no_preview")}</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto mt-3">
              {images.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`${design.title} ${index + 1}`}
                  aria-current={index === activeImage}
                  className={`h-16 w-16 shrink-0 rounded-xl overflow-hidden ring-2 ${index === activeImage ? "ring-gold" : "ring-transparent opacity-70"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:pt-4">
          <h1 className="font-bold text-3xl sm:text-4xl text-graphite dark:text-[#e7ebe6] leading-tight">{design.title}</h1>
          {!isQuote && <p className="mt-3 text-3xl font-bold text-gold">{design.price} {t("riyal")}</p>}
          {design.description && (
            <p className="mt-5 text-[#4a5551] dark:text-gray-400 whitespace-pre-wrap max-w-[60ch]">{design.description}</p>
          )}
          {design.material && (
            <p className="mt-3 text-sm text-[#7b8681]">{lang === "ar" ? "الخامة" : "Material"}: {design.material}</p>
          )}

          <div className="mt-7">
            {isQuote ? (
              <QuoteRequestForm designId={design.id} lang={lang} />
            ) : added ? (
              <Link href="/cart" className="block w-full text-center bg-graphite text-white py-4 rounded-2xl font-bold hover:opacity-90">
                {lang === "ar" ? "انضاف للسلة · روح للسلة" : "Added · Go to cart"}
              </Link>
            ) : (
              <button onClick={handleAddToCart} className="w-full bg-gold text-white py-4 rounded-2xl font-bold hover:bg-[#bf3e0b] transition-colors">
                {t("store_add_to_cart")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
