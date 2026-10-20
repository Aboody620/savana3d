import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../../lib/LanguageContext";
import { getT } from "../../lib/translations";

const CATEGORIES = ["decor", "toys", "home", "hobby", "edu"];

// المتجر: بحث واحد، تصنيفات (فقط اللي فيها منتجات)، وشبكة صور. كل بطاقة صورة واسم وسعر.
export default function Store() {
  const { lang } = useLanguage();
  const t = getT(lang);
  const ar = lang === "ar";
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    supabase
      .from("designs")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setFailed(true);
        // المنتجات المخفية أو القديمة بدون سعر ثابت ما تنعرض
        else setDesigns((data || []).filter((d) => d.is_active !== false && d.pricing_mode !== "quote" && Number(d.price) > 0));
        setLoading(false);
      });
  }, []);

  const usedCategories = useMemo(
    () => CATEGORIES.filter((c) => designs.some((d) => (d.category || "decor") === c)),
    [designs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return designs.filter(
      (d) =>
        (category === "all" || (d.category || "decor") === category) &&
        (!q || d.title?.toLowerCase().includes(q))
    );
  }, [designs, query, category]);

  const chip = (active) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active
        ? "bg-graphite text-white dark:bg-[#e7ebe6] dark:text-[#121715]"
        : "text-graphite dark:text-[#e7ebe6] hover:bg-graphite/5 dark:hover:bg-white/5"
    }`;

  return (
    <div>
      <Head>
        <title>{ar ? "متجر التصاميم | Savana3D" : "Design store | Savana3D"}</title>
        <meta
          name="description"
          content={
            ar
              ? "تصفح تصاميم Savana3D الجاهزة للطباعة الثلاثية الأبعاد، واطلب طباعتها وتوصيلها لبابك."
              : "Browse ready 3D designs on Savana3D and get them printed and delivered to your door."
          }
        />
        <link rel="canonical" href="https://savana3d.com/store" />
      </Head>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 pt-1 pb-5">
        <h1 className="font-bold text-3xl sm:text-4xl text-graphite dark:text-[#e7ebe6] shrink-0">
          {ar ? "المتجر" : "Store"}
        </h1>
        <label className="relative flex-1 sm:max-w-md sm:ms-auto">
          <span className="sr-only">{ar ? "ابحث عن تصميم" : "Search designs"}</span>
          <svg aria-hidden="true" className="absolute top-1/2 -translate-y-1/2 start-4 text-[#7b8681]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ar ? "ابحث عن تصميم" : "Search designs"}
            className="w-full rounded-full border border-line dark:border-[#323b37] bg-white dark:bg-[#1a201e] ps-11 pe-4 py-3 text-[0.95rem]"
          />
        </label>
      </div>

      {usedCategories.length > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6 -mx-1 px-1" role="tablist" aria-label={ar ? "التصنيفات" : "Categories"}>
          <button role="tab" aria-selected={category === "all"} onClick={() => setCategory("all")} className={chip(category === "all")}>
            {t("cat_all")}
          </button>
          {usedCategories.map((c) => (
            <button key={c} role="tab" aria-selected={category === c} onClick={() => setCategory(c)} className={chip(category === c)}>
              {t(`cat_${c}`)}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-2xl bg-[#e2e6df] dark:bg-[#232a27]" />
              <div className="h-4 mt-3 rounded bg-[#e2e6df] dark:bg-[#232a27] w-3/4" />
              <div className="h-4 mt-2 rounded bg-[#e2e6df] dark:bg-[#232a27] w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-bold text-lg text-graphite dark:text-[#e7ebe6] mb-2">
            {failed
              ? (ar ? "ما قدرنا نحمّل التصاميم" : "Couldn't load designs")
              : designs.length === 0
                ? (ar ? "ما فيه تصاميم للحين" : "No designs yet")
                : (ar ? "ما لقينا تصميم بهالاسم" : "No designs match your search")}
          </p>
          {failed ? (
            <button onClick={() => window.location.reload()} className="text-gold font-semibold">
              {ar ? "حاول مرة ثانية" : "Try again"}
            </button>
          ) : designs.length > 0 ? (
            <button onClick={() => { setQuery(""); setCategory("all"); }} className="text-gold font-semibold">
              {ar ? "اعرض كل التصاميم" : "Show all designs"}
            </button>
          ) : (
            <Link href="/custom-order" className="text-gold font-semibold">
              {ar ? "ارفع ملفك واطلب طباعته" : "Upload your file to get it printed"}
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {filtered.map((d, i) => (
            <li key={d.id}>
              <Link href={`/store/${d.id}`} className="group block">
                <div className="aspect-square rounded-2xl overflow-hidden bg-[#e2e6df] dark:bg-[#232a27]">
                  {d.preview_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={d.preview_image_url}
                      alt={d.title}
                      loading={i < 4 ? "eager" : "lazy"}
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm text-[#7b8681]">
                      {t("store_no_preview")}
                    </div>
                  )}
                </div>
                <h2 className="mt-3 text-[0.95rem] sm:text-base font-semibold text-graphite dark:text-[#e7ebe6] leading-snug line-clamp-2">
                  {d.title}
                </h2>
                <p className="mt-1 text-[0.95rem] font-bold text-gold">
                  {d.price_high ? (ar ? "من " : "From ") : ""}{d.price} {t("riyal")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
