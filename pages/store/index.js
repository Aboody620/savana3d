import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { addToCart } from "../../lib/cart";

export default function Store() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);

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

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-100" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy mb-2">متجر التصاميم</h1>
        <p className="text-gray-500">اختر تصميمًا جاهزًا واطلب طباعته، يوصلك من أقرب شبكة طابعين لدينا.</p>
      </div>

      {designs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
          <p className="text-gray-500">لا توجد تصاميم منشورة حتى الآن.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {designs.map((d) => (
            <Link
              key={d.id}
              href={`/store/${d.id}`}
              className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col"
            >
              <div className="aspect-square bg-[#EEF2F6] overflow-hidden">
                {d.preview_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.preview_image_url}
                    alt={d.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-300 text-sm">
                    لا توجد معاينة
                  </div>
                )}
              </div>
              <div className="p-3 md:p-4 flex flex-col flex-1">
                <h3 className="font-bold text-navy text-sm md:text-base leading-snug line-clamp-2 mb-1">
                  {d.title}
                </h3>
                <p className="text-teal font-bold text-sm md:text-base mb-3">{d.price} ريال</p>
                <button
                  onClick={(e) => handleAdd(e, d)}
                  className={`mt-auto w-full text-xs md:text-sm font-bold py-2 rounded-lg transition-colors ${
                    addedId === d.id
                      ? "bg-teal text-white"
                      : "bg-navy/5 text-navy hover:bg-navy hover:text-white"
                  }`}
                >
                  {addedId === d.id ? "أُضيف ✓" : "أضف للسلة"}
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
