import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../lib/LanguageContext";
import { getT } from "../lib/translations";

export default function Login() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = getT(lang);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (loginError) {
      setError(t("login_error"));
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm">
      <h1 className="text-2xl font-bold text-navy mb-6">{t("login_title")}</h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("login_email")}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("login_password")}</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy text-white py-2.5 rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t("login_loading") : t("login_submit")}
        </button>
      </form>
    </div>
  );
}
