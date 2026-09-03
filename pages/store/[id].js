import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import Head from "next/head";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/useAuth";

const SHIPPING_COST = 25; // تكلفة شحن ثابتة بالمرحلة الأولى

export default function DesignDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [error, setError] = useState("");
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null); // الطلب بعد إنشائه، قبل الدفع
  const [moyasarReady, setMoyasarReady] = useState(false);

  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
  });

  useEffect(() => {
    if (!id) return;
    async function loadDesign() {
      const { data } = await supabase
        .from("designs")
        .select("*")
        .eq("id", id)
        .single();
      setDesign(data);
      setLoading(false);
    }
    loadDesign();
  }, [id]);

  // نبني نموذج الدفع بمجرد ما يصير عندنا طلب منشأ + مكتبة Moyasar جاهزة
  useEffect(() => {
    if (!activeOrder || !moyasarReady || !window.Moyasar) return;

    const total = activeOrder.total_price + activeOrder.shipping_cost;

    window.Moyasar.init({
      element: ".mysr-form",
      amount: Math.round(total * 100), // بالهللة
      currency: "SAR",
      description: design?.title || "طلب طباعة",
      publishable_api_key: process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-success?order_id=${activeOrder.id}`,
      supported_networks: ["mada", "visa", "mastercard"],
      methods: ["creditcard"],
    });
  }, [activeOrder, moyasarReady, design]);

  function handleOrderClick() {
    if (!user) {
      router.push("/login");
      return;
    }
    setShowShippingForm(true);
  }

  async function handleCreateOrder(e) {
    e.preventDefault();
    setError("");
    setCreatingOrder(true);

    try {
      const { data: order, error: insertError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          design_id: design.id,
          total_price: design.price,
          shipping_cost: SHIPPING_COST,
          status: "pending_payment",
          payment_status: "unpaid",
          shipping_name: shipping.name,
          shipping_phone: shipping.phone,
          shipping_city: shipping.city,
          shipping_address: shipping.address,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // نعرض نموذج الدفع بدل نموذج الشحن
      setActiveOrder(order);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingOrder(false);
    }
  }

  if (loading) return <p className="text-center">جاري التحميل...</p>;
  if (!design) return <p className="text-center">التصميم غير موجود.</p>;

  const total = (design.price + SHIPPING_COST).toFixed(2);

  return (
    <>
      <Head>
        <link
          href="https://cdn.moyasar.com/mpf/1.14.0/moyasar.css"
          rel="stylesheet"
        />
      </Head>
      <Script
        src="https://cdn.moyasar.com/mpf/1.14.0/moyasar.js"
        onLoad={() => setMoyasarReady(true)}
      />

      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm">
        <div className="h-56 bg-gray-100 rounded-lg mb-6 flex items-center justify-center overflow-hidden">
          {design.preview_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={design.preview_image_url}
              alt={design.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-gray-400">لا توجد معاينة</span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-navy mb-2">{design.title}</h1>
        <p className="text-gray-600 mb-4">{design.description}</p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm space-y-1">
          <div className="flex justify-between">
            <span>سعر التصميم/الطباعة</span>
            <span>{design.price} ريال</span>
          </div>
          <div className="flex justify-between">
            <span>الشحن</span>
            <span>{SHIPPING_COST} ريال</span>
          </div>
          <div className="flex justify-between font-bold text-navy border-t pt-2 mt-2">
            <span>الإجمالي</span>
            <span>{total} ريال</span>
          </div>
        </div>

        {/* حالة 1: ما بدأ الطلب بعد */}
        {!showShippingForm && !activeOrder && (
          <button
            onClick={handleOrderClick}
            className="w-full bg-navy text-white py-3 rounded-lg font-bold hover:opacity-90"
          >
            اطلب طباعة هذا التصميم
          </button>
        )}

        {/* حالة 2: نموذج بيانات الشحن */}
        {showShippingForm && !activeOrder && (
          <form onSubmit={handleCreateOrder} className="space-y-4">
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
              className="w-full bg-teal text-white py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
            >
              {creatingOrder ? "جاري التجهيز..." : "متابعة للدفع"}
            </button>
          </form>
        )}

        {/* حالة 3: نموذج الدفع من Moyasar */}
        {activeOrder && (
          <div>
            <h2 className="font-bold text-navy mb-4">إتمام الدفع</h2>
            <div className="mysr-form"></div>
          </div>
        )}
      </div>
    </>
  );
}
