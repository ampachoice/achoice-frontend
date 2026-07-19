import { useState, useEffect, useCallback } from "react";
import SellerLayout from "../../components/seller/SellerLayout";
import { getSellerOrders, markOrderReadyToShip } from "../../services/sellerService";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "ready_to_ship", label: "Ready to Ship" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "cancellation_pending", label: "Cancellation Pending" },
];

const STATUS_COLORS = {
  pending: { bg: "#fff4de", color: "#a86a00" },
  processing: { bg: "#eaf2fb", color: "#1a5fa8" },
  ready_to_ship: { bg: "#eee6fb", color: "#5a1aa8" },
  shipped: { bg: "#e0f4f4", color: "#1a7a7a" },
  delivered: { bg: "#e6f4ea", color: "#1f4d1f" },
  cancelled: { bg: "#fbe9e9", color: "#a81f1f" },
  cancellation_pending: { bg: "#fbe9e9", color: "#a81f1f" },
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SellerOrdersPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [actingId, setActingId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadOrders = useCallback(() => {
    setLoading(true);
    getSellerOrders({ ...(statusFilter && { status: statusFilter }), page })
      .then((res) => {
        setItems(res.data?.data || []);
        setMeta(res.data);
      })
      .catch(() => showToast("Failed to load your orders."))
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleMarkReady = async (item) => {
    setActingId(item.id);
    try {
      await markOrderReadyToShip(item.id);
      showToast(`Marked "${item.product?.name}" ready to ship.`);
      loadOrders();
      if (detailItem?.id === item.id) setDetailItem(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update this order.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <SellerLayout title="Orders" subtitle="Orders containing your products.">
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.tabRow}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || "all"}
            style={statusFilter === tab.value ? s.tabActive : s.tab}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={s.emptyState}>Loading your orders...</div>
      ) : items.length === 0 ? (
        <div style={s.emptyState}>
          {statusFilter ? `No orders with status "${statusFilter.replace(/_/g, " ")}".` : "No orders yet."}
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Order</th>
                <th style={s.th}>Product</th>
                <th style={s.th}>Buyer</th>
                <th style={s.th}>Qty</th>
                <th style={s.th}>Subtotal</th>
                <th style={s.th}>Placed</th>
                <th style={s.th}>Status</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const colors = STATUS_COLORS[item.status] || { bg: "#eee", color: "#555" };
                return (
                  <tr key={item.id} style={s.tr}>
                    <td style={s.td}>
                      <button style={s.orderLink} onClick={() => setDetailItem(item)}>
                        {item.order?.order_number || `#${item.order_id}`}
                      </button>
                    </td>
                    <td style={s.td}>{item.product_name || item.product?.name}</td>
                    <td style={s.td}>{item.order?.buyer?.name}</td>
                    <td style={s.td}>{item.quantity} {item.unit}</td>
                    <td style={s.td}>₦{Number(item.subtotal).toLocaleString()}</td>
                    <td style={s.td}>{timeAgo(item.created_at)}</td>
                    <td style={s.td}>
                      <span style={{ ...s.statusBadge, background: colors.bg, color: colors.color }}>
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={s.td}>
                      {item.status === "processing" && (
                        <button
                          style={s.actionBtn}
                          disabled={actingId === item.id}
                          onClick={() => handleMarkReady(item)}
                        >
                          {actingId === item.id ? "..." : "Mark Ready to Ship"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div style={s.pagination}>
          <button style={s.pageBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span style={{ fontSize: 12.5, color: "#666" }}>Page {meta.current_page} of {meta.last_page}</span>
          <button style={s.pageBtn} disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}

      {detailItem && (
        <div style={s.modalOverlay} onClick={() => setDetailItem(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>{detailItem.order?.order_number || `Order #${detailItem.order_id}`}</div>

            <DetailRow label="Product" value={`${detailItem.product_name || detailItem.product?.name} × ${detailItem.quantity} ${detailItem.unit}`} />
            <DetailRow label="Subtotal" value={`₦${Number(detailItem.subtotal).toLocaleString()}`} />
            <DetailRow label="Status" value={detailItem.status.replace(/_/g, " ")} />
            <DetailRow label="Buyer" value={detailItem.order?.buyer?.name} />
            <DetailRow label="Buyer Contact" value={`${detailItem.order?.buyer?.email || ""} ${detailItem.order?.buyer?.phone ? "· " + detailItem.order.buyer.phone : ""}`} />
            <DetailRow label="Delivery Address" value={detailItem.order?.delivery_address} />
            <DetailRow label="Delivery State" value={detailItem.order?.delivery_state} />
            <DetailRow label="Payment" value={`${detailItem.order?.payment_status || ""} ${detailItem.order?.payment_method ? "· " + detailItem.order.payment_method : ""}`} />
            <DetailRow label="Placed" value={new Date(detailItem.created_at).toLocaleString()} />

            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setDetailItem(null)}>Close</button>
              {detailItem.status === "processing" && (
                <button
                  style={s.saveBtn}
                  disabled={actingId === detailItem.id}
                  onClick={() => handleMarkReady(detailItem)}
                >
                  {actingId === detailItem.id ? "Saving..." : "Mark Ready to Ship"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </SellerLayout>
  );
}

function DetailRow({ label, value }) {
  if (!value || !value.toString().trim()) return null;
  return (
    <div style={s.detailRow}>
      <div style={s.detailLabel}>{label}</div>
      <div style={s.detailValue}>{value}</div>
    </div>
  );
}

const s = {
  toast: { position: "fixed", top: 20, right: 20, background: "#1f4d1f", color: "#fff", padding: "12px 20px", borderRadius: 8, fontSize: 13, zIndex: 999, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" },
  tabRow: { display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" },
  tab: { padding: "8px 14px", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#555", cursor: "pointer", fontFamily: "inherit" },
  tabActive: { padding: "8px 14px", background: "#1f4d1f", border: "1px solid #1f4d1f", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: "inherit" },
  emptyState: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: 48, textAlign: "center", color: "#888", fontSize: 14 },
  tableWrap: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, overflow: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #eee", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f2f0ec" },
  td: { padding: "13px 16px", verticalAlign: "middle", whiteSpace: "nowrap" },
  orderLink: { background: "none", border: "none", color: "#1f4d1f", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", padding: 0 },
  statusBadge: { display: "inline-block", fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "capitalize" },
  actionBtn: { padding: "7px 12px", background: "#1f4d1f", color: "#fff", border: "none", borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 18 },
  pageBtn: { padding: "8px 16px", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 },
  modal: { background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { fontSize: 17, fontWeight: 700, color: "#111", marginBottom: 18 },
  detailRow: { display: "flex", justifyContent: "space-between", gap: 14, padding: "9px 0", borderBottom: "1px solid #f2f0ec", fontSize: 13 },
  detailLabel: { color: "#888", flexShrink: 0 },
  detailValue: { color: "#111", fontWeight: 600, textAlign: "right" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 },
  cancelBtn: { padding: "10px 18px", background: "#fff", color: "#555", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  saveBtn: { padding: "10px 18px", background: "#1f4d1f", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
};
