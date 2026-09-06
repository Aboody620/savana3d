import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";
import { getCartCount } from "../lib/cart";
import { useTheme } from "../lib/ThemeContext";

const ROLE_LABELS = {
  customer: "زبون",
  designer: "مصمم",
  printer: "صاحب طابعة",
};

export default function Navbar() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const menuRef = useRef(null);

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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function switchRole(newRole) {
    if (!user || switchingRole) return;
    setSwitchingRole(true);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", user.id);
    setSwitchingRole(false);
    if (!error) {
      window.location.reload();
    }
  }

  const roleOptions = (() => {
    if (!profile) return [];
    if (profile.role === "customer") {
      return [
        { role: "designer", label: "التسجيل كمصمم" },
        { role: "printer", label: "التسجيل كصاحب طابعة" },
      ];
    }
    if (profile.role === "designer") {
      return [
        { role: "customer", label: "التبديل إلى زبون" },
        { role: "printer", label: "التبديل إلى صاحب طابعة" },
      ];
    }
    // printer
    return [
      { role: "customer", label: "التبديل إلى زبون" },
      { role: "designer", label: "التبديل إلى مصمم" },
    ];
  })();

  return (
    <nav className="bg-navy text-white shadow-md relative">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Savana3D" className="h-9 w-9 object-contain" />
          Savana3D
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/store" className="hover:text-gold">
            المتجر
          </Link>

          {user && profile?.role === "designer" && (
            <Link href="/upload" className="hover:text-gold">
              رفع تصميم
            </Link>
          )}

          {user && (
            <Link href="/dashboard" className="hover:text-gold">
              تصاميمي
            </Link>
          )}

          <Link href="/cart" className="relative hover:text-gold" aria-label="السلة">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="19" cy="21" r="1.5" fill="currentColor" stroke="none" />
              <path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -left-2 bg-gold text-navy text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {!user ? (
            <>
              <Link href="/login" className="hover:text-gold">
                دخول
              </Link>
              <Link
                href="/signup"
                className="bg-teal px-3 py-1.5 rounded-md hover:opacity-90"
              >
                إنشاء حساب
              </Link>
            </>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="القائمة"
                aria-expanded={menuOpen}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-xl shadow-lg overflow-hidden z-50 text-right border border-gray-100 dark:border-slate-700">
                  {profile && (
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                      <p className="font-bold text-sm truncate">{profile.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {ROLE_LABELS[profile.role] || profile.role}
                      </p>
                    </div>
                  )}

                  {/* المظهر */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                      المظهر
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
                        فاتح
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
                        داكن
                      </button>
                    </div>
                  </div>

                  {/* تبديل نوع الحساب */}
                  {roleOptions.length > 0 && (
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                        نوع الحساب
                      </p>
                      <div className="space-y-1">
                        {roleOptions.map((opt) => (
                          <button
                            key={opt.role}
                            type="button"
                            onClick={() => switchRole(opt.role)}
                            disabled={switchingRole}
                            className="w-full text-right text-sm py-1.5 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                          >
                            {switchingRole ? "جاري التبديل..." : opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* الدعم */}
                  <a
                    href="mailto:a.ali44xd@gmail.com?subject=مشكلة%20بمنصة%20Savana3D"
                    className="block px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 border-b border-gray-100 dark:border-slate-700 transition-colors"
                  >
                    واجهتك مشكلة؟ تواصل معنا
                  </a>

                  {/* تسجيل خروج */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-right px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    تسجيل خروج
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
