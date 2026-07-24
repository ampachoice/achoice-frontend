import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../services/api";

export default function AdminRemittanceRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const toMoney = (val) => `₦${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const fetchRequests = () => {
    setLoading(true);
    api
      .get("/admin/remittance-requests", { params: { status: statusFilter || undefined } })
      .then((res) => setRequests(res.data?.data || res.data || []))
      .catch(() => showToast("Failed to load remittance requests."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleApprove = async (reqRow) => {
    setBusyId(reqRow.id);
    try {
      const res = await api.patch(`/admin/remittance-requests/${reqRow.id}/approve`);
      setRequests((prev) => prev.filter((r) => r.id !== reqRow.id));
      showToast(
        `Approved — ₦${Number(res.data?.net_to_remit || 0).toLocaleString()} processed for ${reqRow.seller?.business_name || "seller"}.`
      );
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to approve request.");
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (reqRow) => {
    setRejectTarget(reqRow);
    setRejectReason("");
    setRejectError("");
  };

  const submitReject = async () => {
    if (rejectReason.trim().length < 5) {
      setRejectError("Reason must be at least 5 characters.");
      return;
    }
    setBusyId(rejectTarget.id);
    try {
      await api.patch(`/admin/remittance-requests/${rejectTarget.id}/reject`, {
        reason: rejectReason.trim(),
      });
      setRequests((prev) => prev.filter((r) => r.id !== rejectTarget.id));
      showToast(`Request declined for ${rejectTarget.seller?.business_name || "seller"}.`);
      setRejectTarget(null);
    } catch (err) {
      setRejectError(err?.response?.data?.message || "Failed to reject request.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout
      title="Remittance Requests"
      subtitle={`${requests.length} request${requests.length === 1 ? "" : "s"} ${statusFilter || "shown"}`}
    >
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.tabs}>
        {["pending", "approved", "rejected", ""].map((st) => (
          <button
            key={st || "all"}
            style={statusFilter === st ? s.tabActive : s.tab}
            onClick={() => setStatusFilter(st)}
          >
            {st ? st.charAt(0).toUpperCase() + st.slice(1) : "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={s.loading}>Loading requests...</p>
      ) : requests.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>💸</div>
          <div style={s.emptyTitle}>Nothing here</div>
          <p style={s.emptyText}>No {statusFilter || ""} remittance requests right now.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {requests.map((r) => (
            <div key={r.id} style={s.card}>
              <div style={s.cardTop}>
                <div>
                  <div style={s.sellerName}>{r.seller?.business_name || "Unknown seller"}</div>
                  <div style={s.subMeta}>
                    {r.seller?.bank_name} · {r.seller?.account_number}
                  </div>
                </div>
                <div style={s.amount}>{toMoney(r.requested_amount)}</div>
              </div>

              <div style={s.metaRow}>
                <span>Requested {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</span>
                {r.status !== "pending" && (
                  <span style={{ ...s.statusBadge, ...(r.status === "approved" ? s.statusApproved : s.statusRejected) }}>
                    {r.status}
                  </span>
                )}
              </div>

              {r.status === "rejected" && r.rejection_reason && (
                <div style={s.rejectionNote}>Reason: {r.rejection_reason}</div>
              )}

              {r.status === "pending" && (
                <div style={s.actions}>
                  <button
                    style={busyId === r.id ? s.approveBtnDisabled : s.approveBtn}
                    onClick={() => handleApprove(r)}
                    disabled={busyId === r.id}
                  >
                    {busyId === r.id ? "Processing..." : "✓ Approve & Pay"}
                  </button>
                  <button
                    style={s.rejectBtn}
                    onClick={() => openReject(r)}
                    disabled={busyId === r.id}
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <div style={s.modalOverlay} onClick={() => setRejectTarget(null)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>
              Reject payout request for "{rejectTarget.seller?.business_name}"
            </div>
            <p style={s.modalSub}>
              This reason is shown to the seller — no money moves.
            </p>
            <textarea
              style={s.modalTextarea}
              rows={4}
              placeholder="e.g. Bank details on file don't match your registered account."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            {rejectError && <div style={s.modalError}>{rejectError}</div>}
            <div style={s.modalActions}>
              <button style={s.modalCancelBtn} onClick={() => setRejectTarget(null)}>
                Cancel
              </button>
              <button
                style={busyId === rejectTarget.id ? s.modalConfirmBtnDisabled : s.modalConfirmBtn}
                onClick={submitReject}
                disabled={busyId === rejectTarget.id}
              >
                {busyId === rejectTarget.id ? "Rejecting..." : "Confirm Reject"}
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
    position: "fixed", top: 20, right: 20, background: "#1f4d1f", color: "#fff",
    padding: "12px 24px", borderRadius: 8, fontSize: 14, zIndex: 999,
  },
  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: {
    padding: "8px 16px", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 20,
    fontSize: 13, color: "#555", cursor: "pointer", fontFamily: "inherit",
  },
  tabActive: {
    padding: "8px 16px", background: "#1f4d1f", border: "1px solid #1f4d1f", borderRadius: 20,
    fontSize: 13, color: "#fff", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  loading: { textAlign: "center", color: "#888", padding: 40 },
  empty: {
    textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 10,
    border: "1px solid #e8e4dc",
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: "#333", marginBottom: 6 },
  emptyText: { fontSize: 13, color: "#888" },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16,
  },
  card: {
    background: "#fff", borderRadius: 12, border: "1px solid #e8e4dc", padding: 18,
  },
  cardTop: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8,
  },
  sellerName: { fontSize: 16, fontWeight: 700, color: "#111" },
  subMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  amount: { fontSize: 18, fontWeight: 700, color: "#1f4d1f", whiteSpace: "nowrap" },
  metaRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    fontSize: 12, color: "#888", marginBottom: 10, paddingBottom: 10,
    borderBottom: "1px solid #f0ece4",
  },
  statusBadge: {
    fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, textTransform: "capitalize",
  },
  statusApproved: { background: "#eafaf0", color: "#1a7a3a" },
  statusRejected: { background: "#fdecec", color: "#cc0000" },
  rejectionNote: { fontSize: 12, color: "#cc0000", marginBottom: 10 },
  actions: { display: "flex", gap: 10 },
  approveBtn: {
    flex: 1, padding: "10px 14px", background: "#1f4d1f", color: "#fff", border: "none",
    borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  approveBtnDisabled: {
    flex: 1, padding: "10px 14px", background: "#aaa", color: "#fff", border: "none",
    borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "not-allowed", fontFamily: "inherit",
  },
  rejectBtn: {
    flex: 1, padding: "10px 14px", background: "#fff", color: "#cc0000", border: "1px solid #ffcccc",
    borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  modalBox: { background: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 440 },
  modalTitle: { fontSize: 17, fontWeight: 700, color: "#111", marginBottom: 6 },
  modalSub: { fontSize: 13, color: "#888", marginBottom: 14 },
  modalTextarea: {
    width: "100%", padding: "11px 14px", border: "1.5px solid #ddd", borderRadius: 8,
    fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
  },
  modalError: { color: "#cc0000", fontSize: 12, marginTop: 6 },
  modalActions: { display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" },
  modalCancelBtn: {
    padding: "10px 18px", background: "#f0f0f0", color: "#333", border: "none",
    borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  modalConfirmBtn: {
    padding: "10px 18px", background: "#cc0000", color: "#fff", border: "none",
    borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  modalConfirmBtnDisabled: {
    padding: "10px 18px", background: "#aaa", color: "#fff", border: "none",
    borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "not-allowed", fontFamily: "inherit",
  },
};
