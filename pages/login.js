import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
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
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState("idle"); // idle | sending | sent | error

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setUnconfirmed(false);
    setResendStatus("idle");
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (loginError) {
      // Supabase يرجّع هذا الخطأ تحديدًا لما يكون الإيميل صحيح وكلمة المرور صحيحة
      // بس المستخدم ما أكّد بريده بعد — لازم نميّزه عن خطأ "بيانات دخول خاطئة"
      const isUnconfirmed =
        loginError.code === "email_not_confirmed" ||
        /email not confirmed/i.test(loginError.message || "");

      if (isUnconfirmed) {
        setUnconfirmed(true);
      } else {
        setError(t("login_error"));
      }
      return;
    }

    router.push("/dashboard");
  }

  async function handleResend() {
    setResendStatus("sending");
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setResendStatus(resendError ? "error" : "sent");
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm">
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
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

        {unconfirmed && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 space-y-2">
            <p>{t("login_error_unconfirmed")}</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendStatus === "sending" || resendStatus === "sent"}
              className="font-bold text-navy underline disabled:opacity-60"
            >
              {resendStatus === "sending"
                ? t("login_resend_sending")
                : t("login_resend_confirmation")}
            </button>
            {resendStatus === "sent" && (
              <p className="text-teal font-medium">{t("login_resend_sent")}</p>
            )}
            {resendStatus === "error" && (
              <p className="text-red-600 font-medium">{t("login_resend_error")}</p>
            )}
          </div>
        )}

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
