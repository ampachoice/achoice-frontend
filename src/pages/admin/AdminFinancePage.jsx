import { useState, useEffect } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

const fmt = (n) => "₦" + Number(n ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 });

function StatCard({ label, value, sub, color = "#1f4d1f" }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "18px 20px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)", flex: 1, minWidth: 180,
    }}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AdminFinancePage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError]   = useState("");

  useEffect(() => {
    api.get("/admin/finance")
      .then(r => setData(r.data))
      .catch(() => setError("Failed to load finance data. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const sellers = (data?.seller_earnings ?? []).filter(s =>
    !search || s.business_name?.toLowerCase().includes(search.toLowerCase())
      || s.owner?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div style={{ padding: "24px 20px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1f4d1f", marginBottom: 20 }}>
          💵 Platform Finance
        </h2>

        {loading && <div style={{ color: "#888", padding: 40, textAlign: "center" }}>Loading…</div>}
        {error && <div style={{ color: "#cc0000", padding: 16, background: "#fff0f0", borderRadius: 8, marginBottom: 20 }}>{error}</div>}

        {data && (
          <>
            {/* ── Platform Earnings Summary ───────────────────────────── */}
            <div style={{ marginBottom: 10, fontWeight: 600, color: "#444", fontSize: 13 }}>
              Platform Earnings
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
              <StatCard
                label="Order Markup Profit"
                value={fmt(data.platform_earnings.markup_profit_from_orders)}
                sub="Difference between live price and seller's original price"
                color="#1f4d1f"
              />
              <StatCard
                label="Commission Earned"
                value={fmt(data.platform_earnings.commission_earned)}
                sub="From seller remittances"
                color="#1f4d1f"
              />
              <StatCard
                label="Loan Interest Earned"
                value={fmt(data.platform_earnings.loan_interest_earned)}
                sub="From fully-repaid loans"
                color="#1f4d1f"
              />
              <StatCard
                label="Total Platform Earnings"
                value={fmt(data.platform_earnings.total_platform_earnings)}
                sub="Markup + Commission + Loan Interest"
                color="#b8860b"
              />
            </div>

            {/* ── Summary Row ────────────────────────────────────────── */}
            <div style={{ marginBottom: 10, fontWeight: 600, color: "#444", fontSize: 13 }}>
              Seller Overview
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
              <StatCard
                label="Total Sellers"
                value={data.summary.total_sellers}
                color="#333"
              />
              <StatCard
                label="Total Seller Revenue"
                value={fmt(data.summary.total_seller_revenue)}
                sub="Based on sellers' own prices"
                color="#1f4d1f"
              />
              <StatCard
                label="Total Platform Markup"
                value={fmt(data.summary.total_platform_markup)}
                sub="Added above seller prices"
                color="#1f4d1f"
              />
              <StatCard
                label="Pending Remittance"
                value={fmt(data.summary.total_pending_remittance)}
                sub="Across all active sellers"
                color="#cc7700"
              />
            </div>

            {/* ── Per-Seller Table ────────────────────────────────────── */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 12,
            }}>
              <div style={{ fontWeight: 600, color: "#444", fontSize: 13 }}>
                Seller Breakdown ({sellers.length})
              </div>
              <input
                placeholder="Search seller or owner…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: "7px 12px", borderRadius: 6,
                  border: "1px solid #ddd", fontSize: 13, width: 220,
                }}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#1f4d1f", color: "#fff" }}>
                    <th style={th}>Seller / Owner</th>
                    <th style={th}>Seller Revenue</th>
                    <th style={th}>Buyer Revenue</th>
                    <th style={th}>Platform Markup</th>
                    <th style={th}>Balance</th>
                    <th style={th}>Total Remitted</th>
                    <th style={th}>Commission Rate</th>
                    <th style={th}>Pending Commission</th>
                    <th style={th}>Net to Remit</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: "center", padding: 24, color: "#aaa" }}>No sellers found</td></tr>
                  )}
                  {sellers.map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                      <td style={td}>
                        <div style={{ fontWeight: 600 }}>{s.business_name}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>{s.owner}</div>
                      </td>
                      <td style={td}>{fmt(s.seller_revenue)}</td>
                      <td style={td}>{fmt(s.buyer_revenue)}</td>
                      <td style={{ ...td, color: s.platform_markup > 0 ? "#1f4d1f" : "#888", fontWeight: s.platform_markup > 0 ? 600 : 400 }}>
                        {fmt(s.platform_markup)}
                      </td>
                      <td style={td}>{fmt(s.earnings_balance)}</td>
                      <td style={td}>{fmt(s.total_remitted)}</td>
                      <td style={{ ...td, textAlign: "center" }}>{s.commission_rate}</td>
                      <td style={{ ...td, color: "#cc7700" }}>{fmt(s.pending_commission)}</td>
                      <td style={{ ...td, color: "#1f4d1f", fontWeight: 600 }}>{fmt(s.net_to_remit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

const th = {
  padding: "10px 12px", textAlign: "left", fontSize: 12,
  fontWeight: 600, whiteSpace: "nowrap",
};
const td = {
  padding: "10px 12px", borderBottom: "1px solid #eee", verticalAlign: "top",
};