import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const LOGO_PATH = "/achoice logo.png";

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("sales");
  const [days, setDays] = useState(30);
  const [salesData, setSalesData] = useState(null);
  const [loansData, setLoansData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [loansLoading, setLoansLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityFilter, setActivityFilter] = useState("all");
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };
  const toMoney = (v) => `₦${Number(v || 0).toLocaleString()}`;
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  const safeArr = (v) => (Array.isArray(v) ? v : []);

  useEffect(() => {
    if (activeTab === "sales") {
      setSalesLoading(true);
      api
        .get("/admin/reports/sales", { params: { days } })
        .then((r) => setSalesData(r.data))
        .catch(() => showToast("Failed to load sales report."))
        .finally(() => setSalesLoading(false));
    }
    if (activeTab === "loans") {
      setLoansLoading(true);
      api
        .get("/admin/reports/loans", { params: { days } })
        .then((r) => setLoansData(r.data))
        .catch(() => showToast("Failed to load loans report."))
        .finally(() => setLoansLoading(false));
    }
    if (activeTab === "activity") {
      setActivityLoading(true);
      const params = { days };
      if (activityFilter !== "all") params.module = activityFilter;
      api
        .get("/admin/activity", { params })
        .then((r) => setActivityData(r.data))
        .catch(() => showToast("Failed to load activity."))
        .finally(() => setActivityLoading(false));
    }
  }, [activeTab, days, activityFilter]);

  const MiniBarChart = ({
    data,
    valueKey,
    labelKey,
    color = "#1f4d1f",
    height = 160,
  }) => {
    const safe = safeArr(data);
    if (safe.length === 0)
      return (
        <p
          style={{
            color: "#888",
            fontSize: 13,
            textAlign: "center",
            padding: 20,
          }}
        >
          No data available
        </p>
      );
    const max = Math.max(...safe.map((d) => Number(d[valueKey] || 0)), 1);
    return (
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
          height,
          padding: "0 4px",
        }}
      >
        {safe.map((item, i) => {
          const pct = (Number(item[valueKey] || 0) / max) * 100;
          const val = Number(item[valueKey] || 0);
          const display =
            val >= 1000000
              ? `₦${(val / 1000000).toFixed(1)}M`
              : val >= 1000
                ? `₦${(val / 1000).toFixed(0)}K`
                : val > 0
                  ? `₦${val}`
                  : "0";
          return (
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
              <div style={{ fontSize: 9, color: "#888", textAlign: "center" }}>
                {display}
              </div>
              <div
                style={{
                  width: "100%",
                  background: "#eee",
                  borderRadius: 4,
                  height: height - 40,
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: `${Math.max(pct, 2)}%`,
                    background: color,
                    borderRadius: 4,
                  }}
                />
              </div>
              <div style={{ fontSize: 9, color: "#888", textAlign: "center" }}>
                {item[labelKey] === 1
                  ? "Jan"
                  : item[labelKey] === 2
                    ? "Feb"
                    : item[labelKey] === 3
                      ? "Mar"
                      : item[labelKey] === 4
                        ? "Apr"
                        : item[labelKey] === 5
                          ? "May"
                          : item[labelKey] === 6
                            ? "Jun"
                            : item[labelKey] === 7
                              ? "Jul"
                              : item[labelKey] === 8
                                ? "Aug"
                                : item[labelKey] === 9
                                  ? "Sep"
                                  : item[labelKey] === 10
                                    ? "Oct"
                                    : item[labelKey] === 11
                                      ? "Nov"
                                      : item[labelKey] === 12
                                        ? "Dec"
                                        : item[labelKey]}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const MiniPieChart = ({ data, labelKey, valueKey }) => {
    const safe = safeArr(data);
    if (safe.length === 0)
      return (
        <p
          style={{
            color: "#888",
            fontSize: 13,
            textAlign: "center",
            padding: 20,
          }}
        >
          No data
        </p>
      );
    const colors = [
      "#1f4d1f",
      "#f0c050",
      "#1a4fa0",
      "#cc0000",
      "#1a7a3a",
      "#b36b00",
      "#0077aa",
    ];
    const total = safe.reduce((s, d) => s + Number(d[valueKey] || 0), 0);
    return (
      <div>
        {safe.map((item, i) => {
          const pct =
            total > 0
              ? Math.round((Number(item[valueKey] || 0) / total) * 100)
              : 0;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: colors[i % colors.length],
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: "#333",
                  textTransform: "capitalize",
                }}
              >
                {item[labelKey]}
              </div>
              <div
                style={{
                  width: 120,
                  background: "#eee",
                  borderRadius: 99,
                  overflow: "hidden",
                  height: 8,
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: colors[i % colors.length],
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#555",
                  minWidth: 36,
                  textAlign: "right",
                }}
              >
                {pct}%
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#888",
                  minWidth: 30,
                  textAlign: "right",
                }}
              >
                {item[valueKey]}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const downloadSalesPDF = () => {
    if (!salesData) return showToast("No data to download.");
    setDownloading(true);
    const today = new Date().toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const topRows = safeArr(salesData.top_products)
      .map(
        (p, i) => `
      <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#fff"}">
        <td style="padding:8px;border-bottom:1px solid #eee">${i + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">${p.name || "—"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${p.category || "—"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${p.items_sold || 0}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#1f4d1f;font-weight:700">₦${Number(p.revenue || 0).toLocaleString()}</td>
      </tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ACHOICE Sales Report</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:28px;font-size:12px}
      .header{display:flex;justify-content:space-between;padding-bottom:16px;border-bottom:3px solid #1f4d1f;margin-bottom:20px}
      h1{font-size:22px;color:#1f4d1f;font-weight:900}h2{font-size:13px;color:#1f4d1f;margin:20px 0 10px;text-transform:uppercase;letter-spacing:1px}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
      .card{border:1px solid #ddd;border-radius:8px;padding:14px;text-align:center}
      .card-val{font-size:20px;font-weight:700;color:#1f4d1f;margin-bottom:4px}.card-label{font-size:10px;color:#888}
      table{width:100%;border-collapse:collapse}th{background:#1f4d1f;color:#fff;padding:9px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.5px}
      .footer{margin-top:24px;padding-top:12px;border-top:1px solid #ddd;font-size:10px;color:#aaa;text-align:center}
      @media print{body{padding:16px}}</style></head><body>
      <div class="header">
        <div><h1>ACHOICE LIMITED</h1><p style="color:#888;margin-top:4px">Sales Report — Last ${days} days</p></div>
        <div style="text-align:right;font-size:11px;color:#555"><div style="font-weight:700;color:#1f4d1f">Generated: ${today}</div></div>
      </div>
      <div class="grid">
        <div class="card"><div class="card-val">₦${Number(salesData.total_revenue || 0).toLocaleString()}</div><div class="card-label">Total Revenue</div></div>
        <div class="card"><div class="card-val">${salesData.total_orders || 0}</div><div class="card-label">Total Orders</div></div>
        <div class="card"><div class="card-val">${salesData.delivered_orders || 0}</div><div class="card-label">Delivered</div></div>
        <div class="card"><div class="card-val">${salesData.pending_orders || 0}</div><div class="card-label">Pending</div></div>
        <div class="card"><div class="card-val">₦${Number(salesData.average_order_value || 0).toLocaleString()}</div><div class="card-label">Avg Order Value</div></div>
        <div class="card"><div class="card-val">₦${Number(salesData.delivery_fees_collected || 0).toLocaleString()}</div><div class="card-label">Delivery Fees</div></div>
      </div>
      <h2>Top Selling Products</h2>
      <table><thead><tr><th>#</th><th>Product</th><th>Category</th><th>Units Sold</th><th>Revenue</th></tr></thead>
      <tbody>${topRows || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888">No products data</td></tr>'}</tbody></table>
      <div class="footer">ACHOICE LIMITED · Confidential Sales Report · ${today}</div>
      <script>window.onload=function(){setTimeout(function(){window.print()},500)}</script></body></html>`;
    const win = window.open("", "_blank");
    if (!win) {
      showToast("Allow popups to download PDF.");
      setDownloading(false);
      return;
    }
    win.document.write(html);
    win.document.close();
    setDownloading(false);
  };

  const downloadLoansPDF = () => {
    if (!loansData) return showToast("No data to download.");
    setDownloading(true);
    const today = new Date().toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const staffRows = safeArr(loansData.staff_performance)
      .map(
        (s, i) => `
      <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#fff"}">
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">${s.name || "—"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${s.total_reviewed || 0}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#1a7a3a;font-weight:600">${s.approved || 0}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#cc0000;font-weight:600">${s.rejected || 0}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#1f4d1f;font-weight:700">₦${Number(s.total_disbursed || 0).toLocaleString()}</td>
      </tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ACHOICE Loans Report</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:28px;font-size:12px}
      .header{display:flex;justify-content:space-between;padding-bottom:16px;border-bottom:3px solid #1f4d1f;margin-bottom:20px}
      h1{font-size:22px;color:#1f4d1f;font-weight:900}h2{font-size:13px;color:#1f4d1f;margin:20px 0 10px;text-transform:uppercase;letter-spacing:1px}
      .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
      .card{border:1px solid #ddd;border-radius:8px;padding:14px;text-align:center}
      .card-val{font-size:18px;font-weight:700;color:#1f4d1f;margin-bottom:4px}.card-label{font-size:10px;color:#888}
      table{width:100%;border-collapse:collapse}th{background:#1f4d1f;color:#fff;padding:9px 10px;text-align:left;font-size:10px;text-transform:uppercase}
      .footer{margin-top:24px;padding-top:12px;border-top:1px solid #ddd;font-size:10px;color:#aaa;text-align:center}
      @media print{body{padding:16px}}</style></head><body>
      <div class="header">
        <div><h1>ACHOICE LIMITED</h1><p style="color:#888;margin-top:4px">Loans Report — Last ${days} days</p></div>
        <div style="text-align:right;font-size:11px;color:#555"><div style="font-weight:700;color:#1f4d1f">Generated: ${today}</div></div>
      </div>
      <div class="grid">
        <div class="card"><div class="card-val">${loansData.total_applications || 0}</div><div class="card-label">Total Applications</div></div>
        <div class="card"><div class="card-val">${loansData.approved || 0}</div><div class="card-label">Approved</div></div>
        <div class="card"><div class="card-val">${loansData.rejected || 0}</div><div class="card-label">Rejected</div></div>
        <div class="card"><div class="card-val">${loansData.pending || 0}</div><div class="card-label">Pending</div></div>
        <div class="card"><div class="card-val">₦${Number(loansData.total_disbursed || 0).toLocaleString()}</div><div class="card-label">Total Disbursed</div></div>
        <div class="card"><div class="card-val">₦${Number(loansData.total_repaid || 0).toLocaleString()}</div><div class="card-label">Total Repaid</div></div>
        <div class="card"><div class="card-val">₦${Number(loansData.outstanding_balance || 0).toLocaleString()}</div><div class="card-label">Outstanding</div></div>
        <div class="card"><div class="card-val">${loansData.repayment_rate || "0%"}</div><div class="card-label">Repayment Rate</div></div>
      </div>
      <h2>Loan Staff Performance</h2>
      <table><thead><tr><th>Staff Member</th><th>Reviewed</th><th>Approved</th><th>Rejected</th><th>Total Disbursed</th></tr></thead>
      <tbody>${staffRows || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888">No staff data</td></tr>'}</tbody></table>
      <div class="footer">ACHOICE LIMITED · Confidential Loans Report · ${today}</div>
      <script>window.onload=function(){setTimeout(function(){window.print()},500)}</script></body></html>`;
    const win = window.open("", "_blank");
    if (!win) {
      showToast("Allow popups to download PDF.");
      setDownloading(false);
      return;
    }
    win.document.write(html);
    win.document.close();
    setDownloading(false);
  };

  const downloadCSV = (rows, filename) => {
    const csv = rows
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadSalesCSV = () => {
    if (!salesData) return showToast("No data to download.");
    const rows = [
      ["ACHOICE LIMITED — Sales Report", `Last ${days} days`],
      [],
      ["Metric", "Value"],
      ["Total Revenue", salesData.total_revenue || 0],
      ["Total Orders", salesData.total_orders || 0],
      ["Delivered Orders", salesData.delivered_orders || 0],
      ["Pending Orders", salesData.pending_orders || 0],
      ["Average Order Value", salesData.average_order_value || 0],
      ["Delivery Fees Collected", salesData.delivery_fees_collected || 0],
      [],
      ["Top Products"],
      ["#", "Product", "Category", "Units Sold", "Revenue"],
      ...safeArr(salesData.top_products).map((p, i) => [
        i + 1,
        p.name,
        p.category,
        p.items_sold || 0,
        p.revenue || 0,
      ]),
    ];
    downloadCSV(
      rows,
      `achoice-sales-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  const downloadLoansCSV = () => {
    if (!loansData) return showToast("No data to download.");
    const rows = [
      ["ACHOICE LIMITED — Loans Report", `Last ${days} days`],
      [],
      ["Metric", "Value"],
      ["Total Applications", loansData.total_applications || 0],
      ["Approved", loansData.approved || 0],
      ["Rejected", loansData.rejected || 0],
      ["Pending", loansData.pending || 0],
      ["Total Disbursed", loansData.total_disbursed || 0],
      ["Total Repaid", loansData.total_repaid || 0],
      ["Outstanding Balance", loansData.outstanding_balance || 0],
      ["Repayment Rate", loansData.repayment_rate || "0%"],
      [],
      ["Staff Performance"],
      ["Staff Name", "Reviewed", "Approved", "Rejected", "Total Disbursed"],
      ...safeArr(loansData.staff_performance).map((s) => [
        s.name,
        s.total_reviewed || 0,
        s.approved || 0,
        s.rejected || 0,
        s.total_disbursed || 0,
      ]),
    ];
    downloadCSV(
      rows,
      `achoice-loans-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  const sidebarItems = [
    { icon: "📊", label: "Dashboard", path: "/admin/dashboard" },
    { icon: "👤", label: "Buyers", path: "/admin/buyers" },
    { icon: "📋", label: "Complaints", path: "/admin/complaints" },
    { icon: "💳", label: "Payments", path: "/admin/payments" },
    { icon: "🏪", label: "Sellers", path: "/admin/sellers" },
    { icon: "🌾", label: "Products", path: "/admin/products" },
    { icon: "📦", label: "Orders", path: "/admin/orders" },
    { icon: "💰", label: "Loans", path: "/admin/loans" },
    { icon: "👥", label: "Staff", path: "/admin/staff" },
    { icon: "⚙️", label: "Loan Settings", path: "/admin/loan-settings" },
    { icon: "🚚", label: "Delivery Zones", path: "/admin/delivery-zones" },
    { icon: "📈", label: "Reports", path: "/admin/reports", active: true },
    { icon: "⚙️", label: "Settings", path: "/admin/settings" },
    //import AdminSettingsPage  from './pages/admin/AdminSettingsPage'; //
  ];

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <img src={LOGO_PATH} alt="Achoice" style={s.logoImg} />
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Admin Panel</div>
          </div>
        </div>
        <nav style={s.sidebarNav}>
          {sidebarItems.map((item) => (
            <div
              key={item.label}
              style={{
                ...s.sidebarItem,
                ...(item.active ? s.sidebarItemActive : {}),
              }}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
        <div style={s.sidebarFooter}>
          <button
            style={s.logoutBtn}
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/admin");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>Reports & Analytics</h1>
            <p style={s.headerSub}>
              Download and analyze platform performance data
            </p>
          </div>
          <div style={s.periodRow}>
            {[7, 30, 90, 365].map((d) => (
              <button
                key={d}
                style={days === d ? s.periodBtnActive : s.periodBtn}
                onClick={() => setDays(d)}
              >
                {d === 7
                  ? "7 days"
                  : d === 30
                    ? "30 days"
                    : d === 90
                      ? "90 days"
                      : "1 year"}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabNav}>
          {[
            { key: "sales", label: "📦 Sales Report" },
            { key: "loans", label: "💰 Loans Report" },
            { key: "activity", label: "👥 Staff Activity" },
          ].map((tab) => (
            <button
              key={tab.key}
              style={activeTab === tab.key ? s.tabActive : s.tab}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════ SALES ════ */}
        {activeTab === "sales" && (
          <div>
            <div style={s.downloadRow}>
              <button
                style={
                  downloading
                    ? s.dlBtnDisabled
                    : { ...s.dlBtn, background: "#cc0000" }
                }
                onClick={downloadSalesPDF}
                disabled={downloading}
              >
                📄 PDF
              </button>
              <button
                style={
                  downloading
                    ? s.dlBtnDisabled
                    : { ...s.dlBtn, background: "#1a7a3a" }
                }
                onClick={downloadSalesCSV}
                disabled={downloading}
              >
                📋 CSV
              </button>
            </div>

            {salesLoading ? (
              <p style={s.loading}>Loading sales report...</p>
            ) : salesData ? (
              <>
                <div style={s.kpiGrid}>
                  {[
                    {
                      label: "Total Revenue",
                      value: toMoney(salesData.total_revenue),
                      icon: "💵",
                      color: "#1f4d1f",
                    },
                    {
                      label: "Total Orders",
                      value: salesData.total_orders || 0,
                      icon: "📦",
                      color: "#1a4fa0",
                    },
                    {
                      label: "Delivered",
                      value: salesData.delivered_orders || 0,
                      icon: "✅",
                      color: "#1a7a3a",
                    },
                    {
                      label: "Pending",
                      value: salesData.pending_orders || 0,
                      icon: "⏳",
                      color: "#b36b00",
                    },
                    {
                      label: "Avg Order Value",
                      value: toMoney(salesData.average_order_value),
                      icon: "📊",
                      color: "#1f4d1f",
                    },
                    {
                      label: "Delivery Fees",
                      value: toMoney(salesData.delivery_fees_collected),
                      icon: "🚚",
                      color: "#555",
                    },
                  ].map((kpi) => (
                    <div key={kpi.label} style={s.kpiCard}>
                      <div style={s.kpiTop}>
                        <div style={s.kpiLabel}>{kpi.label}</div>
                        <span style={s.kpiIcon}>{kpi.icon}</span>
                      </div>
                      <div style={{ ...s.kpiValue, color: kpi.color }}>
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={s.chartsRow}>
                  <div style={s.chartCard}>
                    <div style={s.chartTitle}>Monthly Revenue</div>
                    <MiniBarChart
                      data={salesData.monthly_revenue}
                      valueKey="revenue"
                      labelKey="month"
                      color="#1f4d1f"
                    />
                  </div>
                  <div style={s.chartCard}>
                    <div style={s.chartTitle}>Orders by Status</div>
                    <MiniPieChart
                      data={salesData.orders_by_status}
                      labelKey="status"
                      valueKey="count"
                    />
                  </div>
                </div>

                <div style={s.tableCard}>
                  <div style={s.tableCardTitle}>🏆 Top Products by Revenue</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={s.table}>
                      <thead>
                        <tr style={s.tableHead}>
                          <th style={s.th}>#</th>
                          <th style={s.th}>Product</th>
                          <th style={s.th}>Category</th>
                          <th style={s.th}>Units Sold</th>
                          <th style={s.th}>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {safeArr(salesData.top_products).map((p, i) => (
                          <tr key={i} style={s.tableRow}>
                            <td style={s.td}>
                              <strong style={{ color: "#f0c050" }}>
                                #{i + 1}
                              </strong>
                            </td>
                            <td style={{ ...s.td, fontWeight: 600 }}>
                              {p.name || "—"}
                            </td>
                            <td style={s.td}>
                              <span style={s.categoryBadge}>
                                {p.category || "—"}
                              </span>
                            </td>
                            <td style={s.td}>{p.items_sold || 0}</td>
                            <td
                              style={{
                                ...s.td,
                                color: "#1f4d1f",
                                fontWeight: 700,
                              }}
                            >
                              {toMoney(p.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {safeArr(salesData.top_products).length === 0 && (
                      <div style={s.empty}>
                        No product data for this period.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={s.empty}>No sales data available.</div>
            )}
          </div>
        )}

        {/* ════ LOANS ════ */}
        {activeTab === "loans" && (
          <div>
            <div style={s.downloadRow}>
              <button
                style={
                  downloading
                    ? s.dlBtnDisabled
                    : { ...s.dlBtn, background: "#cc0000" }
                }
                onClick={downloadLoansPDF}
                disabled={downloading}
              >
                📄 PDF
              </button>
              <button
                style={
                  downloading
                    ? s.dlBtnDisabled
                    : { ...s.dlBtn, background: "#1a7a3a" }
                }
                onClick={downloadLoansCSV}
                disabled={downloading}
              >
                📋 CSV
              </button>
            </div>

            {loansLoading ? (
              <p style={s.loading}>Loading loans report...</p>
            ) : loansData ? (
              <>
                <div style={s.kpiGrid}>
                  {[
                    {
                      label: "Total Applications",
                      value: loansData.total_applications || 0,
                      icon: "📋",
                      color: "#1f4d1f",
                    },
                    {
                      label: "Approved",
                      value: loansData.approved || 0,
                      icon: "✅",
                      color: "#1a7a3a",
                    },
                    {
                      label: "Rejected",
                      value: loansData.rejected || 0,
                      icon: "❌",
                      color: "#cc0000",
                    },
                    {
                      label: "Pending",
                      value: loansData.pending || 0,
                      icon: "⏳",
                      color: "#b36b00",
                    },
                    {
                      label: "Total Disbursed",
                      value: toMoney(loansData.total_disbursed),
                      icon: "💸",
                      color: "#1f4d1f",
                    },
                    {
                      label: "Total Repaid",
                      value: toMoney(loansData.total_repaid),
                      icon: "💰",
                      color: "#1a7a3a",
                    },
                    {
                      label: "Outstanding",
                      value: toMoney(loansData.outstanding_balance),
                      icon: "⚠️",
                      color: "#cc0000",
                    },
                    {
                      label: "Repayment Rate",
                      value: loansData.repayment_rate || "0%",
                      icon: "📊",
                      color: "#1a4fa0",
                    },
                  ].map((kpi) => (
                    <div key={kpi.label} style={s.kpiCard}>
                      <div style={s.kpiTop}>
                        <div style={s.kpiLabel}>{kpi.label}</div>
                        <span style={s.kpiIcon}>{kpi.icon}</span>
                      </div>
                      <div style={{ ...s.kpiValue, color: kpi.color }}>
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={s.chartsRow}>
                  <div style={s.chartCard}>
                    <div style={s.chartTitle}>Monthly Loan Applications</div>
                    <MiniBarChart
                      data={
                        salesData?.monthly_revenue
                          ? loansData.monthly_loans
                          : loansData.monthly_loans
                      }
                      valueKey="amount"
                      labelKey="month"
                      color="#1a4fa0"
                    />
                  </div>
                  <div style={s.chartCard}>
                    <div style={s.chartTitle}>Loans by Purpose</div>
                    <MiniPieChart
                      data={loansData.by_purpose}
                      labelKey="purpose"
                      valueKey="count"
                    />
                  </div>
                </div>

                {safeArr(loansData.staff_performance).length > 0 && (
                  <div style={s.tableCard}>
                    <div style={s.tableCardTitle}>
                      👥 Loan Staff Performance
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={s.table}>
                        <thead>
                          <tr style={s.tableHead}>
                            <th style={s.th}>Staff Member</th>
                            <th style={s.th}>Total Reviewed</th>
                            <th style={s.th}>Approved</th>
                            <th style={s.th}>Rejected</th>
                            <th style={s.th}>Total Disbursed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {safeArr(loansData.staff_performance).map(
                            (staff, i) => (
                              <tr key={i} style={s.tableRow}>
                                <td style={{ ...s.td, fontWeight: 600 }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 32,
                                        height: 32,
                                        background: "#1f4d1f",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#f0c050",
                                        fontWeight: 700,
                                        fontSize: 13,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {staff.name?.charAt(0) || "S"}
                                    </div>
                                    {staff.name || "—"}
                                  </div>
                                </td>
                                <td style={s.td}>
                                  {staff.total_reviewed || 0}
                                </td>
                                <td
                                  style={{
                                    ...s.td,
                                    color: "#1a7a3a",
                                    fontWeight: 700,
                                  }}
                                >
                                  {staff.approved || 0}
                                </td>
                                <td
                                  style={{
                                    ...s.td,
                                    color: "#cc0000",
                                    fontWeight: 700,
                                  }}
                                >
                                  {staff.rejected || 0}
                                </td>
                                <td
                                  style={{
                                    ...s.td,
                                    color: "#1f4d1f",
                                    fontWeight: 700,
                                  }}
                                >
                                  {toMoney(staff.total_disbursed)}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={s.empty}>No loans data available.</div>
            )}
          </div>
        )}

        {/* ════ ACTIVITY ════ */}
        {activeTab === "activity" && (
          <div>
            <div style={s.activityControls}>
              <div style={s.filterTabs}>
                {[
                  { key: "all", label: "All Activity" },
                  { key: "loan", label: "💰 Loan" },
                  { key: "agro", label: "🌾 Agro/Sales" },
                ].map((f) => (
                  <button
                    key={f.key}
                    style={
                      activityFilter === f.key ? s.filterTabActive : s.filterTab
                    }
                    onClick={() => setActivityFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {activityLoading ? (
              <p style={s.loading}>Loading activity...</p>
            ) : activityData ? (
              <>
                {activityData.summary && (
                  <div style={s.activitySummary}>
                    {[
                      {
                        label: "Total Actions",
                        value: activityData.summary.total_actions || 0,
                      },
                      {
                        label: "Agro Actions",
                        value: activityData.summary.agro_actions || 0,
                      },
                      {
                        label: "Loan Actions",
                        value: activityData.summary.loan_actions || 0,
                      },
                      {
                        label: "Active Staff",
                        value: activityData.summary.active_staff || 0,
                      },
                    ].map((item) => (
                      <div key={item.label} style={s.summaryCard}>
                        <div style={s.summaryVal}>{item.value}</div>
                        <div style={s.summaryLabel}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={s.tableCard}>
                  <div style={s.tableCardTitle}>
                    Staff Activity Log
                    {activityData.total > 0 && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#888",
                          fontWeight: 400,
                          marginLeft: 8,
                        }}
                      >
                        ({activityData.total} total actions)
                      </span>
                    )}
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={s.table}>
                      <thead>
                        <tr style={s.tableHead}>
                          <th style={s.th}>Staff Member</th>
                          <th style={s.th}>Action</th>
                          <th style={s.th}>Module</th>
                          <th style={s.th}>Details</th>
                          <th style={s.th}>Date & Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {safeArr(activityData.activities).map((act, i) => (
                          <tr key={act.id || i} style={s.tableRow}>
                            <td style={s.td}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    width: 32,
                                    height: 32,
                                    background: "#1f4d1f",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#f0c050",
                                    fontWeight: 700,
                                    fontSize: 13,
                                    flexShrink: 0,
                                  }}
                                >
                                  {act.staff?.name?.charAt(0) || "S"}
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      color: "#111",
                                      fontSize: 13,
                                    }}
                                  >
                                    {act.staff?.name || "—"}
                                  </div>
                                  <div style={{ fontSize: 11, color: "#888" }}>
                                    {act.staff?.email || ""}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={s.td}>
                              <span
                                style={{
                                  background: "#f7f5f0",
                                  color: "#555",
                                  padding: "3px 8px",
                                  borderRadius: 5,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  textTransform: "replace",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {(act.action || "—").replace(/_/g, " ")}
                              </span>
                            </td>
                            <td style={s.td}>
                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: 5,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  background:
                                    act.module === "loan"
                                      ? "#e7f0ff"
                                      : act.module === "agro"
                                        ? "#eafaf0"
                                        : "#f0f0f0",
                                  color:
                                    act.module === "loan"
                                      ? "#1a4fa0"
                                      : act.module === "agro"
                                        ? "#1a7a3a"
                                        : "#555",
                                }}
                              >
                                {act.module || "—"}
                              </span>
                            </td>
                            <td
                              style={{
                                ...s.td,
                                fontSize: 12,
                                color: "#555",
                                maxWidth: 260,
                              }}
                            >
                              {act.details || "—"}
                            </td>
                            <td
                              style={{
                                ...s.td,
                                fontSize: 11,
                                color: "#888",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {fmtDate(act.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {safeArr(activityData.activities).length === 0 && (
                      <div style={s.empty}>
                        No activity recorded for this period.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={s.empty}>No activity data available.</div>
            )}
          </div>
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
  sidebarNav: { flex: 1, padding: "16px 0", overflowY: "auto" },
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
  main: { flex: 1, marginLeft: 240, padding: 32, minWidth: 0 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#111",
    marginBottom: 4,
  },
  headerSub: { fontSize: 14, color: "#888" },
  periodRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  periodBtn: {
    padding: "8px 16px",
    border: "1px solid #ddd",
    borderRadius: 6,
    background: "#fff",
    color: "#555",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  periodBtnActive: {
    padding: "8px 16px",
    border: "1px solid #1f4d1f",
    borderRadius: 6,
    background: "#1f4d1f",
    color: "#fff",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  tabNav: {
    display: "flex",
    gap: 4,
    marginBottom: 24,
    background: "#fff",
    padding: 6,
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    flexWrap: "wrap",
  },
  tab: {
    flex: 1,
    padding: "10px 16px",
    border: "none",
    borderRadius: 7,
    background: "transparent",
    color: "#555",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  tabActive: {
    flex: 1,
    padding: "10px 16px",
    border: "none",
    borderRadius: 7,
    background: "#1f4d1f",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  downloadRow: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  dlBtn: {
    padding: "10px 20px",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  dlBtnDisabled: {
    padding: "10px 20px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 14,
    marginBottom: 20,
  },
  kpiCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 18,
  },
  kpiTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  kpiLabel: { fontSize: 12, color: "#888" },
  kpiIcon: { fontSize: 20 },
  kpiValue: { fontSize: 20, fontWeight: 700 },
  chartsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 20,
  },
  chartCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111",
    marginBottom: 16,
  },
  tableCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    overflow: "hidden",
    marginBottom: 20,
  },
  tableCardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111",
    padding: "16px 20px",
    borderBottom: "1px solid #eee",
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 500 },
  tableHead: { background: "#f7f5f0", borderBottom: "2px solid #eee" },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontSize: 11,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    whiteSpace: "nowrap",
  },
  tableRow: { borderTop: "1px solid #f5f5f5" },
  td: { padding: "14px 16px", verticalAlign: "middle", fontSize: 13 },
  categoryBadge: {
    background: "#eef2ff",
    color: "#4338ca",
    padding: "3px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
  },
  loading: { textAlign: "center", color: "#888", padding: 40 },
  empty: { textAlign: "center", color: "#888", padding: 40, fontSize: 14 },
  activityControls: { marginBottom: 20 },
  filterTabs: { display: "flex", gap: 8, flexWrap: "wrap" },
  filterTab: {
    padding: "8px 14px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 13,
    color: "#555",
    cursor: "pointer",
    background: "#fff",
    fontFamily: "inherit",
  },
  filterTabActive: {
    padding: "8px 14px",
    border: "1px solid #1f4d1f",
    borderRadius: 6,
    fontSize: 13,
    color: "#fff",
    cursor: "pointer",
    background: "#1f4d1f",
    fontFamily: "inherit",
  },
  activitySummary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 14,
    marginBottom: 20,
  },
  summaryCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 18,
    textAlign: "center",
  },
  summaryVal: {
    fontSize: 28,
    fontWeight: 700,
    color: "#1f4d1f",
    marginBottom: 4,
  },
  summaryLabel: { fontSize: 12, color: "#888" },
};
