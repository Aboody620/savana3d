import { useEffect, useState } from "react";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabaseClient";

const STATUS_LABELS = {
  pending_payment: "بانتظار الدفع",
  pending: "بانتظار طابع",
  accepted: "تم القبول",
  printing: "جاري الطباعة",
  shipped: "تم الشحن",
  completed: "مكتمل",
  cancelled: "ملغى",
};

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [trackingInputs, setTrackingInputs] = useState({});

  useEffect(() => {
    if (!user || !profile) return;

    async function loadData() {
      if (profile.role === "customer") {
        const { data } = await supabase
          .from("orders")
          .select("*, designs(title)")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });
        setOrders(data || []);
      }

      if (profile.role === "printer") {
        // الطابع يشوف فقط الطلبات المدفوعة فعليًا (payment_status = paid)
        const { data } = await supabase
          .from("orders")
          .select("*, designs(title)")
          .eq("payment_status", "paid")
          .or(`status.eq.pending,printer_id.eq.${user.id}`)
          .order("created_at", { ascending: false });
        setOrders(data || []);
      }

      if (profile.role === "designer") {
        const { data } = await supabase
          .from("designs")
          .select("*")
          .eq("designer_id", user.id)
          .order("created_at", { ascending: false });
        setDesigns(data || []);
      }

      setLoadingData(false);
    }

    loadData();
  }, [user, profile]);

  async function acceptOrder(orderId) {
    await supabase
      .from("orders")
      .update({ printer_id: user.id, status: "accepted" })
      .eq("id", orderId);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, printer_id: user.id, status: "accepted" } : o
      )
    );
  }

  async function updateStatus(orderId, newStatus, extraFields = {}) {
    await supabase
      .from("orders")
      .update({ status: newStatus, ...extraFields })
      .eq("id", orderId);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: newStatus, ...extraFields } : o
      )
    );
  }

  function handleShip(orderId) {
    const trackingNumber = trackingInputs[orderId];
    if (!trackingNumber) {
      alert("الرجاء إدخال رقم تتبع الشحنة أول");
      return;
    }
    updateStatus(orderId, "shipped", { tracking_number: trackingNumber });
  }

  if (authLoading || loadingData) return <p className="text-center">جاري التحميل...</p>;
  if (!user) return <p className="text-center text-gray-600">سجّل الدخول عشان تشوف لوحتك.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">
        لوحتي — {profile?.full_name}{" "}
        <span className="text-sm text-gray-500">
          (
          {profile?.role === "customer"
            ? "زبون"
            : profile?.role === "designer"
            ? "مصمم"
            : "صاحب طابعة"}
          )
        </span>
      </h1>

      {/* لوحة الزبون */}
      {profile?.role === "customer" && (
        <div className="space-y-4">
          {orders.length === 0 && <p className="text-gray-600">لا توجد طلبات بعد.</p>}
          {orders.map((o) => (
            <div key={o.id} className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold">{o.designs?.title || "تصميم مخصص"}</p>
                <span className="bg-navy text-white text-xs px-3 py-1 rounded-full">
                  {STATUS_LABELS[o.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                المنتج {o.total_price} ريال + شحن {o.shipping_cost} ريال
              </p>
              {o.shipping_city && (
                <p className="text-sm text-gray-500 mt-1">
                  الشحن إلى: {o.shipping_city} — {o.shipping_address}
                </p>
              )}
              {o.tracking_number && (
                <p className="text-sm text-teal font-bold mt-1">
                  رقم تتبع الشحنة: {o.tracking_number}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* لوحة صاحب الطابعة */}
      {profile?.role === "printer" && (
        <div className="space-y-4">
          {orders.length === 0 && <p className="text-gray-600">لا توجد طلبات متاحة حاليًا.</p>}
          {orders.map((o) => (
            <div key={o.id} className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold">{o.designs?.title || "تصميم مخصص"}</p>
                <span className="bg-gray-200 text-xs px-3 py-1 rounded-full">
                  {STATUS_LABELS[o.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1">{o.total_price} ريال</p>

              {o.printer_id === user.id && o.shipping_name && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-3">
                  <p>الاسم: {o.shipping_name}</p>
                  <p>الجوال: {o.shipping_phone}</p>
                  <p>العنوان: {o.shipping_city} — {o.shipping_address}</p>
                </div>
              )}

              {o.status === "pending" && (
                <button
                  onClick={() => acceptOrder(o.id)}
                  className="bg-teal text-white text-sm px-4 py-1.5 rounded-lg"
                >
                  قبول الطلب
                </button>
              )}

              {o.printer_id === user.id && o.status === "accepted" && (
                <button
                  onClick={() => updateStatus(o.id, "printing")}
                  className="bg-navy text-white text-sm px-4 py-1.5 rounded-lg"
                >
                  بدء الطباعة
                </button>
              )}

              {o.printer_id === user.id && o.status === "printing" && (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="رقم تتبع الشحنة"
                    className="border rounded-lg px-3 py-1.5 text-sm flex-1"
                    value={trackingInputs[o.id] || ""}
                    onChange={(e) =>
                      setTrackingInputs({ ...trackingInputs, [o.id]: e.target.value })
                    }
                  />
                  <button
                    onClick={() => handleShip(o.id)}
                    className="bg-navy text-white text-sm px-4 py-1.5 rounded-lg whitespace-nowrap"
                  >
                    تأكيد الشحن
                  </button>
                </div>
              )}

              {o.printer_id === user.id && o.status === "shipped" && (
                <p className="text-sm text-teal font-bold">
                  تم الشحن — رقم التتبع: {o.tracking_number}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* لوحة المصمم */}
      {profile?.role === "designer" && (
        <div className="space-y-4">
          {designs.length === 0 && <p className="text-gray-600">لم ترفع أي تصاميم بعد.</p>}
          {designs.map((d) => (
            <div key={d.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <p className="font-bold">{d.title}</p>
                <p className="text-sm text-gray-500">{d.price} ريال</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
