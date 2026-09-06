import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Script from "next/script";
import Head from "next/head";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";
import { getCart, removeFromCart, updateQuantity, getCartSubtotal } from "../lib/cart";

const SHIPPING_COST = 25; // تكلفة شحن ثابتة للسلة كاملة بالمرحلة الأولى

export default function Cart() {
  const router = useRouter();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [error, setError] = useState("");
  const [activeCheckout, setActiveCheckout] = useState(null); // { orderIds, total }
  const [moyasarReady, setMoyasarReady] = useState(false);

  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
  });

  useEffect(() => {
    setItems(getCart());
    function onUpdate() {
      setItems(getCart());
    }
    window.addEventListener("cart-updated", onUpdate);
    return () => window.removeEventListener("cart-updated", onUpdate);
  }, []);

  useEffect(() => {
    if (!activeCheckout || !moyasarReady || !window.Moyasar) return;

    window.Moyasar.init({
      element: ".mysr-form",
      amount: Math.round(activeCheckout.total * 100),
      currency: "SAR",
      description: `طلب Savana3D — ${activeCheckout.orderIds.length} منتج`,
      publishable_api_key: process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-success?order_ids=${activeCheckout.orderIds.join(",")}`,
      supported_networks: ["mada", "visa", "mastercard"],
      methods: ["creditcard"],
    });
  }, [activeCheckout, moyasarReady]);

  const subtotal = getCartSubtotal();
  const total = items.length > 0 ? subtotal + SHIPPING_COST : 0;

  function handleCheckoutClick() {
    if (!user) {
      router.push("/login");
      return;
    }
    setShowShippingForm(true);
  }

  async function handleCreateOrders(e) {
    e.preventDefault();
    setError("");
    setCreatingOrder(true);

    try {
      // كل عنصر بالسلة يصير طلب مستقل، وتكلفة الشحن كاملة تُحسب على أول طلب فقط
      // (عشان المجموع الكلي يطابق مبلغ الدفع الواحد بالضبط)
      const rows = items.map((item, index) => ({
        customer_id: user.id,
        design_id: item.id,
        total_price: item.price * item.quantity,
        shipping_cost: index === 0 ? SHIPPING_COST : 0,
        status: "pending_payment",
        payment_status: "unpaid",
        shipping_name: shipping.name,
        shipping_phone: shipping.phone,
        shipping_city: shipping.city,
        shipping_address: shipping.address,
      }));

      const { data: orders, error: insertError } = await supabase
        .from("orders")
        .insert(rows)
        .select();

      if (insertError) throw insertError;

      setActiveCheckout({
        orderIds: orders.map((o) => o.id),
        total,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingOrder(false);
    }
  }

  if (items.length === 0 && !activeCheckout) {
    return (
      <div className="max-w-lg mx-auto text-center bg-white rounded-2xl shadow-sm p-10">
        <p className="text-gray-500 mb-6">سلتك فاضية حاليًا.</p>
        <Link
          href="/store"
          className="inline-block bg-navy text-white px-6 py-3 rounded-xl font-bold hover:opacity-90"
        >
          تصفّح المتجر
        </Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <link href="https://cdn.moyasar.com/mpf/1.14.0/moyasar.css" rel="stylesheet" />
      </Head>
      <Script src="https://cdn.moyasar.com/mpf/1.14.0/moyasar.js" onLoad={() => setMoyasarReady(true)} />

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-navy mb-6">سلة المشتريات</h1>

        {!activeCheckout && (
          <div className="bg-white rounded-2xl shadow-sm divide-y mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                <div className="h-16 w-16 rounded-lg bg-[#EEF2F6] overflow-hidden flex-shrink-0">
                  {item.preview_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.preview_image_url} alt={item.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-navy text-sm truncate">{item.title}</p>
                  <p className="text-teal font-bold text-sm">{item.price} ريال</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 text-navy font-bold"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 text-navy font-bold"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 text-xs font-medium mr-2"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}

        {!activeCheckout && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-sm space-y-2">
            <div className="flex justify-between">
              <span>المجموع الفرعي</span>
              <span>{subtotal.toFixed(2)} ريال</span>
            </div>
            <div className="flex justify-between">
              <span>الشحن</span>
              <span>{SHIPPING_COST} ريال</span>
            </div>
            <div className="flex justify-between font-bold text-navy border-t pt-2 mt-2 text-base">
              <span>الإجمالي</span>
              <span>{total.toFixed(2)} ريال</span>
            </div>
          </div>
        )}

        {!showShippingForm && !activeCheckout && (
          <button
            onClick={handleCheckoutClick}
            className="w-full bg-navy text-white py-3 rounded-xl font-bold hover:opacity-90 transition"
          >
            إتمام الشراء
          </button>
        )}

        {showShippingForm && !activeCheckout && (
          <form onSubmit={handleCreateOrders} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-navy">بيانات الشحن</h2>

            <div>
              <label className="block text-sm font-medium mb-1">الاسم الكامل</label>
              <input
                type="text"
                required
                value={shipping.name}
                onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">رقم الجوال</label>
              <input
                type="tel"
                required
                placeholder="05xxxxxxxx"
                value={shipping.phone}
                onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">المدينة</label>
              <input
                type="text"
                required
                value={shipping.city}
                onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">العنوان التفصيلي</label>
              <textarea
                required
                rows={2}
                value={shipping.address}
                onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={creatingOrder}
              className="w-full bg-teal text-white py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
            >
              {creatingOrder ? "جاري التجهيز..." : "متابعة للدفع"}
            </button>
          </form>
        )}

        {activeCheckout && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-navy mb-4">إتمام الدفع</h2>
            <div className="mysr-form"></div>
          </div>
        )}
      </div>
    </>
  );
}
