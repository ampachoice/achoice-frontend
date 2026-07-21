import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../../components/seller/SellerLayout";
import { getSellerDashboard, getPublicSellerProfile } from "../../services/sellerService";

const SCORE_COLORS = {
  Excellent: { bg: "#e6f4ea", color: "#1f4d1f" },
  Good: { bg: "#eaf2fb", color: "#1a5fa8" },
  Fair: { bg: "#fff4de", color: "#a86a00" },
  "At Risk": { bg: "#fbe9e9", color: "#a81f1f" },
};

export default function SellerDashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Not on GET /seller/dashboard — pulled separately from the public
  // GET /sellers/{id}/profile using the seller's own id (see the backend audit).
  const [storeScore, setStoreScore] = useState(null);

  useEffect(() => {
    setLoading(true);
    getSellerDashboard()
      .then((res) => {
        setDashboard(res.data);
        const sellerId = res.data?.seller?.id;
        if (sellerId) {
          getPublicSellerProfile(sellerId)
            .then((r) => setStoreScore(r.data))
            .catch(() => {});
        }
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load your dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SellerLayout title="Dashboard">
        <div style={s.emptyState}>Loading your dashboard...</div>
      </SellerLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <SellerLayout title="Dashboard">
        <div style={s.emptyState}>{error || "Something went wrong."}</div>
      </SellerLayout>
    );
  }

  const { seller, shortcuts, overview, earnings } = dashboard;
  const colors = SCORE_COLORS[storeScore?.score_label] || { bg: "#eee", color: "#555" };

  return (
    <SellerLayout title={`Welcome back, ${seller.business_name}`} subtitle={`${seller.state || ""}`} showDate>
      {/* Shortcuts — actionable counts, each links to where the seller would resolve it */}
      <div style={s.shortcutGrid}>
        <ShortcutCard
          icon="🛒"
          label="Orders to Process"
          value={shortcuts.pending_orders_to_process}
          onClick={() => navigate("/seller/orders")}
        />
        <ShortcutCard
          icon="📉"
          label="Low Stock"
          value={shortcuts.low_stock_products}
          onClick={() => navigate("/seller/products")}
        />
        <ShortcutCard
          icon="🚫"
          label="Out of Stock"
          value={shortcuts.out_of_stock_products}
          onClick={() => navigate("/seller/products")}
        />
        <ShortcutCard
          icon="⏳"
          label="Pending Review"
          value={shortcuts.pending_review_products}
          onClick={() => navigate("/seller/products")}
        />
        <ShortcutCard
          icon="❌"
          label="Rejected"
          value={shortcuts.rejected_products}
          onClick={() => navigate("/seller/products")}
          alert={shortcuts.rejected_products > 0}
        />
      </div>

      <div style={s.twoCol}>
        {/* Overview */}
        <div style={s.card}>
          <div style={s.cardTitle}>Store Overview</div>
          <div style={s.statGrid}>
            <Stat label="Total Products" value={overview.total_products} />
            <Stat label="Active Products" value={overview.active_products} />
            <Stat label="Items Sold" value={overview.total_items_sold} />
            <Stat label="Pending Delivery" value={overview.pending_delivery} />
            <Stat label="Delivered Items" value={overview.delivered_items} />
            <Stat label="Total Reviews" value={overview.total_reviews} />
          </div>
          <div style={s.ratingRow}>
            <span style={{ color: "#f0c050", fontSize: 16 }}>
              {"★".repeat(Math.round(overview.average_rating))}
              {"☆".repeat(5 - Math.round(overview.average_rating))}
            </span>
            <span style={{ fontSize: 13, color: "#666" }}>{overview.average_rating} average rating</span>
          </div>
        </div>

        {/* Store Score */}
        <div style={s.card}>
          <div style={s.cardTitle}>Store Score</div>
          {storeScore ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#111" }}>{storeScore.seller_score}</div>
                <span style={{ ...s.scoreBadge, background: colors.bg, color: colors.color }}>
                  {storeScore.score_label} Seller
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: "#888" }}>
                {storeScore.total_sales} total sales · This is the score buyers see on your public storefront and
                in the Top Seller Spotlight.
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: "#888" }}>Score not available yet.</div>
          )}
        </div>
      </div>

      {/* Earnings */}
      <div style={{ ...s.card, marginTop: 20 }}>
        <div style={s.cardTitleRow}>
          <div style={s.cardTitle}>Earnings</div>
          <button style={s.linkBtn} onClick={() => navigate("/seller/finance")}>
            View Finance →
          </button>
        </div>
        <div style={s.statGrid}>
          <Stat label="Total Revenue" value={`₦${Number(earnings.total_revenue).toLocaleString()}`} />
          <Stat label="Current Balance" value={`₦${Number(earnings.current_balance).toLocaleString()}`} highlight />
          <Stat label="Total Remitted" value={`₦${Number(earnings.total_remitted).toLocaleString()}`} />
          <Stat label="Commission Rate" value={earnings.commission_rate} />
        </div>
      </div>
    </SellerLayout>
  );
}

function ShortcutCard({ icon, label, value, onClick, alert }) {
  return (
    <div style={{ ...s.shortcutCard, ...(alert && value > 0 ? s.shortcutCardAlert : {}) }} onClick={onClick}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={s.shortcutValue}>{value ?? 0}</div>
      <div style={s.shortcutLabel}>{label}</div>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "#888", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: highlight ? "#1f4d1f" : "#111" }}>{value}</div>
    </div>
  );
}

const s = {
  emptyState: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: 48, textAlign: "center", color: "#888", fontSize: 14 },
  shortcutGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 },
  shortcutCard: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: 18, cursor: "pointer", transition: "box-shadow 0.15s" },
  shortcutCardAlert: { border: "1px solid #f3b3b3", background: "#fff8f8" },
  shortcutValue: { fontSize: 24, fontWeight: 700, color: "#111", margin: "8px 0 2px" },
  shortcutLabel: { fontSize: 12, color: "#888" },
  twoCol: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 },
  card: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: 22 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 16 },
  cardTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 },
  ratingRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 18, paddingTop: 16, borderTop: "1px solid #f2f0ec" },
  scoreBadge: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  linkBtn: { background: "none", border: "none", color: "#1f4d1f", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
};
