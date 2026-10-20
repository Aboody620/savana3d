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
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm">
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <h1 className="text-2xl font-bold text-navy mb-6">{t("signup_title")}</h1>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("signup_full_name")}</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("signup_email")}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
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
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-teal text-sm">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-white py-2.5 rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t("signup_loading") : t("signup_submit")}
        </button>
      </form>
    </div>
  );
}
