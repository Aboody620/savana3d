import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";
import { getCartCount } from "../lib/cart";

export default function Navbar() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
    function onUpdate() {
      setCartCount(getCartCount());
    }
    window.addEventListener("cart-updated", onUpdate);
    return () => window.removeEventListener("cart-updated", onUpdate);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <nav className="bg-navy text-white shadow-md">
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
              لوحتي
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
            <button
              onClick={handleLogout}
              className="bg-red-600 px-3 py-1.5 rounded-md hover:opacity-90"
            >
              خروج
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
