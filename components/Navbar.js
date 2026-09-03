import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";

export default function Navbar() {
  const { user, profile } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <nav className="bg-navy text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Savana3D" className="h-9 w-9" />
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
