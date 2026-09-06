import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { addToCart } from "../../lib/cart";
import { useLanguage } from "../../lib/LanguageContext";
import { getT } from "../../lib/translations";

export default function Store() {
  const { lang } = useLanguage();
  const t = getT(lang);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");

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
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((d) => d.title?.toLowerCase().includes(q));
    }
    list = [...list];
    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [designs, query, sort]);

  return (
    <div>
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-teal px-6 py-10 sm:py-14 mb-8 text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #ffffff 0, transparent 35%), radial-gradient(circle at 80% 60%, #9C7A29 0, transparent 40%)",
          }}
        />
        <div className="relative">
          <h1 className="text-2xl sm:text-4xl font-black text-white mb-3">{t("store_title")}</h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm sm:text-base">{t("store_subtitle")}</p>
        </div>
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
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500">{t("store_empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((d) => (
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
                <h3 className="font-bold text-navy text-sm md:text-base leading-snug line-clamp-2 mb-3">
                  {d.title}
                </h3>
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
          ))}
        </div>
      )}
    </div>
  );
}
