import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { clearCart } from "../lib/cart";
import { useLanguage } from "../lib/LanguageContext";
import { getT } from "../lib/translations";

export default function OrderSuccess() {
  const router = useRouter();
  const { order_ids: orderIdsParam, id: paymentId } = router.query;
  const { lang } = useLanguage();
  const t = getT(lang);

  const [status, setStatus] = useState("verifying"); // verifying | success | failed

  useEffect(() => {
    if (!orderIdsParam || !paymentId) {
      // ما وصلنا معاملات كافية بالرابط (مثلاً المستخدم فتح الصفحة مباشرة
      // أو انقطع الاتصال قبل ما موياسر يكمل التحويل) — ما نسيبه معلّق للأبد
      if (router.isReady) setStatus("failed");
      return;
    }

    const orderIds = orderIdsParam.split(",").filter(Boolean);

    async function verify() {
      try {
        const res = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIds, paymentId }),
        });

        if (res.ok) {
          clearCart();
          setStatus("success");
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      }
    }

    verify();
  }, [orderIdsParam, paymentId, router.isReady]);

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm text-center">
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      {status === "verifying" && (
        <>
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-xl font-bold text-navy mb-2">{t("success_verifying_title")}</h1>
          <p className="text-gray-600">{t("success_verifying_desc")}</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-navy mb-2">{t("success_title")}</h1>
          <p className="text-gray-600 mb-6">{t("success_desc")}</p>
          <Link
            href="/dashboard"
            className="inline-block bg-navy text-white px-6 py-3 rounded-xl font-bold hover:opacity-90"
          >
            {t("success_go_dashboard")}
          </Link>
        </>
      )}

      {status === "failed" && (
        <>
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">{t("success_failed_title")}</h1>
          <p className="text-gray-600 mb-6">{t("success_failed_desc")}</p>
          <Link
            href="/store"
            className="inline-block bg-navy text-white px-6 py-3 rounded-xl font-bold hover:opacity-90"
          >
            {t("success_back_store")}
          </Link>
        </>
      )}
    </div>
  );
}
