// يتحقق من بيانات المستلم قبل الموافقة على عرض الطباعة. بدون imports عشان يسهل
// اختباره؛ validateShipping يجي من lib/checkout.js. السعر والطابع ما يجون من هنا أبد:
// دالة accept_print_quote في قاعدة البيانات تاخذهم من العرض المحفوظ.
export function quoteRecipient(quote, recipient, validateShipping) {
  const shipping = validateShipping({
    name: recipient?.name,
    phone: recipient?.phone,
    address: recipient?.address,
    city: quote.city,
  });
  return {
    p_name: shipping.shipping_name,
    p_phone: shipping.shipping_phone,
    p_address: shipping.shipping_address,
  };
}
