import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// فيديو الواجهة: طابعة ثلاثية الأبعاد تطبع (Pexels — Jakub Zerdzicki، رخصة Pexels تسمح بالاستخدام التجاري)
const VIDEO = "https://videos.pexels.com/video-files/19378586/19378586-hd_1280_720_25fps.mp4";
const VIDEO_HD = "https://videos.pexels.com/video-files/19378586/19378586-hd_1920_1080_25fps.mp4";
const POSTER = "https://images.pexels.com/videos/19378586/3d-print-3d-printer-colorful-diy-19378586.jpeg?auto=compress&w=1600";

export default function HeroVideo({ lang = "ar" }) {
  const ar = lang !== "en";
  const ref = useRef(null);
  const [src, setSrc] = useState(null);

  useEffect(() => {
    // اللي مفعّل "تقليل الحركة" يشوف صورة ثابتة بدل الفيديو
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setSrc(window.innerWidth >= 1280 ? VIDEO_HD : VIDEO);
  }, []);

  useEffect(() => {
    if (src) ref.current?.play?.().catch(() => {});
  }, [src]);

  return (
    <section
      className="relative -mt-8 mb-16 h-[86vh] min-h-[560px] max-h-[900px] overflow-hidden bg-black text-white"
      style={{ marginInline: "calc(50% - 50vw)" }}
    >
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover"
        src={src || undefined}
        poster={POSTER}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/80" />

      <div className="relative z-10 flex h-full flex-col items-center justify-end pb-20 sm:pb-24 px-6 text-center">
        <h1 className="text-[3.4rem] leading-none sm:text-8xl md:text-[8.5rem] font-semibold tracking-tightest" dir="ltr">
          Savana3D
        </h1>
        <p className="mt-5 text-lg sm:text-2xl text-white/85 font-light">
          {ar ? "من الفكرة… إلى قطعة بين يديك." : "From an idea to a piece in your hands."}
        </p>
        <Link
          href="/store"
          className="mt-9 inline-flex items-center gap-3 rounded-full bg-white text-black px-9 py-4 font-semibold hover:bg-white/90 transition-colors"
        >
          {ar ? "تسوّق الآن" : "Shop now"}
          <span aria-hidden="true">{ar ? "←" : "→"}</span>
        </Link>
      </div>
    </section>
  );
}
