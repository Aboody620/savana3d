// OTO createOrder: senderInformation supplies a pickup address per order.
// https://apis.tryoto.com/ — creating the order must not purchase a shipment.
export function buildOtoOrder(order, sender, parcel) {
  const clean = (value) => typeof value === "string" ? value.trim() : "";
  const required = (value, label, max = 200) => {
    const text = clean(value);
    if (!text || text.length > max) throw new Error(`بيانات غير مكتملة: ${label}`);
    return text;
  };
  const phone = required(sender?.phone, "جوال المرسل", 20).replace(/[\s()-]/g, "");
  if (!/^(?:05\d{8}|(?:\+?966)5\d{8})$/.test(phone)) throw new Error("أدخل جوال المرسل السعودي الصحيح");
  const shortAddress = required(sender?.shortAddress, "العنوان الوطني المختصر", 8).toUpperCase();
  if (!/^[A-Z]{4}\d{4}$/.test(shortAddress)) throw new Error("العنوان المختصر يتكون من أربعة أحرف وأربعة أرقام");
  const dimensions = {};
  for (const field of ["weight", "width", "length", "height"]) {
    const value = Number(parcel?.[field]);
    if (!Number.isFinite(value) || value <= 0 || value > 1000) throw new Error("أدخل وزن وأبعاد الطرد الصحيحة");
    dimensions[field] = value;
  }
  const total = Number(order.total_price);
  const shipping = Number(order.shipping_cost || 0);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(shipping) || shipping < 0) throw new Error("مبلغ الطلب غير صالح");
  return {
    orderId: `SAVANA-${order.id}`,
    createShipment: false,
    payment_method: "paid", amount: total + shipping, amount_due: 0, currency: "SAR",
    shippingAmount: shipping, subtotal: total,
    packageCount: 1, packageWeight: dimensions.weight,
    boxWidth: dimensions.width, boxLength: dimensions.length, boxHeight: dimensions.height,
    senderInformation: {
      senderId: order.printer_id,
      senderAddressName: `Savana3D ${order.id}`,
      senderFullName: required(sender?.name, "اسم المرسل", 100),
      senderMobile: phone.startsWith("0") ? `966${phone.slice(1)}` : phone.replace(/^\+/, ""),
      senderCountry: "SA", senderShortAddressCode: shortAddress,
      senderCity: required(sender?.city, "مدينة الاستلام", 100),
      senderAddressLine: required(sender?.address, "عنوان الاستلام", 500),
    },
    customer: {
      name: required(order.shipping_name, "اسم المستلم", 100),
      mobile: required(order.shipping_phone, "جوال المستلم", 20),
      city: required(order.shipping_city, "مدينة المستلم", 100),
      address: required(order.shipping_address, "عنوان المستلم", 500),
      country: "SA", refID: order.customer_id,
    },
    // Existing orders have no quantity column; the item represents this entire print job.
    items: [{ name: order.designs?.title || "طلب طباعة مخصص", sku: order.id,
      price: total, rowTotal: total, quantity: 1 }],
  };
}
