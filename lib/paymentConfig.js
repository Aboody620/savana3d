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

