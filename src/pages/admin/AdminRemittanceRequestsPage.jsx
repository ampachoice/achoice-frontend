import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../services/api";

const DEFAULT_COMMISSION_RATE = 1.0; // fallback only — matches Setting::get('platform_commission_rate', 1.0)'s own default, used only if the live fetch fails

export default function AdminRemittanceRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [commissionRate, setCommissionRate] = useState(DEFAULT_COMMISSION_RATE);

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  // Confirm remittance modal state
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [approvePassword, setApprovePassword] = useState("");
  const [approveError, setApproveError] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const toMoney = (val) =>
    `₦${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const fetchRequests = () => {
    setLoading(true);
    api
      .get("/admin/remittance-requests", {
        params: { status: statusFilter || undefined },
      })
      .then((res) => setRequests(res.data?.data || res.data || []))
      .catch(() => showToast("Failed to load remittance requests."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Live commission rate for the confirm-modal preview — was previously
  // hardcoded and could silently drift from the real Site Settings value.
  useEffect(() => {
    api
      .get("/admin/settings/commission")
      .then((res) => {
        if (res.data?.commission_rate != null)
          setCommissionRate(res.data.commission_rate);
      })
      .catch(() => {}); // keep the fallback default if this fails
  }, []);

  // Step 1 — open confirmation modal instead of calling API directly
  const openConfirm = (reqRow) => {
    setConfirmTarget(reqRow);
    setApprovePassword("");
    setApproveError("");
  };

  // Step 2 — admin confirmed, now call the API. No longer clears
  // confirmTarget/closes the modal before the request -- if the password
  // is wrong we need the modal to stay open so the error is visible next
  // to the field the admin needs to fix.
  const handleApprove = async () => {
    if (!confirmTarget) return;
    if (!approvePassword) {
      setApproveError("Please enter your password to confirm.");
      return;
    }
    const reqRow = confirmTarget;
    setBusyId(reqRow.id);
    setApproveError("");
    try {
      const res = await api.patch(
        `/admin/remittance-requests/${reqRow.id}/approve`,
        { password: approvePassword },
      );
      setRequests((prev) => prev.filter((r) => r.id !== reqRow.id));
      showToast(
        `Approved — ${toMoney(res.data?.net_to_remit || 0)} processed for ${
          reqRow.seller?.business_name || "seller"
        }.`,
      );
      setConfirmTarget(null);
      setApprovePassword("");
    } catch (err) {
      setApproveError(err?.response?.data?.message || "Failed to approve request.");
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
      showToast(
        `Request declined for ${rejectTarget.seller?.business_name || "seller"}.`,
      );
      setRejectTarget(null);
    } catch (err) {
      setRejectError(
        err?.response?.data?.message || "Failed to reject request.",
      );
    } finally {
      setBusyId(null);
    }
  };

  // Derive commission breakdown for the confirm modal
  const confirmBreakdown = confirmTarget
    ? (() => {
        const gross = Number(confirmTarget.requested_amount || 0);
        const commission =
          Math.round(gross * (commissionRate / 100) * 100) / 100;
        const net = Math.round((gross - commission) * 100) / 100;
        return { gross, commission, net };
      })()
    : null;

  return (
    <AdminLayout
      title="Remittance Requests"
      subtitle={`${requests.length} request${requests.length === 1 ? "" : "s"} ${
        statusFilter || "shown"
      }`}
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
          <p style={s.emptyText}>
            No {statusFilter || ""} remittance requests right now.
          </p>
        </div>
      ) : (
        <div style={s.grid}>
          {requests.map((r) => (
            <div key={r.id} style={s.card}>
              <div style={s.cardTop}>
                <div>
                  <div style={s.sellerName}>
                    {r.seller?.business_name || "Unknown seller"}
                  </div>
                  <div style={s.subMeta}>
                    {r.seller?.bank_name} · {r.seller?.account_number}
                  </div>
                </div>
                <div style={s.amount}>{toMoney(r.requested_amount)}</div>
              </div>

              <div style={s.metaRow}>
                <span>
                  Requested{" "}
                  {r.created_at
                    ? new Date(r.created_at).toLocaleDateString()
                    : "—"}
                </span>
                {r.status !== "pending" && (
                  <span
                    style={{
                      ...s.statusBadge,
                      ...(r.status === "approved"
                        ? s.statusApproved
                        : s.statusRejected),
                    }}
                  >
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
                    style={
                      busyId === r.id ? s.approveBtnDisabled : s.approveBtn
                    }
                    onClick={() => openConfirm(r)}
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

      {/* ════ CONFIRM REMITTANCE MODAL ════ */}
      {confirmTarget && confirmBreakdown && (
        <div style={s.modalOverlay} onClick={() => setConfirmTarget(null)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>Confirm Remittance</div>
              <button
                style={s.modalCloseBtn}
                onClick={() => setConfirmTarget(null)}
              >
                ✕
              </button>
            </div>

            <div style={s.modalSellerName}>
              {confirmTarget.seller?.business_name}
            </div>

            {/* Breakdown */}
            <div style={s.breakdownBox}>
              <div style={s.breakdownRow}>
                <span style={s.breakdownLabel}>Gross amount</span>
                <span style={s.breakdownValue}>
                  {toMoney(confirmBreakdown.gross)}
                </span>
              </div>
              <div style={s.breakdownRow}>
                <span style={s.breakdownLabel}>
                  Platform commission ({commissionRate}%)
                </span>
                <span style={{ ...s.breakdownValue, color: "#cc0000" }}>
                  − {toMoney(confirmBreakdown.commission)}
                </span>
              </div>
              <div style={{ ...s.breakdownRow, ...s.breakdownNetRow }}>
                <span style={s.breakdownNetLabel}>
                  Net amount to pay seller
                </span>
                <span style={s.breakdownNet}>
                  {toMoney(confirmBreakdown.net)}
                </span>
              </div>
            </div>

            {/* Bank details */}
            <div style={s.bankBox}>
              <div style={s.bankBoxTitle}>Bank Details</div>
              <div style={s.bankGrid}>
                <div>
                  <div style={s.bankLabel}>BANK</div>
                  <div style={s.bankValue}>
                    {confirmTarget.seller?.bank_name || "—"}
                  </div>
                </div>
                <div>
                  <div style={s.bankLabel}>ACCOUNT</div>
                  <div style={s.bankValue}>
                    {confirmTarget.seller?.account_number || "—"}
                  </div>
                </div>
                <div>
                  <div style={s.bankLabel}>NAME</div>
                  <div style={s.bankValue}>
                    {confirmTarget.seller?.account_name || "—"}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid #eee" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#444",
                  marginBottom: 6,
                }}
              >
                Your Password
              </label>
              <input
                type="password"
                placeholder="Enter your password to confirm"
                value={approvePassword}
                onChange={(e) => {
                  setApprovePassword(e.target.value);
                  setApproveError("");
                }}
                disabled={busyId === confirmTarget.id}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: "1.5px solid #ddd",
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
              {approveError && (
                <div
                  style={{
                    background: "#fff0f0",
                    color: "#cc0000",
                    padding: "9px 12px",
                    borderRadius: 6,
                    fontSize: 12.5,
                    marginTop: 10,
                    border: "1px solid #ffb3b3",
                  }}
                >
                  ⚠️ {approveError}
                </div>
              )}
            </div>

            <div style={s.modalActions}>
              <button
                style={s.modalCancelBtn}
                onClick={() => setConfirmTarget(null)}
                disabled={busyId === confirmTarget.id}
              >
                Cancel
              </button>
              <button
                style={s.modalConfirmBtn}
                onClick={handleApprove}
                disabled={busyId === confirmTarget.id}
              >
                {busyId === confirmTarget.id
                  ? "Processing..."
                  : `Remit ${toMoney(confirmBreakdown.net)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ REJECT MODAL ════ */}
      {rejectTarget && (
        <div style={s.modalOverlay} onClick={() => setRejectTarget(null)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>
                Reject payout for "{rejectTarget.seller?.business_name}"
              </div>
              <button
                style={s.modalCloseBtn}
                onClick={() => setRejectTarget(null)}
              >
                ✕
              </button>
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
              <button
                style={s.modalCancelBtn}
                onClick={() => setRejectTarget(null)}
              >
                Cancel
              </button>
              <button
                style={
                  busyId === rejectTarget.id
                    ? s.modalRejectBtnDisabled
                    : s.modalRejectBtn
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
    zIndex: 9999,
  },
  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: {
    padding: "8px 16px",
    background: "#fff",
    border: "1px solid #e8e4dc",
    borderRadius: 20,
    fontSize: 13,
    color: "#555",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  tabActive: {
    padding: "8px 16px",
    background: "#1f4d1f",
    border: "1px solid #1f4d1f",
    borderRadius: 20,
    fontSize: 13,
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
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
    marginBottom: 8,
  },
  sellerName: { fontSize: 16, fontWeight: 700, color: "#111" },
  subMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  amount: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1f4d1f",
    whiteSpace: "nowrap",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    color: "#888",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottom: "1px solid #f0ece4",
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 9px",
    borderRadius: 99,
    textTransform: "capitalize",
  },
  statusApproved: { background: "#eafaf0", color: "#1a7a3a" },
  statusRejected: { background: "#fdecec", color: "#cc0000" },
  rejectionNote: { fontSize: 12, color: "#cc0000", marginBottom: 10 },
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
  // Modal shared
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
    maxWidth: 460,
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: 700, color: "#111" },
  modalCloseBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "#888",
    padding: 0,
    lineHeight: 1,
  },
  modalSellerName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1f4d1f",
    marginBottom: 16,
  },
  // Confirm modal breakdown
  breakdownBox: {
    background: "#f9f7f3",
    borderRadius: 8,
    padding: "14px 16px",
    marginBottom: 16,
  },
  breakdownRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 14,
    color: "#444",
    marginBottom: 10,
  },
  breakdownLabel: { color: "#666" },
  breakdownValue: { fontWeight: 500 },
  breakdownNetRow: {
    borderTop: "1px solid #e8e4dc",
    paddingTop: 10,
    marginBottom: 0,
  },
  breakdownNetLabel: { fontSize: 14, fontWeight: 600, color: "#111" },
  breakdownNet: { fontSize: 16, fontWeight: 700, color: "#1f4d1f" },
  // Bank box
  bankBox: {
    border: "1px solid #e8e4dc",
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 20,
  },
  bankBoxTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#888",
    marginBottom: 10,
  },
  bankGrid: { display: "flex", gap: 20 },
  bankLabel: {
    fontSize: 10,
    color: "#aaa",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  bankValue: { fontSize: 13, fontWeight: 600, color: "#111", marginTop: 2 },
  // Modal actions
  modalActions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },
  modalCancelBtn: {
    padding: "10px 20px",
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
    padding: "10px 20px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  // Reject modal
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
  modalRejectBtn: {
    padding: "10px 20px",
    background: "#cc0000",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  modalRejectBtnDisabled: {
    padding: "10px 20px",
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