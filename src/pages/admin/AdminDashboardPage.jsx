import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const LOGO_PATH = "/achoice logo.png";

// ── Tiny bar chart (pure CSS) ─────────────────────────────────────────────────
function BarChart({ data, color = "#1f4d1f" }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 6,
        height: 120,
        padding: "0 4px",
      }}
    >
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div style={{ fontSize: 9, color: "#888", whiteSpace: "nowrap" }}>
            {d.value > 0 ? `₦${(d.value / 1000).toFixed(0)}k` : ""}
          </div>
          <div
            style={{
              width: "100%",
              background: color,
              borderRadius: "3px 3px 0 0",
              height: `${Math.max((d.value / max) * 90, d.value > 0 ? 4 : 0)}px`,
              transition: "height 0.5s ease",
              opacity: 0.85,
            }}
          />
          <div style={{ fontSize: 9, color: "#888", whiteSpace: "nowrap" }}>
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tiny line chart (SVG) ─────────────────────────────────────────────────────
function LineChart({ data, color = "#f0c050" }) {
  const w = 340,
    h = 100,
    pad = 16;
  const max = Math.max(...data.map((d) => d.value), 1);
  const pts = data.map((d, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2),
    y: h - pad - (d.value / max) * (h - pad * 2),
  }));
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const area = `${path} L${pts[pts.length - 1].x},${h - pad} L${pts[0].x},${h - pad} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg)" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill={color}
          stroke="#fff"
          strokeWidth="2"
        />
      ))}
      {data.map((d, i) => (
        <text
          key={i}
          x={pts[i].x}
          y={h}
          textAnchor="middle"
          fontSize="9"
          fill="#888"
        >
          {d.label}
        </text>
      ))}
    </svg>
  );
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [loans, setLoans] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentLoans, setRecentLoans] = useState([]);
  const [revenueStats, setRevenueStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    Promise.all([api.get("/admin/dashboard"), api.get("/admin/stats/revenue")])
      .then(([dashRes, revRes]) => {
        const dash = dashRes.data;
        setOverview(dash.overview);
        setLoans(dash.loans);
        setRecentOrders(dash.recent_orders || []);
        setRecentLoans(dash.recent_loans || []);
        setRevenueStats(revRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin");
  };

  const getStatusStyle = (status) =>
    ({
      pending: { background: "#fff8e7", color: "#b36b00" },
      approved: { background: "#eafaf0", color: "#1a7a3a" },
      active: { background: "#e7f0ff", color: "#1a4fa0" },
      rejected: { background: "#fff0f0", color: "#cc0000" },
      completed: { background: "#f0f0f0", color: "#555" },
      delivered: { background: "#eafaf0", color: "#1a7a3a" },
      shipped: { background: "#e7f7ff", color: "#0077aa" },
      processing: { background: "#fff8e7", color: "#b36b00" },
    })[status] || { background: "#f0f0f0", color: "#555" };

  // Build chart data from monthly_revenue
  const buildChartData = (monthly) => {
    if (!monthly?.length) return [];
    return [...monthly].reverse().map((m) => ({
      label: MONTHS[m.month - 1],
      value: Number(m.revenue || 0),
    }));
  };

  const chartData = buildChartData(revenueStats?.monthly_revenue);

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <img src={LOGO_PATH} alt="Logo" style={s.sidebarLogoImg} />
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Admin Panel</div>
          </div>
        </div>
        <nav style={s.sidebarNav}>
          {[
            {
              icon: "📊",
              label: "Dashboard",
              path: "/admin/dashboard",
              active: true,
            },
            { icon: "👤", label: "Buyers", path: "/admin/buyers" },
            { icon: "🏪", label: "Sellers", path: "/admin/sellers" },
            { icon: "🌾", label: "Products", path: "/admin/products" },
            { icon: "📦", label: "Orders", path: "/admin/orders" },
            { icon: "💰", label: "Loans", path: "/admin/loans" },
            {
              icon: "⚙️",
              label: "Loan Settings",
              path: "/admin/loan-settings",
            },
            {
              icon: "🚚",
              label: "Delivery Zones",
              path: "/admin/delivery-zones",
            },
            { icon: "👥", label: "Staff", path: "/admin/staff" },
            { icon: "📈", label: "Reports", path: "/admin/reports" },
            { icon: "⚙️", label: "Site Settings", path: "/admin/settings" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...s.sidebarItem,
                ...(item.active ? s.sidebarItemActive : {}),
              }}
              onClick={() => navigate(item.path)}
            >
              <span style={s.sidebarIcon}>{item.icon}</span> {item.label}
              {item.label === "Loans" && loans?.pending_applications > 0 && (
                <span style={s.badge}>{loans.pending_applications}</span>
              )}
            </div>
          ))}
        </nav>
        <div style={s.sidebarFooter}>
          <div style={s.sidebarUser}>
            <div style={s.sidebarAvatar}>
              <img src={LOGO_PATH} alt="Admin" style={s.avatarImg} />
            </div>
            <div>
              <div style={s.sidebarUserName}>{user.name || "Admin"}</div>
              <div style={s.sidebarUserRole}>Administrator</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>Dashboard</h1>
            <p style={s.headerSub}>Welcome back, {user.name || "Admin"}</p>
          </div>
          <div style={s.headerDate}>
            {new Date().toLocaleDateString("en-NG", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {loading ? (
          <p style={s.loading}>Loading dashboard...</p>
        ) : (
          <>
            {/* ── Stats Grid ── */}
            <div style={s.statsGrid}>
              {[
                {
                  label: "Total Buyers",
                  value: overview?.total_buyers,
                  icon: "👥",
                  color: "#1a4fa0",
                },
                {
                  label: "Total Sellers",
                  value: overview?.total_sellers,
                  icon: "🏪",
                  color: "#1f4d1f",
                },
                {
                  label: "Total Products",
                  value: overview?.total_products,
                  icon: "🌾",
                  color: "#c8860a",
                },
                {
                  label: "Total Orders",
                  value: overview?.total_orders,
                  icon: "📦",
                  color: "#7b2d8b",
                },
                {
                  label: "Pending Orders",
                  value: overview?.pending_orders,
                  icon: "⏳",
                  color: "#cc0000",
                },
                {
                  label: "Total Revenue",
                  value: `₦${Number(overview?.total_revenue || 0).toLocaleString()}`,
                  icon: "💵",
                  color: "#1f4d1f",
                },
                {
                  label: "Active Loans",
                  value: loans?.active_loans,
                  icon: "🔄",
                  color: "#1a4fa0",
                },
                {
                  label: "Total Disbursed",
                  value: `₦${Number(loans?.total_disbursed || 0).toLocaleString()}`,
                  icon: "💸",
                  color: "#c8860a",
                },
                {
                  label: "Total Repaid",
                  value: `₦${Number(loans?.total_repaid || 0).toLocaleString()}`,
                  icon: "✅",
                  color: "#1f4d1f",
                },
              ].map((stat) => (
                <div key={stat.label} style={s.statCard}>
                  <div style={s.statTop}>
                    <div style={s.statLabel}>{stat.label}</div>
                    <div style={s.statIcon}>{stat.icon}</div>
                  </div>
                  <div style={{ ...s.statValue, color: stat.color }}>
                    {stat.value ?? 0}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Charts Row ── */}
            {chartData.length > 0 && (
              <div style={s.chartsRow}>
                {/* Bar chart — sales volume */}
                <div style={s.chartCard}>
                  <div style={s.chartHeader}>
                    <div>
                      <div style={s.chartTitle}>Monthly Sales Revenue</div>
                      <div style={s.chartSub}>
                        Last {chartData.length} months
                      </div>
                    </div>
                    <div style={s.chartBadge}>Bar</div>
                  </div>
                  <BarChart data={chartData} color="#1f4d1f" />
                </div>

                {/* Line chart — revenue trend */}
                <div style={s.chartCard}>
                  <div style={s.chartHeader}>
                    <div>
                      <div style={s.chartTitle}>Revenue Trend</div>
                      <div style={s.chartSub}>
                        Last {chartData.length} months
                      </div>
                    </div>
                    <div
                      style={{
                        ...s.chartBadge,
                        background: "#fff8e7",
                        color: "#b36b00",
                      }}
                    >
                      Line
                    </div>
                  </div>
                  <LineChart data={chartData} color="#f0c050" />
                </div>
              </div>
            )}

            {/* ── Top Products & Top Sellers ── */}
            {revenueStats && (
              <div style={s.topRow}>
                {/* Top Products */}
                <div style={s.topCard}>
                  <div style={s.activityHeader}>
                    <h2 style={s.activityTitle}>🌾 Top Products</h2>
                  </div>
                  {revenueStats.top_products?.map((p, i) => (
                    <div key={p.id} style={s.topItem}>
                      <div style={s.topRank}>#{i + 1}</div>
                      <div style={s.topInfo}>
                        <div style={s.topName}>{p.name}</div>
                        <div style={s.topMeta}>
                          {p.category} · {p.order_items_count} sold
                        </div>
                      </div>
                      <div style={s.topValue}>
                        ₦{Number(p.price).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Sellers */}
                <div style={s.topCard}>
                  <div style={s.activityHeader}>
                    <h2 style={s.activityTitle}>🏪 Top Sellers</h2>
                    <span
                      style={s.viewAll}
                      onClick={() => navigate("/admin/sellers")}
                    >
                      View all
                    </span>
                  </div>
                  {revenueStats.top_sellers?.map((sel, i) => (
                    <div key={sel.id} style={s.topItem}>
                      <div style={s.topRank}>#{i + 1}</div>
                      <div style={s.topInfo}>
                        <div style={s.topName}>{sel.business_name}</div>
                        <div style={s.topMeta}>{sel.user?.name}</div>
                      </div>
                      <div style={s.topValue}>
                        ₦{Number(sel.earnings_balance).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Loan Summary ── */}
            {loans && (
              <div style={s.loanSummaryRow}>
                {[
                  {
                    label: "Pending Applications",
                    value: loans.pending_applications,
                    color: "#b36b00",
                    bg: "#fff8e7",
                  },
                  {
                    label: "Active Loans",
                    value: loans.active_loans,
                    color: "#1a4fa0",
                    bg: "#e7f0ff",
                  },
                  {
                    label: "Total Disbursed",
                    value: `₦${Number(loans.total_disbursed).toLocaleString()}`,
                    color: "#1f4d1f",
                    bg: "#eafaf0",
                  },
                  {
                    label: "Outstanding Balance",
                    value: `₦${Number(loans.outstanding).toLocaleString()}`,
                    color: "#cc0000",
                    bg: "#fff0f0",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{ ...s.loanStatCard, background: item.bg }}
                  >
                    <div style={{ ...s.loanStatValue, color: item.color }}>
                      {item.value}
                    </div>
                    <div style={s.loanStatLabel}>{item.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Recent Activity ── */}
            <div style={s.activityGrid}>
              <div style={s.activityCard}>
                <div style={s.activityHeader}>
                  <h2 style={s.activityTitle}>Recent Orders</h2>
                  <span
                    style={s.viewAll}
                    onClick={() => navigate("/admin/orders")}
                  >
                    View all
                  </span>
                </div>
                {recentOrders.length === 0 ? (
                  <p style={s.empty}>No orders yet</p>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} style={s.activityItem}>
                      <div>
                        <div style={s.activityId}>Order #{order.id}</div>
                        <div style={s.activityMeta}>
                          {order.buyer?.name} — ₦
                          {Number(
                            order.total_amount || order.total || 0,
                          ).toLocaleString()}
                        </div>
                      </div>
                      <div
                        style={{
                          ...s.statusBadge,
                          ...getStatusStyle(order.status),
                        }}
                      >
                        {order.status}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={s.activityCard}>
                <div style={s.activityHeader}>
                  <h2 style={s.activityTitle}>Recent Loans</h2>
                  <span
                    style={s.viewAll}
                    onClick={() => navigate("/admin/loans")}
                  >
                    View all
                  </span>
                </div>
                {recentLoans.length === 0 ? (
                  <p style={s.empty}>No loans yet</p>
                ) : (
                  recentLoans.map((loan) => (
                    <div key={loan.id} style={s.activityItem}>
                      <div>
                        <div style={s.activityId}>
                          ₦{Number(loan.amount).toLocaleString()}
                        </div>
                        <div style={s.activityMeta}>
                          {loan.user?.name} — {loan.purpose}
                        </div>
                      </div>
                      <div
                        style={{
                          ...s.statusBadge,
                          ...getStatusStyle(loan.status),
                        }}
                      >
                        {loan.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
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
  sidebarLogoImg: { width: 40, height: 40, objectFit: "contain" },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: "#fff" },
  sidebarLogoSub: { fontSize: 10, color: "#a8d5a8", marginTop: 1 },
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
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderLeft: "4px solid #f0c050",
  },
  sidebarIcon: { fontSize: 16 },
  badge: {
    marginLeft: "auto",
    background: "#cc0000",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 99,
  },
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  sidebarUser: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sidebarAvatar: {
    width: 34,
    height: 34,
    background: "#fff",
    borderRadius: "50%",
    overflow: "hidden",
    border: "2px solid #f0c050",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  sidebarUserName: { fontSize: 13, fontWeight: 600, color: "#fff" },
  sidebarUserRole: { fontSize: 11, color: "#a8d5a8" },
  logoutBtn: {
    width: "100%",
    padding: 8,
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
  },
  main: { flex: 1, marginLeft: 240, padding: 32 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#111",
    marginBottom: 4,
  },
  headerSub: { fontSize: 14, color: "#888" },
  headerDate: { fontSize: 13, color: "#888" },
  loading: { textAlign: "center", color: "#666", padding: 40 },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 14,
    marginBottom: 24,
  },
  statCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 18,
  },
  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statLabel: { fontSize: 12, color: "#888" },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 26, fontWeight: 700 },

  // Charts
  chartsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 24,
  },
  chartCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 20,
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  chartTitle: { fontSize: 15, fontWeight: 700, color: "#111" },
  chartSub: { fontSize: 12, color: "#888", marginTop: 2 },
  chartBadge: {
    background: "#eafaf0",
    color: "#1f4d1f",
    fontSize: 10,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 4,
  },

  // Top products/sellers
  topRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 24,
  },
  topCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 20,
  },
  topItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #f5f5f5",
  },
  topRank: { fontSize: 12, fontWeight: 700, color: "#c8860a", width: 24 },
  topInfo: { flex: 1 },
  topName: { fontSize: 13, fontWeight: 600, color: "#111" },
  topMeta: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
    textTransform: "capitalize",
  },
  topValue: { fontSize: 13, fontWeight: 700, color: "#1f4d1f" },

  // Loan summary
  loanSummaryRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 14,
    marginBottom: 24,
  },
  loanStatCard: {
    borderRadius: 10,
    padding: "16px 20px",
    border: "1px solid #e8e4dc",
  },
  loanStatValue: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  loanStatLabel: { fontSize: 12, color: "#666" },

  activityGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  activityCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 20,
  },
  activityHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  activityTitle: { fontSize: 16, fontWeight: 700, color: "#111" },
  viewAll: {
    fontSize: 13,
    color: "#1f4d1f",
    cursor: "pointer",
    fontWeight: 500,
  },
  activityItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  activityId: { fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 2 },
  activityMeta: { fontSize: 12, color: "#888", textTransform: "capitalize" },
  statusBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 99,
    textTransform: "capitalize",
  },
  empty: { color: "#888", fontSize: 13, textAlign: "center", padding: 20 },
};
