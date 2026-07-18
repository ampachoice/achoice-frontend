import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const LOGO_PATH = "/achoice logo.png";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {}

  useEffect(() => {
    api
      .get("/seller/dashboard")
      .then((res) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const toMoney = (val) => `₦${Number(val || 0).toLocaleString()}`;

  // Shortcut cards link to their management pages once those phases land —
  // for now (Phase 1 only) they're informational, not yet clickable through.
  const shortcuts = data?.shortcuts
    ? [
        {
          label: "Orders to Process",
          value: data.shortcuts.pending_orders_to_process,
          icon: "📦",
          color: "#1a4fa0",
          note: "Order management coming soon",
        },
        {
          label: "Low Stock Products",
          value: data.shortcuts.low_stock_products,
          icon: "⚠️",
          color: "#b36b00",
          note: "Inventory page coming soon",
        },
        {
          label: "Out of Stock",
          value: data.shortcuts.out_of_stock_products,
          icon: "❌",
          color: "#cc0000",
          note: "Inventory page coming soon",
        },
      ]
    : [];

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .seller-sidebar {
            width: min(280px, 82vw) !important;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: 2px 0 16px rgba(0,0,0,0.25);
            z-index: 600;
          }
          .seller-sidebar.seller-sidebar-open { transform: translateX(0); }
          .seller-main { margin-left: 0 !important; padding: 16px !important; }
          .seller-hamburger {
            display: flex !important; align-items: center; justify-content: center;
            width: 40px; height: 40px; border-radius: 10px; border: 1px solid #e8e4dc;
            background: #fff; font-size: 18px; cursor: pointer; flex-shrink: 0;
          }
          .seller-sidebar-close { display: block !important; }
          .seller-backdrop-open {
            display: block !important; position: fixed; inset: 0;
            background: rgba(0,0,0,0.45); z-index: 550;
          }
        }
      `}</style>

      <div style={s.page}>
        {mobileNavOpen && (
          <div
            className="seller-backdrop-open"
            style={{ display: "none" }}
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        <div
          className={"seller-sidebar" + (mobileNavOpen ? " seller-sidebar-open" : "")}
          style={s.sidebar}
        >
          <div style={s.sidebarLogo}>
            <img src={LOGO_PATH} alt="Achoice" style={s.logoImg} />
            <div>
              <div style={s.sidebarLogoName}>ACHOICE</div>
              <div style={s.sidebarLogoSub}>Seller Dashboard</div>
            </div>
            <button
              className="seller-sidebar-close"
              style={{
                display: "none",
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
              }}
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav style={s.sidebarNav}>
            <div style={{ ...s.sidebarItem, ...s.sidebarItemActive }}>
              <span>📊</span> Dashboard
            </div>
            {/* Products, Orders, Profile, Payouts, Apply for Loan get added
                here as each of those phases lands, matching the backend's
                phased rollout — keeping this list honest to what's actually
                built avoids linking to pages that don't exist yet. */}
          </nav>

          <div style={s.sidebarFooter}>
            <div style={s.staffName}>{user?.name}</div>
            <div style={s.staffRole}>
              {data?.seller?.business_name || "Seller"}
            </div>
            <button
              style={s.logoutBtn}
              onClick={() => {
                localStorage.clear();
                navigate("/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="seller-main" style={s.main}>
          <button
            className="seller-hamburger"
            style={{ display: "none", marginBottom: 16 }}
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          {loading ? (
            <p style={s.loading}>Loading dashboard...</p>
          ) : error ? (
            <div style={s.errorBox}>
              Failed to load your dashboard. Please refresh, or contact
              support if this keeps happening.
            </div>
          ) : (
            <>
              <h1 style={s.pageTitle}>
                Welcome back, {data.seller?.business_name}
              </h1>
              <p style={s.pageSub}>
                {data.seller?.state} ·{" "}
                <span style={s.statusBadge}>{data.seller?.status}</span>
                {Number(data.seller?.rating) > 0 &&
                  ` · ⭐ ${data.seller.rating}`}
              </p>

              {/* Shortcuts — Jumia-style clickable widgets */}
              <div style={s.shortcutsGrid}>
                {shortcuts.map((sc) => (
                  <div
                    key={sc.label}
                    style={s.shortcutCard}
                    title={sc.note}
                  >
                    <div style={s.shortcutTop}>
                      <div style={s.shortcutIcon}>{sc.icon}</div>
                      <div
                        style={{ ...s.shortcutValue, color: sc.color }}
                      >
                        {sc.value}
                      </div>
                    </div>
                    <div style={s.shortcutLabel}>{sc.label}</div>
                  </div>
                ))}
              </div>

              {/* Overview stats */}
              <h2 style={s.sectionTitle}>Overview</h2>
              <div style={s.statsGrid}>
                <div style={s.statCard}>
                  <div style={s.statLabel}>Total Products</div>
                  <div style={s.statValue}>
                    {data.overview?.total_products}
                  </div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statLabel}>Active Products</div>
                  <div style={{ ...s.statValue, color: "#1a7a3a" }}>
                    {data.overview?.active_products}
                  </div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statLabel}>Items Sold</div>
                  <div style={s.statValue}>
                    {data.overview?.total_items_sold}
                  </div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statLabel}>Pending Delivery</div>
                  <div style={{ ...s.statValue, color: "#b36b00" }}>
                    {data.overview?.pending_delivery}
                  </div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statLabel}>Delivered Items</div>
                  <div style={{ ...s.statValue, color: "#1a7a3a" }}>
                    {data.overview?.delivered_items}
                  </div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statLabel}>Rating</div>
                  <div style={s.statValue}>
                    {data.overview?.average_rating > 0
                      ? `⭐ ${data.overview.average_rating}`
                      : "No reviews yet"}
                    {data.overview?.total_reviews > 0 && (
                      <span style={s.statSubValue}>
                        {" "}
                        ({data.overview.total_reviews})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Earnings */}
              <h2 style={s.sectionTitle}>Earnings</h2>
              <div style={s.earningsCard}>
                <div style={s.earningsRow}>
                  <div style={s.earningsItem}>
                    <div style={s.earningsLabel}>Total Revenue</div>
                    <div style={s.earningsValue}>
                      {toMoney(data.earnings?.total_revenue)}
                    </div>
                  </div>
                  <div style={s.earningsItem}>
                    <div style={s.earningsLabel}>Current Balance</div>
                    <div style={{ ...s.earningsValue, color: "#f0c050" }}>
                      {toMoney(data.earnings?.current_balance)}
                    </div>
                  </div>
                  <div style={s.earningsItem}>
                    <div style={s.earningsLabel}>Total Remitted</div>
                    <div style={s.earningsValue}>
                      {toMoney(data.earnings?.total_remitted)}
                    </div>
                  </div>
                </div>
                <div style={s.earningsFooter}>
                  Commission rate: {data.earnings?.commission_rate} · Net
                  after commission: {toMoney(data.earnings?.net_after_commission)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const s = {
  page: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: 240,
    background: "#1f4d1f",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
  },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 20,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  logoImg: { width: 40, height: 40, objectFit: "contain" },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: "#fff" },
  sidebarLogoSub: { fontSize: 10, color: "#a8d5a8" },
  sidebarNav: { flex: 1, padding: "16px 0" },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 20px",
    color: "#a8d5a8",
    fontSize: 14,
    cursor: "pointer",
  },
  sidebarItemActive: {
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    borderLeft: "3px solid #f0c050",
  },
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  staffName: { fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 2 },
  staffRole: { fontSize: 11, color: "#a8d5a8", marginBottom: 10 },
  logoutBtn: {
    width: "100%",
    padding: 8,
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  main: { flex: 1, marginLeft: 240, padding: 32 },
  loading: { textAlign: "center", color: "#888", padding: 40 },
  errorBox: {
    background: "#fff0f0",
    border: "1px solid #ffcccc",
    color: "#cc0000",
    padding: 16,
    borderRadius: 8,
    fontSize: 14,
  },
  pageTitle: { fontSize: 24, fontWeight: 700, color: "#111", marginBottom: 6 },
  pageSub: { fontSize: 14, color: "#666", marginBottom: 24 },
  statusBadge: {
    textTransform: "capitalize",
    fontWeight: 600,
    color: "#1a7a3a",
  },
  shortcutsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 28,
  },
  shortcutCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 18,
    cursor: "default",
  },
  shortcutTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  shortcutIcon: { fontSize: 22 },
  shortcutValue: { fontSize: 24, fontWeight: 700 },
  shortcutLabel: { fontSize: 13, color: "#666" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1f4d1f",
    marginBottom: 14,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 14,
    marginBottom: 28,
  },
  statCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 18,
  },
  statLabel: { fontSize: 12, color: "#888", marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: 700, color: "#111" },
  statSubValue: { fontSize: 13, fontWeight: 400, color: "#888" },
  earningsCard: {
    background: "#1a3d1a",
    borderRadius: 12,
    padding: 24,
  },
  earningsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 24,
    marginBottom: 16,
  },
  earningsItem: { minWidth: 140 },
  earningsLabel: { fontSize: 12, color: "#a8d5a8", marginBottom: 6 },
  earningsValue: { fontSize: 20, fontWeight: 700, color: "#fff" },
  earningsFooter: {
    fontSize: 12,
    color: "#a8d5a8",
    paddingTop: 14,
    borderTop: "1px solid rgba(255,255,255,0.15)",
  },
};
