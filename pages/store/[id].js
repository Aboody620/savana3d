import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { addToCart } from "../../lib/cart";
import { useLanguage } from "../../lib/LanguageContext";
import { getT } from "../../lib/translations";
import { swatchFor } from "../../lib/colors";
import { LOCAL_SHIPPING_COST, SHIPPING_COST } from "../../lib/checkout";

export default function DesignDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { lang, dir } = useLanguage();
  const t = getT(lang);
  const ar = lang === "ar";

  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState("");
  const [quality, setQuality] = useState("standard");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    supabase.from("designs").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      const usable = data && data.is_active !== false && data.pricing_mode !== "quote" ? data : null;
      setDesign(usable);
      if (usable?.colors?.length === 1) setColor(usable.colors[0]);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p className="text-center py-20">{t("detail_loading")}</p>;
  if (!design) {
    return (
      <div className="py-20 text-center">
        <p className="font-bold text-lg mb-3">{ar ? "المنتج غير متوفر" : "This product isn't available"}</p>
        <Link href="/store" className="text-gold font-semibold">{ar ? "ارجع للمتجر" : "Back to the store"}</Link>
      </div>
    );
  }

  const colors = design.colors || [];
  const hasHigh = Number(design.price_high) > 0;
  const price = quality === "high" && hasHigh ? design.price_high : design.price;
  const images = (design.preview_image_urls?.length ? design.preview_image_urls : [design.preview_image_url]).filter(Boolean);
  const lead = design.lead_time_days || 3;

  function handleAddToCart() {
    if (colors.length > 0 && !color) {
      setError(ar ? "اختر اللون أول" : "Choose a color first");
      return;
    }
    setError("");
    addToCart(design, { color, quality });
    setAdded(true);
  }

  const option = (active) =>
    `rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
      active
        ? "border-graphite bg-graphite text-white dark:bg-[#F2F2EF] dark:text-[#0E0E0D]"
        : "border-line dark:border-[#2E2E2B] text-graphite dark:text-[#F2F2EF] hover:border-graphite"
    }`;

  return (
    <div className="max-w-5xl mx-auto">
      <Head>
        <title>{`${design.title} | Savana3D`}</title>
        {design.description && <meta name="description" content={design.description.slice(0, 160)} />}
      </Head>
      <Link href="/store" className="inline-flex items-center gap-1 text-sm font-medium text-[#6F6F6A] dark:text-gray-400 mb-4 hover:text-gold">
        <span aria-hidden="true">{dir === "rtl" ? "→" : "←"}</span>
        <span>{ar ? "المتجر" : "Store"}</span>
      </Link>

      <div className="grid gap-6 md:gap-12 md:grid-cols-2 items-start">
        <div className="md:sticky md:top-24">
          <div className="aspect-[4/5] rounded-[28px] overflow-hidden bg-stone dark:bg-[#222220]">
            {images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[Math.min(activeImage, images.length - 1)]} alt={design.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[#8A8A84]">{t("store_no_preview")}</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto mt-3">
              {images.map((url, index) => (
                <button key={url} type="button" onClick={() => setActiveImage(index)}
                  aria-label={`${design.title} ${index + 1}`} aria-current={index === activeImage}
                  className={`h-16 w-16 shrink-0 rounded-xl overflow-hidden ring-2 ${index === activeImage ? "ring-gold" : "ring-transparent opacity-70"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:pt-4">
          <h1 className="font-semibold tracking-tightest text-3xl sm:text-[2.6rem] text-ink dark:text-[#F2F2EF] leading-tight">{design.title}</h1>
          <p className="mt-3 text-2xl text-ink dark:text-[#F2F2EF]">{price} {ar ? "ر.س" : "SAR"}</p>
          {design.description && (
            <p className="mt-5 text-[#55554F] dark:text-gray-400 whitespace-pre-wrap max-w-[60ch]">{design.description}</p>
          )}

          {colors.length > 0 && (
            <fieldset className="mt-7">
              <legend className="font-semibold text-graphite dark:text-[#F2F2EF] mb-3">
                {ar ? "اللون" : "Color"}{color && <span className="font-normal text-[#6F6F6A]">: {color}</span>}
              </legend>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button key={c} type="button" onClick={() => { setColor(c); setError(""); setAdded(false); }}
                    aria-pressed={color === c} className={`${option(color === c)} inline-flex items-center gap-2`}>
                    <span aria-hidden="true" className="h-4 w-4 rounded-full border border-black/15" style={{ background: swatchFor(c) }} />
                    {c}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {hasHigh && (
            <fieldset className="mt-6">
              <legend className="font-semibold text-graphite dark:text-[#F2F2EF] mb-3">{ar ? "الجودة" : "Quality"}</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" aria-pressed={quality === "standard"} onClick={() => { setQuality("standard"); setAdded(false); }} className={option(quality === "standard")}>
                  {ar ? "عادية" : "Standard"} · {design.price}
                </button>
                <button type="button" aria-pressed={quality === "high"} onClick={() => { setQuality("high"); setAdded(false); }} className={option(quality === "high")}>
                  {ar ? "عالية" : "High"} · {design.price_high}
                </button>
              </div>
            </fieldset>
          )}

          <div className="mt-8">
            {error && <p role="alert" className="text-red-600 text-sm mb-3">{error}</p>}
            {added ? (
              <Link href="/cart" className="block w-full text-center bg-graphite text-white py-4 rounded-full font-semibold hover:opacity-90">
                {ar ? "انضاف للسلة · روح للسلة" : "Added · Go to cart"}
              </Link>
            ) : (
              <button onClick={handleAddToCart} className="w-full bg-gold text-white py-4 rounded-full font-semibold hover:opacity-85 transition-colors">
                {t("store_add_to_cart")}
              </button>
            )}
          </div>

          <p className="mt-5 text-sm text-muted">
            {ar ? `يُجهَّز خلال ${lead}–${lead + 2} أيام · توصيل ${LOCAL_SHIPPING_COST} ر.س داخل المدينة، ${SHIPPING_COST} ر.س لباقي المملكة` : `Ready in ${lead}–${lead + 2} days · Delivery ${LOCAL_SHIPPING_COST} SAR in Madinah, ${SHIPPING_COST} SAR elsewhere`}
          </p>
        </div>
      </div>
    </div>
  );
}
