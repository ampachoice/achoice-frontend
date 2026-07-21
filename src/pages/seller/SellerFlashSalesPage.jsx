import { useState, useEffect, useCallback } from "react";
import SellerLayout from "../../components/seller/SellerLayout";
import {
  getFlashSaleRequests,
  createFlashSaleRequest,
  withdrawFlashSaleRequest,
  getSellerProducts,
} from "../../services/sellerService";

// Lagos (WAT) is a fixed UTC+1 offset year-round — same conversion approach
// as AdminFlashSalesPage.jsx, so a seller's "3pm" means the same instant an
// admin would enter for the same sale.
const LAGOS_OFFSET = "+01:00";
const lagosLocalToUtcIso = (localValue) => {
  if (!localValue) return null;
  return new Date(`${localValue}:00${LAGOS_OFFSET}`).toISOString();
};
const formatLagos = (utcIso) => {
  if (!utcIso) return "—";
  const lagosMs = new Date(utcIso).getTime() + 60 * 60 * 1000;
  const d = new Date(lagosMs);
  return d.toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_COLORS = {
  pending: { bg: "#fff4de", color: "#a86a00" },
  approved: { bg: "#e6f4ea", color: "#1f4d1f" },
  rejected: { bg: "#fbe9e9", color: "#a81f1f" },
};

const EMPTY_FORM = { product_id: "", suggested_sale_price: "", suggested_quantity_limit: "", suggested_starts_at: "", suggested_ends_at: "" };

export default function SellerFlashSalesPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState("");

  const [availableProducts, setAvailableProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadRequests = useCallback(() => {
    setLoading(true);
    getFlashSaleRequests(statusFilter ? { status: statusFilter } : {})
      .then((res) => setRequests(res.data?.data || []))
      .catch(() => showToast("Failed to load your flash sale requests."))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const openForm = () => {
    setForm(EMPTY_FORM);
    setSelectedProduct(null);
    setFormError(null);
    setShowForm(true);
    // Only an approved, available product is eligible — same rule the backend enforces.
    getSellerProducts({ status: "available", per_page: 100 })
      .then((res) => setAvailableProducts(res.data?.data || []))
      .catch(() => setAvailableProducts([]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.product_id) {
      setFormError("Select a product.");
      return;
    }

    setSaving(true);
    try {
      await createFlashSaleRequest({
        product_id: form.product_id,
        suggested_sale_price: Number(form.suggested_sale_price),
        suggested_quantity_limit: Number(form.suggested_quantity_limit),
        suggested_starts_at: lagosLocalToUtcIso(form.suggested_starts_at),
        suggested_ends_at: lagosLocalToUtcIso(form.suggested_ends_at),
      });
      showToast("Flash sale request submitted for review.");
      setShowForm(false);
      loadRequests();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async (req) => {
    if (!window.confirm(`Withdraw your flash sale request for "${req.product?.name}"?`)) return;
    try {
      await withdrawFlashSaleRequest(req.id);
      showToast("Request withdrawn.");
      loadRequests();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to withdraw request.");
    }
  };

  return (
    <SellerLayout
      title="Flash Sales"
      subtitle="Request a time-limited discount on one of your products — admin reviews before it goes live."
      headerActions={<button style={s.newBtn} onClick={openForm}>+ Request Flash Sale</button>}
    >
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.tabRow}>
        {STATUS_TABS.map((tab) => (
          <button key={tab.value || "all"} style={statusFilter === tab.value ? s.tabActive : s.tab} onClick={() => setStatusFilter(tab.value)}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={s.emptyState}>Loading your requests...</div>
      ) : requests.length === 0 ? (
        <div style={s.emptyState}>
          {statusFilter ? `No ${statusFilter} requests.` : "You haven't requested a flash sale yet."}
        </div>
      ) : (
        <div style={s.grid}>
          {requests.map((req) => {
            const colors = STATUS_COLORS[req.status] || { bg: "#eee", color: "#555" };
            return (
              <div key={req.id} style={s.card}>
                <div style={s.cardHeader}>
                  <div style={{ fontWeight: 700, color: "#111" }}>{req.product?.name}</div>
                  <span style={{ ...s.statusBadge, background: colors.bg, color: colors.color }}>{req.status}</span>
                </div>
                <div style={s.statRow}>
                  <div><div style={s.statLabel}>Suggested Price</div><div style={s.statValue}>₦{Number(req.suggested_sale_price).toLocaleString()}</div></div>
                  <div><div style={s.statLabel}>Quantity Limit</div><div style={s.statValue}>{req.suggested_quantity_limit}</div></div>
                </div>
                <div style={s.dateRow}>{formatLagos(req.suggested_starts_at)} → {formatLagos(req.suggested_ends_at)}</div>
                {req.status === "rejected" && req.rejection_reason && (
                  <div style={s.rejectionNote}>⚠️ {req.rejection_reason}</div>
                )}
                {req.status === "pending" && (
                  <button style={s.withdrawBtn} onClick={() => handleWithdraw(req)}>Withdraw</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div style={s.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>Request a Flash Sale</div>
            {formError && <div style={s.formError}>⚠️ {formError}</div>}

            <form onSubmit={handleSubmit}>
              <div style={s.field}>
                <label style={s.label}>Product</label>
                <select
                  style={s.input}
                  required
                  value={form.product_id}
                  onChange={(e) => {
                    const p = availableProducts.find((ap) => String(ap.id) === e.target.value);
                    setSelectedProduct(p || null);
                    setForm((f) => ({ ...f, product_id: e.target.value }));
                  }}
                >
                  <option value="">Select an available product</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — ₦{Number(p.price).toLocaleString()} ({p.quantity} in stock)</option>
                  ))}
                </select>
                {availableProducts.length === 0 && (
                  <div style={s.hint}>You don't have any approved, available products yet — a product must be approved before it's eligible.</div>
                )}
              </div>

              <div style={s.row2}>
                <div style={s.field}>
                  <label style={s.label}>Suggested Sale Price (₦)</label>
                  <input style={s.input} type="number" min="0" step="0.01" required value={form.suggested_sale_price} onChange={(e) => setForm((f) => ({ ...f, suggested_sale_price: e.target.value }))} />
                  {selectedProduct && <div style={s.hint}>Must be below ₦{Number(selectedProduct.price).toLocaleString()}</div>}
                </div>
                <div style={s.field}>
                  <label style={s.label}>Quantity Limit</label>
                  <input style={s.input} type="number" min="1" required value={form.suggested_quantity_limit} onChange={(e) => setForm((f) => ({ ...f, suggested_quantity_limit: e.target.value }))} />
                  {selectedProduct && <div style={s.hint}>Up to {selectedProduct.quantity} in stock</div>}
                </div>
              </div>

              <div style={s.row2}>
                <div style={s.field}>
                  <label style={s.label}>Starts At (Lagos time)</label>
                  <input style={s.input} type="datetime-local" required value={form.suggested_starts_at} onChange={(e) => setForm((f) => ({ ...f, suggested_starts_at: e.target.value }))} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Ends At (Lagos time)</label>
                  <input style={s.input} type="datetime-local" required value={form.suggested_ends_at} onChange={(e) => setForm((f) => ({ ...f, suggested_ends_at: e.target.value }))} />
                </div>
              </div>

              <div style={s.modalActions}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" style={saving ? s.saveBtnDisabled : s.saveBtn} disabled={saving}>{saving ? "Submitting..." : "Submit Request"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SellerLayout>
  );
}

const s = {
  newBtn: { padding: "12px 22px", background: "#1f4d1f", color: "#fff", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  toast: { position: "fixed", top: 20, right: 20, background: "#1f4d1f", color: "#fff", padding: "12px 20px", borderRadius: 8, fontSize: 13, zIndex: 999, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" },
  tabRow: { display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" },
  tab: { padding: "8px 14px", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#555", cursor: "pointer", fontFamily: "inherit" },
  tabActive: { padding: "8px 14px", background: "#1f4d1f", border: "1px solid #1f4d1f", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: "inherit" },
  emptyState: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: 48, textAlign: "center", color: "#888", fontSize: 14 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 },
  card: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: 20 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8 },
  statusBadge: { fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "capitalize" },
  statRow: { display: "flex", gap: 24, marginBottom: 10 },
  statLabel: { fontSize: 11, color: "#888", marginBottom: 3 },
  statValue: { fontSize: 15, fontWeight: 700, color: "#111" },
  dateRow: { fontSize: 12, color: "#666", marginBottom: 10 },
  rejectionNote: { fontSize: 11.5, color: "#a81f1f", background: "#fbe9e9", borderRadius: 6, padding: "8px 10px", marginBottom: 8 },
  withdrawBtn: { padding: "8px 14px", background: "#fff", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#a81f1f", cursor: "pointer", fontFamily: "inherit" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 },
  modal: { background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { fontSize: 19, fontWeight: 700, color: "#111", marginBottom: 16 },
  formError: { background: "#fff0f0", color: "#cc0000", border: "1px solid #ffb3b3", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  field: { marginBottom: 14 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 6 },
  input: { width: "100%", padding: "10px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13.5, outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  hint: { fontSize: 11, color: "#888", marginTop: 5 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  cancelBtn: { padding: "11px 20px", background: "#fff", color: "#555", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  saveBtn: { padding: "11px 22px", background: "#1f4d1f", color: "#fff", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  saveBtnDisabled: { padding: "11px 22px", background: "#ccc", color: "#fff", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: "not-allowed", fontFamily: "inherit" },
};
