import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

export default function Store() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p className="text-center">جاري تحميل التصاميم...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">متجر التصاميم</h1>

      {designs.length === 0 ? (
        <p className="text-gray-600">لا توجد تصاميم منشورة حتى الآن.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {designs.map((d) => (
            <Link
              key={d.id}
              href={`/store/${d.id}`}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
            >
              <div className="h-40 bg-gray-100 flex items-center justify-center">
                {d.preview_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.preview_image_url}
                    alt={d.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">لا توجد معاينة</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-navy">{d.title}</h3>
                <p className="text-teal font-bold mt-1">{d.price} ريال</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
