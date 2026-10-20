import { useState } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../lib/LanguageContext";
import { getT } from "../lib/translations";

export default function Signup() {
  const { lang } = useLanguage();
  const t = getT(lang);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    // نمرر full_name و role كبيانات وصفية (metadata)؛ قاعدة البيانات
    // تلتقطها تلقائيًا عبر trigger وتنشئ سطر profiles بنفسها،
    // حتى لو تأكيد الإيميل مفعّل ولسا ما فيه جلسة نشطة.
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setMessage(t("signup_success"));
  }

  return (
    <div className="max-w-sm mx-auto pt-6">
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <h1 className="text-3xl font-semibold tracking-tightest text-ink mb-8">{t("signup_title")}</h1>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("signup_full_name")}</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border-0 bg-stone px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("signup_email")}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border-0 bg-stone px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("signup_password")}</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border-0 bg-stone px-4 py-3"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-teal text-sm">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white py-3.5 rounded-full font-semibold hover:opacity-85 disabled:opacity-50"
        >
          {loading ? t("signup_loading") : t("signup_submit")}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <a href="/login" className="text-ink font-semibold underline underline-offset-4">{lang === "en" ? "Have an account? Log in" : "عندك حساب؟ سجّل دخول"}</a>
      </p>
    </div>
  );
}
