import Head from "next/head";
import "@fontsource/alexandria/500.css";
import "@fontsource/alexandria/600.css";
import "@fontsource/alexandria/700.css";
import "@fontsource/alexandria/800.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "../styles/globals.css";
import Navbar from "../components/Navbar";
import { ThemeProvider } from "../lib/ThemeContext";
import { LanguageProvider, useLanguage } from "../lib/LanguageContext";
import { getT } from "../lib/translations";

function AppShell({ Component, pageProps }) {
  const { dir, lang } = useLanguage();
  const t = getT(lang);

  return (
    <div
      dir={dir}
      className="min-h-screen flex flex-col bg-bed dark:bg-[#121715] text-graphite dark:text-[#e7ebe6] transition-colors duration-200"
    >
      <Head>
        <title>Savana3D</title>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </Head>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <Component {...pageProps} />
      </main>
      <footer className="bg-graphite text-[#c9d0cb] mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display font-bold text-xl text-white mb-3">Savana3D</p>
            <p className="text-sm leading-relaxed max-w-[38ch]">{t("footer_about_text")}</p>
          </div>
          <nav aria-label={t("footer_quick_links")}>
            <h4 className="font-display font-semibold text-sm text-white mb-3">{t("footer_quick_links")}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/store" className="hover:text-white">{t("nav_store")}</a></li>
              <li><a href="/custom-order" className="hover:text-white">{t("nav_custom_order")}</a></li>
              <li><a href="/signup" className="hover:text-white">{t("nav_signup")}</a></li>
              <li><a href="/login" className="hover:text-white">{t("nav_login")}</a></li>
            </ul>
          </nav>
          <div>
            <h4 className="font-display font-semibold text-sm text-white mb-3">{t("footer_connect")}</h4>
            <a href="mailto:a.ali44xd@gmail.com?subject=مشكلة%20بمنصة%20Savana3D" className="text-sm hover:text-white break-all">
              a.ali44xd@gmail.com
            </a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 border-t border-white/10 text-xs text-[#8f9a95]">
          © {new Date().getFullYear()} Savana3D · {t("footer_rights")}
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
