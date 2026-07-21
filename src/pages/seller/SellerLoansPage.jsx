import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../../components/seller/SellerLayout";
import { getLoanSummary } from "../../services/loanService";

const STATUS_COLORS = {
  pending: { bg: "#fff4de", color: "#a86a00" },
  approved: { bg: "#eaf2fb", color: "#1a5fa8" },
  disbursed: { bg: "#e6f4ea", color: "#1f4d1f" },
  active: { bg: "#e6f4ea", color: "#1f4d1f" },
};

export default function SellerLoansPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLoanSummary()
      .then((res) => setSummary(res.data))
      .catch(() => setSummary({ total_due_this_month: 0, loans: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SellerLayout title="Business Loans">
        <div style={s.emptyState}>Loading your loans...</div>
      </SellerLayout>
    );
  }

  const loans = summary?.loans || [];

  return (
    <SellerLayout
      title="Business Loans"
      subtitle="Loans are shared with the buyer side of ACHOICE — apply, repay, and track everything in one place."
      headerActions={<button style={s.applyBtn} onClick={() => navigate("/loans/apply")}>+ Apply for a Loan</button>}
    >
      {summary?.total_due_this_month > 0 && (
        <div style={s.dueBanner}>
          <div>
            <div style={{ fontWeight: 700 }}>₦{Number(summary.total_due_this_month).toLocaleString()} due this month</div>
            <div style={{ fontSize: 12.5, opacity: 0.9 }}>Across all your active loans.</div>
          </div>
          <button style={s.manageBtn} onClick={() => navigate("/loans")}>Manage & Repay →</button>
        </div>
      )}

      {loans.length === 0 ? (
        <div style={s.emptyState}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>💳</div>
          You don't have any loans yet.
          <div style={{ marginTop: 14 }}>
            <button style={s.applyBtnLarge} onClick={() => navigate("/loans/apply")}>Apply for a Business Loan</button>
          </div>
        </div>
      ) : (
        <div style={s.grid}>
          {loans.map((loan) => {
            const colors = STATUS_COLORS[loan.status] || { bg: "#eee", color: "#555" };
            return (
              <div key={loan.id} style={s.card}>
                <div style={s.cardHeader}>
                  <div style={{ fontWeight: 700, color: "#111" }}>{loan.label}</div>
                  <span style={{ ...s.statusBadge, background: colors.bg, color: colors.color }}>{loan.status_label}</span>
                </div>
                <div style={s.statRow}>
                  <div>
                    <div style={s.statLabel}>Amount</div>
                    <div style={s.statValue}>₦{Number(loan.amount).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={s.statLabel}>Balance</div>
                    <div style={s.statValue}>₦{Number(loan.balance).toLocaleString()}</div>
                  </div>
                </div>
                {loan.next_payment_date && (
                  <div style={s.nextPayment}>
                    Next payment: {new Date(loan.next_payment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                )}
                <div style={s.cardActions}>
                  <button style={s.linkBtn} onClick={() => navigate(`/loans/${loan.id}`)}>View Details</button>
                  {loan.is_disbursed && (
                    <>
                      <button style={s.linkBtn} onClick={() => navigate(`/loans/${loan.id}/schedule`)}>Schedule</button>
                      <button style={s.linkBtn} onClick={() => navigate(`/loans/${loan.id}/liquidate`)}>Liquidate</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SellerLayout>
  );
}

const s = {
  emptyState: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: 48, textAlign: "center", color: "#888", fontSize: 14 },
  applyBtn: { padding: "12px 22px", background: "#1f4d1f", color: "#fff", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  applyBtnLarge: { padding: "13px 26px", background: "#1f4d1f", color: "#fff", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  dueBanner: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, background: "#fff8e7", border: "1px solid #f0c050", color: "#7a5000", borderRadius: 10, padding: "16px 20px", marginBottom: 22 },
  manageBtn: { padding: "10px 18px", background: "#1f4d1f", color: "#fff", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 },
  card: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: 20 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  statusBadge: { fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  statRow: { display: "flex", gap: 24, marginBottom: 10 },
  statLabel: { fontSize: 11, color: "#888", marginBottom: 3 },
  statValue: { fontSize: 16, fontWeight: 700, color: "#111" },
  nextPayment: { fontSize: 12, color: "#666", marginBottom: 14 },
  cardActions: { display: "flex", gap: 14, paddingTop: 12, borderTop: "1px solid #f2f0ec" },
  linkBtn: { background: "none", border: "none", color: "#1f4d1f", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", padding: 0 },
};
