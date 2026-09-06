import Head from "next/head";
import Link from "next/link";
import { useLanguage } from "../lib/LanguageContext";
import { getT } from "../lib/translations";

export default function Home() {
  const { lang } = useLanguage();
  const t = getT(lang);

  return (
    <>
      <Head>
        <title>Savana3D</title>
      </Head>

      <div className="text-center py-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-lockup.png"
          alt="Savana3D"
          className="h-40 mx-auto mb-8"
        />

        <h1 className="text-4xl font-black text-navy mb-4">{t("home_title")}</h1>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          {t("home_subtitle")}
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/store"
            className="bg-navy text-white px-6 py-3 rounded-lg font-bold hover:opacity-90"
          >
            {t("home_browse_store")}
          </Link>
          <Link
            href="/signup"
            className="bg-teal text-white px-6 py-3 rounded-lg font-bold hover:opacity-90"
          >
            {t("home_start_now")}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-right">
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
