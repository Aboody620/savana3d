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

      {/* Hero: طبقات طباعة + رأس الطابعة + بكرة الفلامنت */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-teal px-6 py-12 sm:py-16 mb-6 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #ffffff 0, transparent 35%), radial-gradient(circle at 80% 60%, #9C7A29 0, transparent 40%)",
            opacity: 0.2,
          }}
        />

        <div className="relative">
          <h1 className="text-2xl sm:text-4xl font-black text-white mb-3">{t("store_title")}</h1>
          <p className="text-white/85 max-w-xl mx-auto text-sm sm:text-base">{t("store_subtitle")}</p>
        </div>
      </div>

      {/* شريط الخطوات الثلاث */}
      <div className="grid grid-cols-3 sm:flex sm:items-stretch sm:justify-between gap-3 sm:gap-4 mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 px-3 sm:px-6 py-4">
        {[t("process_step1"), t("process_step2"), t("process_step3")].map((label, i) => (
          <div key={i} className="flex flex-col sm:flex-row items-center sm:flex-1 sm:min-w-0 text-center sm:text-right">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 gap-1.5 min-w-0 w-full">
              <span className="shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-navy text-white text-xs sm:text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-[11px] sm:text-sm font-bold text-navy leading-tight sm:truncate">{label}</span>
            </div>
            {i < 2 && (
              <span className="hidden sm:block flex-1 h-px bg-gray-200 mx-3" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      {/* تصنيفات قابلة للفلترة */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory(c.slug)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-bold border transition-colors ${
              category === c.slug
                ? "bg-navy text-white border-navy"
                : "bg-white text-navy border-gray-200 hover:border-navy/40"
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
            className="w-full rounded-xl border border-gray-200 bg-white pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-right"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
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
        <div className="relative text-center py-16 px-6 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200 overflow-hidden">
          <div className="text-4xl mb-3">🚀</div>
          <p className="font-black text-navy text-lg mb-2">{t("store_empty_title")}</p>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">{t("store_empty_desc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((d) => {
            const techParts = [];
            if (d.print_time_hours) {
              techParts.push(`⏱️ ${t("card_print_time")}: ${d.print_time_hours} ${t("card_hours")}`);
            }
            if (d.material) {
              techParts.push(`🧵 ${t("card_material")}: ${d.material}`);
            }
            techParts.push(`🎨 ${d.multi_color ? t("card_colors_multi") : t("card_colors_one")}`);

            return (
              <Link
                key={d.id}
                href={`/store/${d.id}`}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
              >
                <div className="relative aspect-square bg-[#EEF2F6] overflow-hidden">
                  {d.preview_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={d.preview_image_url}
                      alt={d.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-300 text-sm">
                      {t("store_no_preview")}
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-white/90 backdrop-blur text-navy text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                    {d.price} {t("riyal")}
                  </span>
                </div>
                <div className="p-3 md:p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-navy text-sm md:text-base leading-snug line-clamp-2 mb-1.5">
                    {d.title}
                  </h3>
                  <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed mb-3">
                    {techParts.join(" · ")}
                  </p>
                  <button
                    onClick={(e) => handleAdd(e, d)}
                    className={`mt-auto w-full text-xs md:text-sm font-bold py-2 rounded-lg transition-colors ${
                      addedId === d.id
                        ? "bg-teal text-white"
                        : "bg-navy/5 text-navy hover:bg-navy hover:text-white"
                    }`}
                  >
                    {addedId === d.id ? t("store_added") : t("store_add_to_cart")}
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
