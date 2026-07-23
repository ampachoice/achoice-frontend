import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../services/api";

export default function AdminProductApprovalsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const fetchPending = () => {
    setLoading(true);
    api
      .get("/admin/products/pending-review")
      .then((res) => setProducts(res.data?.data || res.data || []))
      .catch(() => showToast("Failed to load pending products."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (product) => {
    setBusyId(product.id);
    try {
      await api.patch(`/admin/products/${product.id}/approve`);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`"${product.name}" approved and is now live.`);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to approve product.");
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (product) => {
    setRejectTarget(product);
    setRejectReason("");
    setRejectError("");
  };

  const openEdit = (product) => {
    setEditTarget(product);
    setEditForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      discount_price: product.discount_price ? String(product.discount_price) : "",
      quantity: String(product.quantity ?? ""),
      unit: product.unit || "",
      category: product.category || "",
    });
    setEditError("");
  };

  const handleSaveEdit = async () => {
    setEditError("");
    setEditSaving(true);
    try {
      const res = await api.put(`/products/${editTarget.id}`, {
        name: editForm.name,
        description: editForm.description,
        price: Number(editForm.price),
        discount_price: editForm.discount_price ? Number(editForm.discount_price) : null,
        quantity: Number(editForm.quantity),
        unit: editForm.unit,
        category: editForm.category,
      });
      const updated = res.data?.product || res.data;
      setProducts((prev) => prev.map((p) => (p.id === editTarget.id ? { ...p, ...updated } : p)));
      showToast(`"${editForm.name}" updated.`);
      setEditTarget(null);
    } catch (err) {
      setEditError(err?.response?.data?.message || "Failed to save changes.");
    } finally {
      setEditSaving(false);
    }
  };

  const submitReject = async () => {
    if (rejectReason.trim().length < 10) {
      setRejectError("Reason must be at least 10 characters.");
      return;
    }
    setBusyId(rejectTarget.id);
    try {
      await api.patch(`/admin/products/${rejectTarget.id}/reject`, {
        reason: rejectReason.trim(),
      });
      setProducts((prev) => prev.filter((p) => p.id !== rejectTarget.id));
      showToast(`"${rejectTarget.name}" rejected.`);
      setRejectTarget(null);
    } catch (err) {
      setRejectError(
        err?.response?.data?.message || "Failed to reject product."
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout
      title="Product Approvals"
      subtitle={`${products.length} product${products.length === 1 ? "" : "s"} awaiting review`}
    >
      {toast && <div style={s.toast}>{toast}</div>}

      {loading ? (
        <p style={s.loading}>Loading pending products...</p>
      ) : products.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>✅</div>
          <div style={s.emptyTitle}>All caught up</div>
          <p style={s.emptyText}>No products are waiting for review.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {products.map((product) => (
            <div key={product.id} style={s.card}>
              <div style={s.cardTop}>
                <div>
                  <div style={s.productName}>{product.name}</div>
                  <div style={s.sellerMeta}>
                    {product.seller?.business_name || "Unknown seller"}
                    {product.seller?.state ? ` · ${product.seller.state}` : ""}
                  </div>
                </div>
                <div style={s.priceTag}>
                  ₦{Number(product.price).toLocaleString()}
                </div>
              </div>

              <p style={s.description}>{product.description}</p>

              <div style={s.metaRow}>
                <span>
                  <strong>Category:</strong> {product.category || "—"}
                </span>
                <span>
                  <strong>Qty:</strong> {product.quantity}{" "}
                  {product.unit || ""}
                </span>
                {product.min_order_qty && (
                  <span>
                    <strong>Min order:</strong> {product.min_order_qty}
                  </span>
                )}
              </div>

              <div style={s.actions}>
                <button
                  style={busyId === product.id ? s.approveBtnDisabled : s.approveBtn}
                  onClick={() => handleApprove(product)}
                  disabled={busyId === product.id}
                >
                  {busyId === product.id ? "Working..." : "✓ Approve"}
                </button>
                <button
                  style={s.editBtn}
                  onClick={() => openEdit(product)}
                  disabled={busyId === product.id}
                >
                  ✎ Edit
                </button>
                <button
                  style={s.rejectBtn}
                  onClick={() => openReject(product)}
                  disabled={busyId === product.id}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <div style={s.modalOverlay} onClick={() => setRejectTarget(null)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>Reject "{rejectTarget.name}"</div>
            <p style={s.modalSub}>
              This reason is shown to the seller so they know what to fix.
            </p>
            <textarea
              style={s.modalTextarea}
              rows={4}
              placeholder="e.g. Product photos are unclear, please re-upload with better lighting."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            {rejectError && <div style={s.modalError}>{rejectError}</div>}
            <div style={s.modalActions}>
              <button
                style={s.modalCancelBtn}
                onClick={() => setRejectTarget(null)}
              >
                Cancel
              </button>
              <button
                style={
                  busyId === rejectTarget.id
                    ? s.modalConfirmBtnDisabled
                    : s.modalConfirmBtn
                }
                onClick={submitReject}
                disabled={busyId === rejectTarget.id}
              >
                {busyId === rejectTarget.id ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div style={s.modalOverlay} onClick={() => setEditTarget(null)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>Edit "{editTarget.name}"</div>
            <p style={s.modalSub}>
              Fix anything before approving — the seller isn't notified of edits, only of the approval itself.
            </p>

            {editError && <div style={s.modalError}>{editError}</div>}

            <div style={s.editField}>
              <label style={s.editLabel}>Name</label>
              <input
                style={s.editInput}
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div style={s.editField}>
              <label style={s.editLabel}>Description</label>
              <textarea
                style={{ ...s.editInput, minHeight: 70, resize: "vertical" }}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div style={s.editRow2}>
              <div style={s.editField}>
                <label style={s.editLabel}>Price (₦)</label>
                <input
                  style={s.editInput}
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div style={s.editField}>
                <label style={s.editLabel}>Discount Price</label>
                <input
                  style={s.editInput}
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.discount_price}
                  onChange={(e) => setEditForm((f) => ({ ...f, discount_price: e.target.value }))}
                />
              </div>
            </div>
            <div style={s.editRow2}>
              <div style={s.editField}>
                <label style={s.editLabel}>Quantity</label>
                <input
                  style={s.editInput}
                  type="number"
                  min="0"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div style={s.editField}>
                <label style={s.editLabel}>Unit</label>
                <input
                  style={s.editInput}
                  value={editForm.unit}
                  onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                />
              </div>
            </div>
            <div style={s.editField}>
              <label style={s.editLabel}>Category</label>
              <input
                style={s.editInput}
                value={editForm.category}
                onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>

            <div style={s.modalActions}>
              <button style={s.modalCancelBtn} onClick={() => setEditTarget(null)}>
                Cancel
              </button>
              <button
                style={editSaving ? s.modalConfirmBtnDisabled : s.approveBtn}
                onClick={handleSaveEdit}
                disabled={editSaving}
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const s = {
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    background: "#1f4d1f",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: 8,
    fontSize: 14,
    zIndex: 999,
  },
  loading: { textAlign: "center", color: "#888", padding: 40 },
  empty: {
    textAlign: "center",
    padding: "60px 20px",
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: "#333", marginBottom: 6 },
  emptyText: { fontSize: 13, color: "#888" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8e4dc",
    padding: 18,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  productName: { fontSize: 16, fontWeight: 700, color: "#111" },
  sellerMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  priceTag: { fontSize: 16, fontWeight: 700, color: "#1f4d1f", whiteSpace: "nowrap" },
  description: {
    fontSize: 13,
    color: "#555",
    lineHeight: 1.5,
    marginBottom: 12,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    fontSize: 12,
    color: "#666",
    marginBottom: 14,
    paddingBottom: 14,
    borderBottom: "1px solid #f0ece4",
  },
  actions: { display: "flex", gap: 10 },
  approveBtn: {
    flex: 1,
    padding: "10px 14px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  approveBtnDisabled: {
    flex: 1,
    padding: "10px 14px",
    background: "#aaa",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  rejectBtn: {
    flex: 1,
    padding: "10px 14px",
    background: "#fff",
    color: "#cc0000",
    border: "1px solid #ffcccc",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  editBtn: {
    flex: 1,
    padding: "10px 14px",
    background: "#fff",
    color: "#1f4d1f",
    border: "1px solid #cfe8cf",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalBox: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 440,
  },
  modalTitle: { fontSize: 17, fontWeight: 700, color: "#111", marginBottom: 6 },
  modalSub: { fontSize: 13, color: "#888", marginBottom: 14 },
  modalTextarea: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box",
  },
  modalError: { color: "#cc0000", fontSize: 12, marginTop: 6 },
  editField: { marginBottom: 12 },
  editLabel: { display: "block", fontSize: 11.5, fontWeight: 600, color: "#555", marginBottom: 5 },
  editInput: {
    width: "100%",
    padding: "9px 12px",
    border: "1.5px solid #ddd",
    borderRadius: 7,
    fontSize: 13,
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  editRow2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  modalActions: {
    display: "flex",
    gap: 10,
    marginTop: 16,
    justifyContent: "flex-end",
  },
  modalCancelBtn: {
    padding: "10px 18px",
    background: "#f0f0f0",
    color: "#333",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  modalConfirmBtn: {
    padding: "10px 18px",
    background: "#cc0000",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  modalConfirmBtnDisabled: {
    padding: "10px 18px",
    background: "#aaa",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
};
