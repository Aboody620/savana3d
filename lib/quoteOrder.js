// يبني طلب الطباعة من عرض وافق عليه الزبون. بدون imports عشان يسهل اختباره؛
// validateShipping يجي من lib/checkout.js.

export function buildQuoteOrder(quote, recipient, validateShipping) {
  const product = Math.round(Number(quote.product_price) * 100) / 100;
  const shipping = Math.round(Number(quote.shipping_price) * 100) / 100;
  if (!Number.isFinite(product) || product <= 0 || !Number.isFinite(shipping) || shipping < 0) {
    const error = new Error("العرض غير مكتمل");
    error.status = 409;
    throw error;
  }
  const address = validateShipping({
    name: recipient?.name,
    phone: recipient?.phone,
    address: recipient?.address,
    city: quote.city,
  });
  const details = [`${quote.material} · ${quote.color}`, quote.notes].filter(Boolean).join("\n");
  return {
    customer_id: quote.customer_id,
    design_id: quote.design_id,
    printer_id: quote.printer_id,
    quantity: quote.quantity,
    total_price: product,
    shipping_cost: shipping,
    notes: details.slice(0, 2000),
    status: "pending_payment",
    payment_status: "unpaid",
    ...address,
  };
}
