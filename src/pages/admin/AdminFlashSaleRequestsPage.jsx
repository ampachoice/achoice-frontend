import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { getAdminFlashSaleRequests, approveFlashSaleRequest, rejectFlashSaleRequest } from "../../services/adminService";

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All" },
];

const STATUS_COLORS = {
  pending: { bg: "#fff4de", color: "#a86a00" },
  approved: { bg: "#e6f4ea", color: "#1f4d1f" },
  rejected: { bg: "#fbe9e9", color: "#a81f1f" },
};

export default function AdminFlashSaleRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [toast, setToast] = useState("");
  const [actingId, setActingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadRequests = useCallback(() => {
    setLoading(true);
    getAdminFlashSaleRequests(statusFilter ? { status: statusFilter } : {})
      .then((res) => setRequests(res.data?.data || []))
      .catch(() => showToast("Failed to load requests."))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = async (req) => {
    setActingId(req.id);
    try {
      const res = await approveFlashSaleRequest(req.id);
      showToast(res.data?.message || "Approved.");
      loadRequests();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve request.");
    } finally {
      setActingId(null);
    }
  };

  const openReject = (req) => {
    setRejectingId(req.id);
    setRejectReason("");
  };

  const handleReject = async (req) => {
    if (!rejectReason.trim()) return;
    setActingId(req.id);
    try {
      await rejectFlashSaleRequest(req.id, rejectReason.trim());
      showToast("Request rejected.");
      setRejectingId(null);
      loadRequests();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject request.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <AdminLayout title="Flash Sale Requests" subtitle="Seller-submitted flash sale requests awaiting review.">
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.tabRow}>
        {STATUS_TABS.map((tab) => (
          <button key={tab.value || "all"} style={statusFilter === tab.value ? s.tabActive : s.tab} onClick={() => setStatusFilter(tab.value)}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={s.emptyState}>Loading requests...</div>
      ) : requests.length === 0 ? (
        <div style={s.emptyState}>No {statusFilter || ""} requests.</div>
      ) : (
        <div style={s.grid}>
          {requests.map((req) => {
            const colors = STATUS_COLORS[req.status] || { bg: "#eee", color: "#555" };
            return (
              <div key={req.id} style={s.card}>
                <div style={s.cardHeader}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#111" }}>{req.product?.name}</div>
                    <div style={{ fontSize: 11.5, color: "#888" }}>{req.seller?.business_name}</div>
                  </div>
                  <span style={{ ...s.statusBadge, background: colors.bg, color: colors.color }}>{req.status}</span>
                </div>
                <div style={s.statRow}>
                  <div>
                    <div style={s.statLabel}>Suggested Price</div>
                    <div style={s.statValue}>₦{Number(req.suggested_sale_price).toLocaleString()}</div>
                    <div style={s.statSub}>vs regular ₦{Number(req.product?.price || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={s.statLabel}>Quantity Limit</div>
                    <div style={s.statValue}>{req.suggested_quantity_limit}</div>
                    <div style={s.statSub}>of {req.product?.quantity ?? "?"} in stock</div>
                  </div>
                </div>
                <div style={s.dateRow}>
                  {new Date(req.suggested_starts_at).toLocaleString()} → {new Date(req.suggested_ends_at).toLocaleString()}
                </div>

                {req.status === "pending" && (
                  rejectingId === req.id ? (
                    <div style={s.rejectForm}>
                      <textarea
                        style={s.rejectInput}
                        placeholder="Reason for rejecting..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <div style={s.cardActions}>
                        <button style={s.cancelBtn} onClick={() => setRejectingId(null)}>Cancel</button>
                        <button style={s.rejectBtn} disabled={actingId === req.id || !rejectReason.trim()} onClick={() => handleReject(req)}>
                          {actingId === req.id ? "..." : "Confirm Reject"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={s.cardActions}>
                      <button style={s.rejectBtn} disabled={actingId === req.id} onClick={() => openReject(req)}>Reject</button>
                      <button style={s.approveBtn} disabled={actingId === req.id} onClick={() => handleApprove(req)}>
                        {actingId === req.id ? "..." : "Approve"}
                      </button>
                    </div>
                  )
                )}
                {req.status === "rejected" && req.rejection_reason && (
                  <div style={s.rejectionNote}>⚠️ {req.rejection_reason}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

const s = {
  toast: { position: "fixed", top: 20, right: 20, background: "#1f4d1f", color: "#fff", padding: "12px 20px", borderRadius: 8, fontSize: 13, zIndex: 999, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" },
  tabRow: { display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" },
  tab: { padding: "8px 16px", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 20, fontSize: 12.5, fontWeight: 600, color: "#555", cursor: "pointer", fontFamily: "inherit" },
  tabActive: { padding: "8px 16px", background: "#1f4d1f", border: "1px solid #1f4d1f", borderRadius: 20, fontSize: 12.5, fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: "inherit" },
  emptyState: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: 48, textAlign: "center", color: "#888", fontSize: 14 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 },
  card: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: 20 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 8 },
  statusBadge: { fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "capitalize", whiteSpace: "nowrap" },
  statRow: { display: "flex", gap: 24, marginBottom: 10 },
  statLabel: { fontSize: 11, color: "#888", marginBottom: 3 },
  statValue: { fontSize: 15, fontWeight: 700, color: "#111" },
  statSub: { fontSize: 10.5, color: "#aaa", marginTop: 2 },
  dateRow: { fontSize: 11.5, color: "#666", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid #f2f0ec" },
  cardActions: { display: "flex", justifyContent: "flex-end", gap: 10 },
  rejectBtn: { padding: "9px 16px", background: "#fff", border: "1.5px solid #f3b3b3", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#a81f1f", cursor: "pointer", fontFamily: "inherit" },
  approveBtn: { padding: "9px 16px", background: "#1f4d1f", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" },
  cancelBtn: { padding: "9px 16px", background: "#fff", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#555", cursor: "pointer", fontFamily: "inherit" },
  rejectForm: { marginTop: 4 },
  rejectInput: { width: "100%", minHeight: 60, padding: "9px 11px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 12.5, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", marginBottom: 10 },
  rejectionNote: { fontSize: 11.5, color: "#a81f1f", background: "#fbe9e9", borderRadius: 6, padding: "8px 10px" },
};
