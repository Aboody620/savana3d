import Head from "next/head";
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
      className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-200"
    >
      <Head>
        <title>Savana3D</title>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </Head>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        <Component {...pageProps} />
      </main>
      <footer className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 mt-8">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-8 text-right">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Savana3D" className="h-8 mb-3 ms-auto" />
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {t("footer_about_text")}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm text-navy dark:text-white mb-3">{t("footer_quick_links")}</h4>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li>
                <a href="/store" className="hover:text-teal">{t("nav_store")}</a>
              </li>
              <li>
                <a href="/signup" className="hover:text-teal">{t("nav_signup")}</a>
              </li>
              <li>
                <a href="/login" className="hover:text-teal">{t("nav_login")}</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm text-navy dark:text-white mb-3">{t("footer_connect")}</h4>
            <a
              href="mailto:a.ali44xd@gmail.com?subject=مشكلة%20بمنصة%20Savana3D"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-teal"
            >
              a.ali44xd@gmail.com
            </a>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-center text-xs text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} Savana3D — {t("footer_rights")}
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
