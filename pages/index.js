import Head from "next/head";
import Link from "next/link";
import { useLanguage } from "../lib/LanguageContext";
import { getT } from "../lib/translations";
import WaterHero from "../components/WaterHero";

export default function Home() {
  const { lang } = useLanguage();
  const t = getT(lang);

  return (
    <>
      <Head>
        <title>Savana3D | اطبع أي تصميم ثلاثي الأبعاد بدون ما تملك طابعة</title>
        <meta
          name="description"
          content="Savana3D سافانا — منصة سعودية تربطك بشبكة من أصحاب الطابعات ثلاثية الأبعاد. ارفع تصميمك أو اختر من متجرنا، واطلب طباعته وتوصيله لباب بيتك."
        />
        <link rel="canonical" href="https://savana3d.com/" />
        <meta property="og:site_name" content="Savana3D" />
        <meta property="og:title" content="Savana3D" />
        <meta property="og:description" content="اطبع أي تصميم ثلاثي الأبعاد بدون ما تملك طابعة" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://savana3d.com/" />
        <meta property="og:image" content="https://savana3d.com/logo-lockup.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Savana3D",
              alternateName: "سافانا",
              url: "https://savana3d.com",
              logo: "https://savana3d.com/logo.png",
            }),
          }}
        />
      </Head>

      <div className="text-center">
        <WaterHero className="h-[480px] sm:h-[560px] flex items-center justify-center rounded-b-3xl">
          <div className="px-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-lockup.png"
              alt="Savana3D"
              className="h-28 sm:h-36 mx-auto mb-6 drop-shadow-lg"
            />

            <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 drop-shadow-md">
              {t("home_title")}
            </h1>
            <p className="text-base sm:text-lg text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-sm">
              {t("home_subtitle")}
            </p>

            <div className="flex justify-center gap-4">
              <Link
                href="/store"
                className="bg-white text-navy px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
              >
                {t("home_browse_store")}
              </Link>
              <Link
                href="/signup"
                className="bg-gold text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
              >
                {t("home_start_now")}
              </Link>
            </div>
          </div>
        </WaterHero>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 mb-16 px-4 max-w-5xl mx-auto text-right">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-navy mb-2">{t("home_customer_title")}</h3>
            <p className="text-gray-600 text-sm">{t("home_customer_desc")}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-teal mb-2">{t("home_designer_title")}</h3>
            <p className="text-gray-600 text-sm">{t("home_designer_desc")}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-gold mb-2">{t("home_printer_title")}</h3>
            <p className="text-gray-600 text-sm">{t("home_printer_desc")}</p>
          </div>
        </div>
      </div>
    </>
  );
}
