import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../lib/LanguageContext";
import ProductCard, { visibleDesigns } from "../components/ProductCard";
import HeroVideo from "../components/HeroVideo";

export default function Home() {
  const { lang } = useLanguage();
  const ar = lang !== "en";
  const [designs, setDesigns] = useState(null);

  useEffect(() => {
    supabase
      .from("designs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(24)
      .then(({ data }) => setDesigns(visibleDesigns(data).slice(0, 8)));
  }, []);

  return (
    <>
      <Head>
        <title>Savana3D | من الفكرة إلى قطعة بين يديك</title>
        <meta name="description" content="ديكورات وهدايا مطبوعة بتقنية ثلاثية الأبعاد، تنطبع لك خصيصًا وتوصلك لبابك." />
        <link rel="canonical" href="https://savana3d.com/" />
        <meta property="og:site_name" content="Savana3D" />
        <meta property="og:title" content="Savana3D" />
        <meta property="og:description" content="قطع مطبوعة ثلاثية الأبعاد، تنطبع لك خصيصًا." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://savana3d.com/" />
        <meta property="og:image" content="https://savana3d.com/logo-lockup.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <HeroVideo lang={lang} />

      {/* الجديد */}
      {designs && designs.length > 0 && (
        <section className="pb-20">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-2xl font-semibold text-ink dark:text-[#F2F2EF]">{ar ? "الجديد" : "New in"}</h2>
            <Link href="/store" className="text-sm font-semibold text-ink dark:text-[#F2F2EF] underline underline-offset-4">
              {ar ? "عرض الكل" : "View all"}
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
            {designs.slice(0, 8).map((d, i) => <ProductCard key={d.id} design={d} lang={lang} eager={i < 4} />)}
          </div>
        </section>
      )}

      {/* ثلاث نقاط بس */}
      <section className="border-t border-line dark:border-[#2E2E2B] py-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-sm text-muted">
        <p><span className="block text-ink dark:text-[#F2F2EF] font-semibold mb-1">{ar ? "يُطبع لك" : "Made to order"}</span>{ar ? "باللون اللي تختاره" : "In the color you choose"}</p>
        <p><span className="block text-ink dark:text-[#F2F2EF] font-semibold mb-1">{ar ? "توصيل للمملكة" : "Delivered nationwide"}</span>{ar ? "مع رقم تتبع" : "With tracking"}</p>
        <p><span className="block text-ink dark:text-[#F2F2EF] font-semibold mb-1">{ar ? "دفع آمن" : "Secure payment"}</span>{ar ? "مدى · فيزا · ماستركارد" : "mada · Visa · Mastercard"}</p>
      </section>
    </>
  );
}
