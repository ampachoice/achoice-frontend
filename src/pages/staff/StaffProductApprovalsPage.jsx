import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const LOGO_PATH = "/achoice logo.png";

export default function StaffProductApprovalsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {}

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const fetchPending = () => {
    setLoading(true);
    api
      .get("/staff/agro/products/pending-review")
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
      await api.patch(`/staff/agro/products/${product.id}/approve`);
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

  const submitReject = async () => {
    if (rejectReason.trim().length < 10) {
      setRejectError("Reason must be at least 10 characters.");
      return;
    }
    setBusyId(rejectTarget.id);
    try {
      await api.patch(`/staff/agro/products/${rejectTarget.id}/reject`, {
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
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.header}>
        <div style={s.headerLeft} onClick={() => navigate("/staff/agro")}>
          <img src={LOGO_PATH} alt="Achoice" style={s.logoImg} />
          <div>
            <div style={s.headerName}>ACHOICE</div>
            <div style={s.headerSub}>Agro/Sales Staff</div>
          </div>
        </div>
        <button style={s.backBtn} onClick={() => navigate("/staff/agro")}>
          ← Back to Dashboard
        </button>
      </div>

      <div style={s.main}>
        <h1 style={s.pageTitle}>Product Approvals</h1>
        <p style={s.pageSub}>
          {products.length} product{products.length === 1 ? "" : "s"} awaiting
          review
        </p>

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
                      {product.seller?.state
                        ? ` · ${product.seller.state}`
                        : ""}
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
                    style={
                      busyId === product.id ? s.approveBtnDisabled : s.approveBtn
                    }
                    onClick={() => handleApprove(product)}
                    disabled={busyId === product.id}
                  >
                    {busyId === product.id ? "Working..." : "✓ Approve"}
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
      </div>

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
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f0f2f5", fontFamily: "Arial, sans-serif" },
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
  header: {
    background: "#1f4d1f",
    padding: "14px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  logoImg: { width: 36, height: 36, objectFit: "contain" },
  headerName: { fontSize: 14, fontWeight: 700, color: "#fff" },
  headerSub: { fontSize: 10, color: "#a8d5a8" },
  backBtn: {
    padding: "8px 16px",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 7,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  main: { maxWidth: 1100, margin: "0 auto", padding: 32 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: "#111", marginBottom: 4 },
  pageSub: { fontSize: 14, color: "#888", marginBottom: 24 },
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
  card: { background: "#fff", borderRadius: 12, border: "1px solid #e8e4dc", padding: 18 },
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
  description: { fontSize: 13, color: "#555", lineHeight: 1.5, marginBottom: 12 },
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
  modalBox: { background: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 440 },
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
  modalActions: { display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" },
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
