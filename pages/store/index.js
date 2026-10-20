import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { addToCart } from "../../lib/cart";
import { useLanguage } from "../../lib/LanguageContext";
import { getT } from "../../lib/translations";

const CATEGORIES = [
  { slug: "all", icon: "✨", key: "cat_all" },
  { slug: "decor", icon: "🏺", key: "cat_decor" },
  { slug: "toys", icon: "🧸", key: "cat_toys" },
  { slug: "home", icon: "🏠", key: "cat_home" },
  { slug: "hobby", icon: "⚙️", key: "cat_hobby" },
  { slug: "edu", icon: "📚", key: "cat_edu" },
];

export default function Store() {
  const { lang } = useLanguage();
  const t = getT(lang);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    async function loadDesigns() {
      const { data, error } = await supabase
        .from("designs")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setDesigns(data);
      setLoading(false);
    }
    loadDesigns();
  }, []);

  function handleAdd(e, design) {
    e.preventDefault();
    e.stopPropagation();
    addToCart(design);
    setAddedId(design.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  const filtered = useMemo(() => {
    let list = designs;
    if (category !== "all") {
      list = list.filter((d) => (d.category || "decor") === category);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((d) => d.title?.toLowerCase().includes(q));
    }
    list = [...list];
    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [designs, query, sort, category]);

  return (
    <div>
      <Head>
        <title>
          {lang === "ar"
            ? "متجر تصاميم الطباعة الثلاثية الأبعاد | Savana3D"
            : "3D Design Store | Savana3D"}
        </title>
        <meta
          name="description"
          content={
            lang === "ar"
              ? "تصفح متجر تصاميم Savana3D للطباعة الثلاثية الأبعاد — اختر تصميم جاهز واطلب طباعته وتوصيله لباب بيتك عبر شبكة أصحاب الطابعات."
              : "Browse Savana3D's 3D design store — pick a ready design and get it printed and delivered by our printer network."
          }
        />
        <link rel="canonical" href="https://savana3d.com/store" />
      </Head>

      <header className="pt-2 pb-8">
        <h1 className="font-display font-extrabold text-[2rem] sm:text-5xl leading-tight text-graphite dark:text-[#e7ebe6] mb-3">{t("store_title")}</h1>
        <p className="text-[#4a5551] dark:text-gray-400 max-w-[52ch] text-base sm:text-lg">{t("store_subtitle")}</p>
      </header>

      {/* تصنيفات قابلة للفلترة */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory(c.slug)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
              category === c.slug
                ? "bg-graphite text-white border-graphite dark:bg-[#e7ebe6] dark:text-[#121715]"
                : "bg-transparent text-graphite dark:text-[#e7ebe6] border-line dark:border-[#323b37] hover:border-graphite"
            }`}
          >
            <span>{c.icon}</span>
            <span>{t(c.key)}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("store_search_placeholder") || (lang === "ar" ? "دوّر عن تصميم..." : "Search designs...")}
            className="w-full rounded-xl border border-gray-200 bg-white pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold text-right"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
        >
          <option value="newest">{lang === "ar" ? "الأحدث" : "Newest"}</option>
          <option value="price_asc">{lang === "ar" ? "السعر: من الأقل" : "Price: Low to High"}</option>
          <option value="price_desc">{lang === "ar" ? "السعر: من الأعلى" : "Price: High to Low"}</option>
        </select>
      </div>

      {!loading && (
        <p className="text-xs text-gray-400 mb-4">
          {lang === "ar" ? `${filtered.length} تصميم متاح` : `${filtered.length} designs available`}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        designs.length === 0 ? (
          <div className="relative text-center py-16 px-6 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200 overflow-hidden">
            <div className="text-4xl mb-3">🚀</div>
            <p className="font-black text-navy text-lg mb-2">{t("store_empty_title")}</p>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">{t("store_empty_desc")}</p>
          </div>
        ) : (
          <div className="relative text-center py-16 px-6 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200 overflow-hidden">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-black text-navy text-lg mb-2">{t("store_no_match_title")}</p>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-4">{t("store_no_match_desc")}</p>
            <button
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
              className="text-xs font-bold text-teal hover:underline"
            >
              {t("store_clear_filters")}
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((d) => {
            const techParts = [];
            if (d.print_time_hours) {
              techParts.push(`${d.print_time_hours} ${t("card_hours")}`);
            }
            if (d.material) {
              techParts.push(d.material);
            }
            if (d.multi_color) techParts.push(t("card_colors_multi"));

            return (
              <Link
                key={d.id}
                href={`/store/${d.id}`}
                className="group bg-white dark:bg-[#1a201e] rounded-2xl border border-line dark:border-[#323b37] overflow-hidden hover:border-graphite/50 dark:hover:border-[#e7ebe6]/40 transition-colors flex flex-col"
              >
                <div className="relative aspect-square bg-[#e2e6df] dark:bg-[#232a27] overflow-hidden">
                  {d.preview_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={d.preview_image_url}
                      alt={d.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-300 text-sm">
                      {t("store_no_preview")}
                    </div>
                  )}
                </div>
                <div className="p-3 md:p-4 flex flex-col flex-1">
                  <h3 className="font-display font-semibold text-graphite dark:text-[#e7ebe6] text-[0.95rem] md:text-base leading-snug line-clamp-2 mb-1">
                    {d.title}
                  </h3>
                  <p className="font-display font-bold text-gold text-base md:text-lg mb-1.5">
                    {d.pricing_mode === "quote" ? (lang === "ar" ? "السعر حسب الطلب" : "Price on request") : `${d.price} ${t("riyal")}`}
                  </p>
                  <p className="text-[11px] md:text-xs text-[#5d6864] dark:text-gray-400 leading-relaxed mb-3">
                    {techParts.join(" · ")}
                  </p>
                  {d.pricing_mode === "quote" ? (
                    <span className="mt-auto w-full text-center text-xs md:text-sm font-semibold py-2.5 rounded-xl bg-gold/10 text-gold">
                      {lang === "ar" ? "اطلب سعر الطباعة" : "Request a quote"}
                    </span>
                  ) : (
                  <button
                    onClick={(e) => handleAdd(e, d)}
                    className={`mt-auto w-full text-xs md:text-sm font-semibold py-2.5 rounded-xl transition-colors ${
                      addedId === d.id
                        ? "bg-teal text-white"
                        : "border border-graphite/70 text-graphite dark:text-[#e7ebe6] dark:border-[#e7ebe6]/50 hover:bg-graphite hover:text-white"
                    }`}
                  >
                    {addedId === d.id ? t("store_added") : t("store_add_to_cart")}
                  </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
