import Head from "next/head";
import "../styles/globals.css";
import Navbar from "../components/Navbar";
import { ThemeProvider } from "../lib/ThemeContext";
import { LanguageProvider, useLanguage } from "../lib/LanguageContext";
import { getT } from "../lib/translations";
import { BUSINESS } from "../lib/businessInfo";

function AppShell({ Component, pageProps }) {
  const { dir, lang } = useLanguage();
  const t = getT(lang);

  return (
    <div
      dir={dir}
      className="min-h-screen flex flex-col bg-bed dark:bg-[#0E0E0D] text-graphite dark:text-[#F2F2EF] transition-colors duration-200"
    >
      <Head>
        <title>Savana3D</title>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </Head>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <Component {...pageProps} />
      </main>
      <footer className="border-t border-line dark:border-[#2E2E2B] mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row gap-6 sm:items-center justify-between text-sm">
          <p className="font-semibold text-ink dark:text-[#F2F2EF]">Savana3D</p>
          <nav aria-label={t("footer_quick_links")} className="flex flex-wrap gap-x-6 gap-y-2 text-muted">
            <a href="/store" className="hover:text-ink dark:hover:text-white">{t("nav_store")}</a>
            <a href="/terms" className="hover:text-ink dark:hover:text-white">{lang === "en" ? "Terms" : "الشروط"}</a>
            <a href="/privacy" className="hover:text-ink dark:hover:text-white">{lang === "en" ? "Privacy" : "الخصوصية"}</a>
            <a href="/refund" className="hover:text-ink dark:hover:text-white">{lang === "en" ? "Returns" : "الاسترجاع"}</a>
            <a href={`mailto:${BUSINESS.email}`} className="hover:text-ink dark:hover:text-white">{lang === "en" ? "Contact" : "تواصل معنا"}</a>
          </nav>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 text-xs text-[#8A8A84] flex flex-wrap gap-x-4 gap-y-1">
          <span>© {new Date().getFullYear()} Savana3D</span>
          <span>{lang === "en" ? "Freelance document" : "وثيقة عمل حر"} <span dir="ltr">{BUSINESS.freelanceDocument}</span></span>
          <span>{lang === "en" ? "Saudi Business Center" : "المركز السعودي للأعمال"} <span dir="ltr">{BUSINESS.businessCenterAuth}</span></span>
        </div>
      </footer>
    </div>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppShell Component={Component} pageProps={pageProps} />
      </LanguageProvider>
    </ThemeProvider>
  );
}
