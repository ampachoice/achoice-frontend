import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import NotificationBell from "../../components/buyer/NotificationBell";

const LOGO_PATH = "/achoice logo.png";

export default function AdminPaystackPage() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const fetchTransactions = (pageNum = 1) => {
    setLoading(true);
    setError(null);
    const params = { page: pageNum, perPage: 50 };
    if (statusFilter) params.status = statusFilter;
    if (customerFilter) params.customer = customerFilter;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;

    api.get("/admin/paystack/transactions", { params })
      .then((res) => {
        setTransactions(res.data?.data || []);
        setSummary(res.data?.summary || null);
        setMeta(res.data?.meta || null);
        setPage(res.data?.meta?.page || pageNum);
      })
      .catch(() => setError("Failed to load transactions. Please check the connection and try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransactions(1);
  }, [statusFilter, customerFilter, fromDate, toDate]);

  const goToPage = (pageNum) => {
    fetchTransactions(pageNum);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (customerFilter) params.customer = customerFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await api.get("/admin/paystack/transactions/export", {
        params,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `paystack_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("Export downloaded successfully.");
    } catch {
      showToast("Failed to export transactions. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const getStatusStyle = (status) =>
    ({
      success: { background: "#eafaf0", color: "#1a7a3a" },
      failed: { background: "#fff0f0", color: "#cc0000" },
      abandoned: { background: "#fff8e7", color: "#b36b00" },
    })[status] || { background: "#f0f0f0", color: "#555" };

  const lastPage = meta?.pageCount || 1;

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <img src={LOGO_PATH} alt="Achoice" style={s.logoImg} />
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Admin Panel</div>
          </div>
        </div>
        <nav style={s.sidebarNav}>
          {[
            { icon: "📊", label: "Dashboard", path: "/admin/dashboard" },
            { icon: "👤", label: "Buyers", path: "/admin/buyers" },
            { icon: "🏪", label: "Sellers", path: "/admin/sellers" },
            { icon: "🌾", label: "Products", path: "/admin/products" },
            { icon: "📦", label: "Orders", path: "/admin/orders" },
            { icon: "💰", label: "Loans", path: "/admin/loans" },
            { icon: "💳", label: "Payments", path: "/admin/payments", active: true },
            { icon: "⚙️", label: "Loan Settings", path: "/admin/loan-settings" },
            { icon: "🚚", label: "Delivery Zones", path: "/admin/delivery-zones" },
            { icon: "📋", label: "Complaints", path: "/admin/complaints" },
            { icon: "👥", label: "Staff", path: "/admin/staff" },
            { icon: "📈", label: "Reports", path: "/admin/reports" },
          ].map((item) => (
            <div
              key={item.label}
              style={{ ...s.sidebarItem, ...(item.active ? s.sidebarItemActive : {}) }}
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

      <div style={s.main}>
        <div style={s.topbar}>
          <NotificationBell />
        </div>

        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>Payments</h1>
            <p style={s.headerSub}>Paystack transaction history</p>
          </div>
          <button style={exporting ? s.exportBtnDisabled : s.exportBtn} onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>

        {summary && (
          <div style={s.summaryGrid}>
            <div style={s.summaryCard}>
              <div style={s.summaryLabel}>Total Amount</div>
              <div style={{ ...s.summaryValue, color: "#1f4d1f" }}>{summary.total_amount}</div>
            </div>
            <div style={s.summaryCard}>
              <div style={s.summaryLabel}>Successful</div>
              <div style={{ ...s.summaryValue, color: "#1a7a3a" }}>{summary.successful}</div>
            </div>
            <div style={s.summaryCard}>
              <div style={s.summaryLabel}>Failed</div>
              <div style={{ ...s.summaryValue, color: "#cc0000" }}>{summary.failed}</div>
            </div>
            <div style={s.summaryCard}>
              <div style={s.summaryLabel}>Abandoned</div>
              <div style={{ ...s.summaryValue, color: "#b36b00" }}>{summary.abandoned}</div>
            </div>
            <div style={s.summaryCard}>
              <div style={s.summaryLabel}>Orders</div>
              <div style={{ ...s.summaryValue, color: "#1a4fa0" }}>{summary.orders}</div>
            </div>
            <div style={s.summaryCard}>
              <div style={s.summaryLabel}>Loans</div>
              <div style={{ ...s.summaryValue, color: "#1a4fa0" }}>{summary.loans}</div>
            </div>
          </div>
        )}

        <div style={s.filterRow}>
          <select style={s.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="abandoned">Abandoned</option>
          </select>
          <input
            style={s.input}
            type="text"
            placeholder="Search by customer email..."
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          />
          <input
            style={s.dateInput}
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            title="From date"
          />
          <input
            style={s.dateInput}
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            title="To date"
          />
        </div>

        {loading && <p style={s.message}>Loading transactions...</p>}
        {error && <p style={s.errorMsg}>{error}</p>}

        {!loading && !error && transactions.length === 0 && (
          <div style={s.emptyBox}>
            <p style={s.emptyText}>No transactions found.</p>
          </div>
        )}

        {!loading && !error && transactions.length > 0 && (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Reference</th>
                  <th style={s.th}>Type</th>
                  <th style={s.th}>Customer</th>
                  <th style={s.th}>Amount</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Channel</th>
                  <th style={s.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td style={s.td}>
                      <span style={{ fontSize: 11, color: "#888" }}>{txn.reference}</span>
                    </td>
                    <td style={{ ...s.td, textTransform: "capitalize" }}>{txn.achoice_type}</td>
                    <td style={s.td}>
                      {txn.metadata?.buyer_name || txn.customer?.email || "-"}
                      {txn.metadata?.buyer_name && (
                        <div style={{ fontSize: 11, color: "#aaa" }}>{txn.customer?.email}</div>
                      )}
                    </td>
                    <td style={{ ...s.td, fontWeight: 700, color: "#1f4d1f" }}>{txn.formatted_amount}</td>
                    <td style={s.td}>
                      <span style={{ ...s.statusBadge, ...getStatusStyle(txn.status) }}>{txn.status}</span>
                    </td>
                    <td style={{ ...s.td, textTransform: "capitalize" }}>{txn.channel}</td>
                    <td style={s.td}>{txn.formatted_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && lastPage > 1 && (
          <div style={s.paginationRow}>
            <button
              style={page <= 1 ? s.pageBtnDisabled : s.pageBtn}
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              Prev
            </button>
            <span style={s.pageLabel}>
              Page {page} of {lastPage} ({meta.total} total)
            </span>
            <button
              style={page >= lastPage ? s.pageBtnDisabled : s.pageBtn}
              disabled={page >= lastPage}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", minHeight: "100vh", backgroundColor: "#f0f2f5", fontFamily: "Arial, sans-serif" },
  toast: {
    position: "fixed", top: 20, right: 20, background: "#1f4d1f", color: "#fff",
    padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  sidebar: {
    width: 240, background: "#1f4d1f", display: "flex", flexDirection: "column",
    position: "fixed", top: 0, left: 0, height: "100vh",
  },
  sidebarLogo: { display: "flex", alignItems: "center", gap: 10, padding: 20, borderBottom: "1px solid rgba(255,255,255,0.1)" },
  logoImg: { width: 40, height: 40, objectFit: "contain" },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: "#fff" },
  sidebarLogoSub: { fontSize: 10, color: "#a8d5a8" },
  sidebarNav: { flex: 1, padding: "16px 0" },
  sidebarItem: { display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", color: "#a8d5a8", fontSize: 14, cursor: "pointer" },
  sidebarItemActive: { background: "rgba(255,255,255,0.15)", color: "#fff", borderLeft: "3px solid #f0c050" },
  sidebarFooter: { padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" },
  logoutBtn: {
    width: "100%", padding: 8, background: "rgba(255,255,255,0.1)", color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
  },
  main: { flex: 1, marginLeft: 240, padding: 32 },
  topbar: { display: "flex", justifyContent: "flex-end", marginBottom: 16 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 },
  headerTitle: { fontSize: 24, fontWeight: 700, color: "#111", marginBottom: 4 },
  headerSub: { fontSize: 14, color: "#888" },
  exportBtn: {
    padding: "10px 20px", background: "#1f4d1f", color: "#fff", border: "none",
    borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  exportBtnDisabled: {
    padding: "10px 20px", background: "#ccc", color: "#fff", border: "none",
    borderRadius: 7, fontSize: 13, cursor: "not-allowed", fontFamily: "inherit",
  },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14, marginBottom: 24 },
  summaryCard: { background: "#fff", borderRadius: 10, border: "1px solid #e8e4dc", padding: "16px 18px" },
  summaryLabel: { fontSize: 11, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryValue: { fontSize: 20, fontWeight: 700 },
  filterRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 },
  select: {
    padding: "9px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13,
    fontFamily: "inherit", outline: "none", background: "#fff", cursor: "pointer",
  },
  input: {
    padding: "9px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13,
    fontFamily: "inherit", outline: "none", minWidth: 220,
  },
  dateInput: {
    padding: "9px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13,
    fontFamily: "inherit", outline: "none",
  },
  message: { textAlign: "center", color: "#666", padding: 40 },
  errorMsg: { textAlign: "center", color: "#cc0000", padding: 20 },
  emptyBox: { textAlign: "center", padding: "60px 0", background: "#fff", borderRadius: 10, border: "1px solid #e8e4dc" },
  emptyText: { fontSize: 15, color: "#888" },
  tableWrap: { background: "#fff", borderRadius: 10, border: "1px solid #e8e4dc", overflow: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    background: "#1f4d1f", color: "#fff", padding: "12px 16px", textAlign: "left",
    fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
  },
  td: { padding: "12px 16px", borderBottom: "1px solid #f0ece4", fontSize: 13, color: "#333", verticalAlign: "middle" },
  statusBadge: { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, textTransform: "capitalize" },
  paginationRow: { display: "flex", justifyContent: "center", alignItems: "center", gap: 16, padding: "24px 0" },
  pageBtn: {
    padding: "10px 20px", background: "#1f4d1f", color: "#fff", border: "none", borderRadius: 7,
    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  pageBtnDisabled: {
    padding: "10px 20px", background: "#f0f0f0", color: "#aaa", border: "none", borderRadius: 7,
    fontSize: 13, cursor: "not-allowed", fontFamily: "inherit",
  },
  pageLabel: { fontSize: 13, color: "#555", fontWeight: 500 },
};
