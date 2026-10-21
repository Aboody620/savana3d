import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";
import { getCartCount } from "../lib/cart";
import { useTheme } from "../lib/ThemeContext";
import { useLanguage } from "../lib/LanguageContext";
import { getT } from "../lib/translations";

export default function Navbar() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const t = getT(lang);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);


  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setCartCount(getCartCount());
    function onUpdate() {
      setCartCount(getCartCount());
    }
    window.addEventListener("cart-updated", onUpdate);
    return () => window.removeEventListener("cart-updated", onUpdate);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.rpc("is_admin").then(({ data }) => setIsAdmin(Boolean(data)));
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  // في الصفحة الرئيسية: الشريط شفاف فوق الفيديو لين ينزل الزائر
  const isHome = router.pathname === "/";
  const overlay = isHome && !scrolled && !menuOpen;

  return (
    <nav
      className={`${isHome ? "fixed inset-x-0" : "sticky"} top-0 z-40 border-b transition-colors duration-300 ${
        overlay
          ? "bg-transparent text-white border-transparent"
          : `bg-bed/85 dark:bg-[#0E0E0D]/85 backdrop-blur-md text-graphite dark:text-[#F2F2EF] ${scrolled ? "border-line dark:border-[#2E2E2B]" : "border-transparent"}`
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4 sm:gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg flex-shrink-0 whitespace-nowrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-7 w-7 object-contain flex-shrink-0" />
          <span className="tracking-tight">Savana3D</span>
        </Link>

        <div className="flex items-center gap-6 text-[0.95rem] flex-1 min-w-0">
          <Link href="/store" className="hover:opacity-60 whitespace-nowrap py-1">
            {t("nav_store")}
          </Link>
        </div>

        <Link href="/cart" className="relative hover:opacity-60 flex-shrink-0 p-1.5" aria-label={t("nav_cart")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z" />
            <path d="M9 10V7a3 3 0 0 1 6 0v3" />
          </svg>
          {cartCount > 0 && (
            <span className={`absolute -top-2 ${lang === "ar" ? "-right-2" : "-left-2"} bg-gold text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center`}>
              {cartCount}
            </span>
          )}
        </Link>

        <div className="flex-shrink-0">
          {!user ? (
            <Link href="/login" aria-label={t("nav_login")} className="block p-1.5 hover:opacity-60">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="12" cy="8.5" r="3.5" />
                <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
              </svg>
            </Link>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={t("nav_menu")}
                aria-expanded={menuOpen}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-graphite/10 dark:hover:bg-white/10 transition-colors"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <circle cx="12" cy="8.5" r="3.5" />
                  <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
                </svg>
              </button>

              {menuOpen && (
                <div className={`absolute ${lang === "ar" ? "left-0" : "right-0"} mt-2 w-64 bg-white dark:bg-[#191918] text-gray-800 dark:text-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 text-right border border-gray-100 dark:border-white/10`}>
                  {profile && (
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
                      <p className="font-bold text-sm truncate">{profile.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                  )}

                  <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/10">
                    {lang === "en" ? "My orders" : "طلباتي"}
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/10">
                      {lang === "en" ? "Store admin" : "لوحة المتجر"}
                    </Link>
                  )}

                  {/* المظهر */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                      {t("nav_appearance")}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                          theme === "light"
                            ? "bg-navy text-white border-navy"
                            : "border-gray-300 dark:border-slate-600"
                        }`}
                      >
                        {t("nav_light")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                          theme === "dark"
                            ? "bg-navy text-white border-navy"
                            : "border-gray-300 dark:border-slate-600"
                        }`}
                      >
                        {t("nav_dark")}
                      </button>
                    </div>
                  </div>

                  {/* اللغة */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                      {t("nav_language")}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setLang("ar")}
                        className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                          lang === "ar"
                            ? "bg-navy text-white border-navy"
                            : "border-gray-300 dark:border-slate-600"
                        }`}
                      >
                        {t("nav_lang_ar")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLang("en")}
                        className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                          lang === "en"
                            ? "bg-navy text-white border-navy"
                            : "border-gray-300 dark:border-slate-600"
                        }`}
                      >
                        {t("nav_lang_en")}
                      </button>
                    </div>
                  </div>

                  {/* الدعم */}
                  <a
                    href="mailto:a.ali44xd@gmail.com?subject=مشكلة%20بمنصة%20Savana3D"
                    className="block px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 border-b border-gray-100 dark:border-white/10 transition-colors"
                  >
                    {t("nav_help")}
                  </a>

                  {/* تسجيل خروج */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-right px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    {t("nav_logout")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
