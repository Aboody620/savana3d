import Head from "next/head";
import "../styles/globals.css";
import Navbar from "../components/Navbar";
import { ThemeProvider } from "../lib/ThemeContext";

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <div
        dir="rtl"
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
        <footer className="border-t border-gray-200 dark:border-slate-800 py-6 mt-8">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} Savana3D — جميع الحقوق محفوظة</p>
            <a
              href="mailto:a.ali44xd@gmail.com?subject=مشكلة%20بمنصة%20Savana3D"
              className="hover:text-teal"
            >
              تواصل معنا
            </a>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
