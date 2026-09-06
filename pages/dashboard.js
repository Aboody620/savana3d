import { useEffect, useState } from "react";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../lib/LanguageContext";
import { getT } from "../lib/translations";

export default function Dashboard() {
  const { user, profile, loading: authLoading, profileError } = useAuth();
  const { lang } = useLanguage();
  const t = getT(lang);

  const STATUS_LABELS = {
    pending_payment: t("status_pending_payment"),
    pending: t("status_pending"),
    accepted: t("status_accepted"),
    printing: t("status_printing"),
    shipped: t("status_shipped"),
    completed: t("status_completed"),
    cancelled: t("status_cancelled"),
  };

  const ROLE_LABELS = {
    customer: t("role_customer"),
    designer: t("role_designer"),
    printer: t("role_printer"),
  };

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
      alert(t("dash_tracking_placeholder"));
      return;
    }
    updateStatus(orderId, "shipped", { tracking_number: trackingNumber });
  }

  if (authLoading) return <p className="text-center">{t("dash_loading")}</p>;
  if (!user) return <p className="text-center text-gray-600">{t("dash_login_required")}</p>;
  if (!profile) {
    return (
      <div className="text-center space-y-3">
        <p className="text-red-600">
          {t("dash_load_error")}
          {profileError ? `: ${profileError}` : ""}.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-navy text-white text-sm px-4 py-2 rounded-lg"
        >
          {t("dash_retry")}
        </button>
      </div>
    );
  }
  if (loadingData) return <p className="text-center">{t("dash_loading")}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">
        {t("dash_title")} — {profile?.full_name}{" "}
        <span className="text-sm text-gray-500">
          ({ROLE_LABELS[profile?.role] || profile?.role})
        </span>
      </h1>

      {/* لوحة الزبون */}
      {profile?.role === "customer" && (
        <div className="space-y-4">
          {orders.length === 0 && <p className="text-gray-600">{t("dash_no_orders")}</p>}
          {orders.map((o) => (
            <div key={o.id} className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold">{o.designs?.title || t("dash_custom_design")}</p>
                <span className="bg-navy text-white text-xs px-3 py-1 rounded-full">
                  {STATUS_LABELS[o.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {o.total_price} {t("riyal")} + {t("cart_shipping")} {o.shipping_cost} {t("riyal")}
              </p>
              {o.shipping_city && (
                <p className="text-sm text-gray-500 mt-1">
                  {t("dash_shipping_to")}: {o.shipping_city} — {o.shipping_address}
                </p>
              )}
              {o.tracking_number && (
                <p className="text-sm text-teal font-bold mt-1">
                  {t("dash_tracking_number")}: {o.tracking_number}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* لوحة صاحب الطابعة */}
      {profile?.role === "printer" && (
        <div className="space-y-4">
          {orders.length === 0 && <p className="text-gray-600">{t("dash_no_available_orders")}</p>}
          {orders.map((o) => (
            <div key={o.id} className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold">{o.designs?.title || t("dash_custom_design")}</p>
                <span className="bg-gray-200 text-xs px-3 py-1 rounded-full">
                  {STATUS_LABELS[o.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1">{o.total_price} {t("riyal")}</p>

              {o.printer_id === user.id && o.shipping_name && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-3">
                  <p>{t("dash_name_label")}: {o.shipping_name}</p>
                  <p>{t("dash_phone_label")}: {o.shipping_phone}</p>
                  <p>{t("dash_address_label")}: {o.shipping_city} — {o.shipping_address}</p>
                </div>
              )}

              {o.status === "pending" && (
                <button
                  onClick={() => acceptOrder(o.id)}
                  className="bg-teal text-white text-sm px-4 py-1.5 rounded-lg"
                >
                  {t("dash_accept_order")}
                </button>
              )}

              {o.printer_id === user.id && o.status === "accepted" && (
                <button
                  onClick={() => updateStatus(o.id, "printing")}
                  className="bg-navy text-white text-sm px-4 py-1.5 rounded-lg"
                >
                  {t("dash_start_printing")}
                </button>
              )}

              {o.printer_id === user.id && o.status === "printing" && (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder={t("dash_tracking_placeholder")}
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
                    {t("dash_confirm_shipping")}
                  </button>
                </div>
              )}

              {o.printer_id === user.id && o.status === "shipped" && (
                <p className="text-sm text-teal font-bold">
                  {t("dash_shipped_prefix")}: {o.tracking_number}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* لوحة المصمم */}
      {profile?.role === "designer" && (
        <div className="space-y-4">
          {designs.length === 0 && <p className="text-gray-600">{t("dash_no_designs")}</p>}
          {designs.map((d) => (
            <div key={d.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <p className="font-bold">{d.title}</p>
                <p className="text-sm text-gray-500">{d.price} {t("riyal")}</p>
              </div>
              {d.file_url && (
                <a
                  href={d.file_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-navy text-white text-sm px-4 py-1.5 rounded-lg hover:opacity-90 whitespace-nowrap"
                >
                  {t("dash_download_file")}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
