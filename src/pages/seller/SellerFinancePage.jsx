import { useState, useEffect, useCallback } from "react";
import SellerLayout from "../../components/seller/SellerLayout";
import { getSellerEarnings, requestRemittance } from "../../services/sellerService";

export default function SellerFinancePage() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [requesting, setRequesting] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const loadEarnings = useCallback(() => {
    setLoading(true);
    getSellerEarnings({ page })
      .then((res) => setEarnings(res.data))
      .catch(() => showToast("Failed to load your earnings."))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  const handleRequestPayout = async () => {
    setRequesting(true);
    try {
      const res = await requestRemittance();
      showToast(res.data?.message || "Payout requested.");
      loadEarnings();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to request payout.");
    } finally {
      setRequesting(false);
    }
  };

  if (loading && !earnings) {
    return (
      <SellerLayout title="Finance">
        <div style={s.emptyState}>Loading your earnings...</div>
      </SellerLayout>
    );
  }

  if (!earnings) {
    return (
      <SellerLayout title="Finance">
        <div style={s.emptyState}>Something went wrong.</div>
      </SellerLayout>
    );
  }

  const history = earnings.remittance_history?.data || [];
  const meta = earnings.remittance_history;
  const pending = earnings.pending_request;
  const canRequest = !pending && earnings.current_balance > 0;

  return (
    <SellerLayout title="Finance" subtitle="Your wallet, payout history, and remittance requests.">
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.walletCard}>
        <div>
          <div style={s.walletLabel}>Available Balance</div>
          <div style={s.walletAmount}>₦{Number(earnings.current_balance).toLocaleString()}</div>
        </div>
        <button
          style={canRequest ? s.requestBtn : s.requestBtnDisabled}
          onClick={handleRequestPayout}
          disabled={!canRequest || requesting}
          title={
            pending
              ? "You already have a pending request"
              : earnings.current_balance <= 0
                ? "No balance to request"
                : undefined
          }
        >
          {requesting ? "Requesting..." : "Request Payout"}
        </button>
      </div>

      {pending && (
        <div style={s.pendingBanner}>
          <span style={{ fontSize: 16 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700 }}>
              Payout of ₦{Number(pending.requested_amount).toLocaleString()} requested
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.9 }}>
              Submitted {new Date(pending.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} — awaiting review.
            </div>
          </div>
        </div>
      )}

      <div style={s.statGrid}>
        <div style={s.statCard}>
          <div style={s.statLabel}>Total Remitted (all time)</div>
          <div style={s.statValue}>₦{Number(earnings.total_remitted).toLocaleString()}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Payouts on Record</div>
          <div style={s.statValue}>{meta?.total ?? history.length}</div>
        </div>
      </div>

      <div style={s.sectionTitle}>Remittance History</div>
      {history.length === 0 ? (
        <div style={s.emptyState}>No payouts have been made yet.</div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Date</th>
                <th style={s.th}>Gross</th>
                <th style={s.th}>Commission</th>
                <th style={s.th}>Net Paid</th>
                <th style={s.th}>Paid To</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.id} style={s.tr}>
                  <td style={s.td}>{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td style={s.td}>₦{Number(r.gross_amount).toLocaleString()}</td>
                  <td style={s.td}>₦{Number(r.commission_amount).toLocaleString()} ({r.commission_rate}%)</td>
                  <td style={{ ...s.td, fontWeight: 700, color: "#1f4d1f" }}>₦{Number(r.net_amount).toLocaleString()}</td>
                  <td style={s.td}>{r.bank_name} · {r.account_number}</td>
                </tr>
              ))}
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
    </SellerLayout>
  );
}

const s = {
  toast: { position: "fixed", top: 20, right: 20, background: "#1f4d1f", color: "#fff", padding: "12px 20px", borderRadius: 8, fontSize: 13, zIndex: 999, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" },
  emptyState: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: 48, textAlign: "center", color: "#888", fontSize: 14 },
  walletCard: {
    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
    background: "#1f4d1f", borderRadius: 14, padding: "26px 28px", marginBottom: 16,
  },
  walletLabel: { fontSize: 12.5, color: "#a8d5a8", marginBottom: 6 },
  walletAmount: { fontSize: 32, fontWeight: 700, color: "#fff" },
  requestBtn: { padding: "13px 24px", background: "#f0c050", color: "#1a3d1a", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  requestBtnDisabled: { padding: "13px 24px", background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: "not-allowed", fontFamily: "inherit" },
  pendingBanner: { display: "flex", alignItems: "flex-start", gap: 10, background: "#fff8e7", color: "#7a5000", border: "1px solid #f0c050", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13 },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 },
  statCard: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: "16px 20px" },
  statLabel: { fontSize: 11.5, color: "#888", marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: 700, color: "#111" },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 14 },
  tableWrap: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, overflow: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #eee", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f2f0ec" },
  td: { padding: "13px 16px", whiteSpace: "nowrap" },
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 18 },
  pageBtn: { padding: "8px 16px", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
};
