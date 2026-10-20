import Link from "next/link";

// بطاقة منتج: صورة كبيرة، والاسم والسعر تحتها. بدون أي زوائد.
export default function ProductCard({ design, lang = "ar", eager = false }) {
  const ar = lang !== "en";
  return (
    <Link href={`/store/${design.id}`} className="group block">
      <div className="aspect-[4/5] rounded-[20px] overflow-hidden bg-stone dark:bg-[#222220]">
        {design.preview_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={design.preview_image_url}
            alt={design.title}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : null}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="text-[0.95rem] text-ink dark:text-[#F2F2EF] leading-snug line-clamp-1">{design.title}</h3>
        <p className="shrink-0 text-[0.95rem] font-semibold text-ink dark:text-[#F2F2EF]">
          {design.price_high ? (ar ? "من " : "From ") : ""}{design.price} {ar ? "ر.س" : "SAR"}
        </p>
      </div>
    </Link>
  );
}

// المنتجات اللي تنعرض للزبون فقط
export function visibleDesigns(list) {
  return (list || []).filter((d) => d.is_active !== false && d.pricing_mode !== "quote" && Number(d.price) > 0);
}
