export function paymentKeyIsConfigured(value) {
  const key = (value || "").trim();
  return /^pk_(test|live)_[a-zA-Z0-9]+$/.test(key) &&
    !/your|example|placeholder|replace|xxx/i.test(key);
}

export function paymentUnavailableMessage(lang) {
  return lang === "en"
    ? "Payment is temporarily unavailable. Please try again later."
    : "الدفع غير متاح مؤقتًا. يرجى المحاولة لاحقًا.";
}
export function getPublishableKey() {
  return (process.env.NEXT_PUBLIC_MOYASAR_KEY || process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY || "").trim();
}


// وضع المفتاح: test أو live — بدون ما نكشف المفتاح نفسه
export function keyMode(value) {
  const match = /^(pk|sk)_(test|live)_/.exec((value || "").trim());
  return match ? match[2] : null;
}

// يتأكد إن مفتاح ميسر العام والسري من نفس الوضع. لو واحد test والثاني live،
// الزبون يدفع في وضع والسيرفر يتحقق في وضع ثاني فيفشل تأكيد الدفع دايمًا.
export function paymentReadiness(env) {
  const publishable = (env.NEXT_PUBLIC_MOYASAR_KEY || env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY || "").trim();
  const secret = (env.MOYASAR_SECRET_KEY || "").trim();
  const publishableMode = paymentKeyIsConfigured(publishable) ? keyMode(publishable) : null;
  const secretMode = /^sk_(test|live)_[a-zA-Z0-9]+$/.test(secret) ? keyMode(secret) : null;
  let problem = null;
  if (!publishableMode) problem = "missing_publishable_key";
  else if (!secretMode) problem = "missing_secret_key";
  else if (publishableMode !== secretMode) problem = "key_mode_mismatch";
  return {
    ready: !problem,
    problem,
    publishableMode,
    secretMode,
    webhookConfigured: Boolean((env.MOYASAR_WEBHOOK_SECRET || "").trim()),
    siteUrlConfigured: Boolean((env.NEXT_PUBLIC_SITE_URL || "").trim()),
  };
}
