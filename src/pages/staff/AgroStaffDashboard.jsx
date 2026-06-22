import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const LOGO_PATH = '/achoice logo.png';

export default function AgroStaffDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState('');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [verifying, setVerifying] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [salesReport, setSalesReport] = useState([]);
  const [revenueReport, setRevenueReport] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState(null); // ✅ track errors
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  useEffect(() => {
    if (document.getElementById('asd-style')) return;
    const el = document.createElement('style');
    el.id = 'asd-style';
    el.textContent = `
      * { box-sizing:border-box; }
      body { margin:0; }
      .asd-page { display:flex; min-height:100vh; background:#f0f2f5; font-family:Arial,sans-serif; }
      .asd-toast { position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#1f4d1f; color:#fff; padding:12px 24px; border-radius:8px; font-size:14px; z-index:9999; box-shadow:0 4px 16px rgba(0,0,0,0.15); white-space:nowrap; max-width:90vw; text-align:center; }
      .asd-mobile-topbar { display:none; }
      .asd-sidebar { width:240px; background:#1f4d1f; display:flex; flex-direction:column; position:fixed; top:0; left:0; height:100vh; z-index:300; transition:transform .25s ease; }
      .asd-sidebar-logo { display:flex; align-items:center; gap:10px; padding:20px; border-bottom:1px solid rgba(255,255,255,0.1); }
      .asd-logo-img { width:40px; height:40px; object-fit:contain; }
      .asd-sidebar-logo-name { font-size:14px; font-weight:700; color:#fff; }
      .asd-sidebar-logo-sub  { font-size:10px; color:#a8d5a8; }
      .asd-sidebar-close { display:none; }
      .asd-sidebar-nav { flex:1; padding:16px 0; overflow-y:auto; }
      .asd-sidebar-item { display:flex; align-items:center; gap:10px; padding:12px 20px; color:#a8d5a8; font-size:14px; cursor:pointer; }
      .asd-sidebar-item-active { background:rgba(255,255,255,0.15); color:#fff; border-left:3px solid #f0c050; }
      .asd-sidebar-footer { padding:16px 20px; border-top:1px solid rgba(255,255,255,0.1); }
      .asd-staff-name { font-size:13px; font-weight:600; color:#fff; margin-bottom:2px; }
      .asd-staff-role { font-size:11px; color:#a8d5a8; margin-bottom:10px; }
      .asd-logout-btn { width:100%; padding:8px; background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; font-size:13px; cursor:pointer; font-family:inherit; }
      .asd-back-admin-btn { width:100%; padding:8px; background:#f0c050; color:#1a3d1a; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; margin-bottom:10px; }
      .asd-overlay { display:none; }
      .asd-main { flex:1; margin-left:240px; padding:32px; min-width:0; }
      .asd-page-title { font-size:24px; font-weight:700; color:#111; margin:0 0 6px; }
      .asd-page-sub   { font-size:14px; color:#888; margin:0 0 24px; }
      .asd-loading    { text-align:center; color:#888; padding:40px; }
      .asd-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
      .asd-stat-card  { background:#fff; border-radius:10px; border:1px solid #e8e4dc; padding:18px; }
      .asd-stat-top   { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
      .asd-stat-label { font-size:12px; color:#888; }
      .asd-stat-icon  { font-size:20px; }
      .asd-stat-value { font-size:22px; font-weight:700; }
      .asd-alert-box   { background:#fff8e7; border:1px solid #f0c050; border-radius:10px; padding:16px; margin-bottom:20px; }
      .asd-alert-title { font-size:14px; font-weight:700; color:#b36b00; margin-bottom:6px; }
      .asd-alert-text  { font-size:13px; color:#7a5c00; }
      .asd-alert-link  { color:#1f4d1f; font-weight:600; cursor:pointer; text-decoration:underline; }
      .asd-low-stock-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-top:10px; }
      .asd-low-stock-item { background:#fff; border-radius:6px; padding:10px 12px; border:1px solid #f0c050; }
      .asd-low-stock-name { font-size:12px; font-weight:600; color:#111; margin-bottom:4px; }
      .asd-low-stock-qty  { font-size:11px; color:#cc0000; font-weight:600; }
      .asd-controls-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
      .asd-filter-tabs   { display:flex; gap:8px; flex-wrap:wrap; }
      .asd-filter-tab        { padding:8px 14px; border:1px solid #ddd; border-radius:6px; font-size:13px; color:#555; cursor:pointer; background:#fff; font-family:inherit; }
      .asd-filter-tab-active { padding:8px 14px; border:1px solid #1f4d1f; border-radius:6px; font-size:13px; color:#fff; cursor:pointer; background:#1f4d1f; font-family:inherit; }
      .asd-tab-count   { margin-left:5px; background:rgba(255,255,255,0.3); font-size:11px; font-weight:700; padding:1px 5px; border-radius:99px; }
      .asd-search-input { padding:9px 16px; border:1px solid #ddd; border-radius:6px; font-size:13px; font-family:inherit; outline:none; min-width:220px; }
      .asd-order-card        { background:#fff; border-radius:10px; border:1px solid #e8e4dc; padding:20px; margin-bottom:14px; }
      .asd-order-card-unpaid { border:1px solid #ffa39e; }
      .asd-order-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:10px; }
      .asd-order-id   { font-size:15px; font-weight:700; color:#111; margin-bottom:4px; }
      .asd-order-meta { font-size:13px; color:#888; }
      .asd-order-right { text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:4px; }
      .asd-order-total { font-size:15px; font-weight:700; color:#1f4d1f; }
      .asd-status-badge  { font-size:11px; font-weight:600; padding:4px 10px; border-radius:99px; text-transform:capitalize; }
      .asd-payment-badge { font-size:11px; font-weight:600; padding:4px 10px; border-radius:99px; }
      .asd-unpaid-banner { background:#fff8e7; border:1px solid #f0c050; border-radius:8px; padding:10px 14px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
      .asd-unpaid-text { font-size:13px; color:#b36b00; flex:1; }
      .asd-verify-btn     { padding:7px 16px; background:#1f4d1f; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer; font-family:inherit; white-space:nowrap; }
      .asd-verify-btn-dis { padding:7px 16px; background:#ccc; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:not-allowed; font-family:inherit; }
      .asd-order-items { border-top:1px solid #eee; padding:10px 0; margin-bottom:10px; }
      .asd-order-item  { display:flex; gap:10px; align-items:center; margin-bottom:6px; flex-wrap:wrap; }
      .asd-item-name  { flex:1; font-size:13px; color:#333; min-width:120px; }
      .asd-item-qty   { font-size:12px; color:#888; }
      .asd-item-price { font-size:13px; font-weight:600; color:#1f4d1f; }
      .asd-action-row { display:flex; gap:10px; flex-wrap:wrap; }
      .asd-action-btn     { padding:8px 18px; background:#1f4d1f; color:#fff; border:none; border-radius:6px; font-size:13px; cursor:pointer; font-family:inherit; }
      .asd-action-btn-dis { padding:8px 18px; background:#ccc; color:#fff; border:none; border-radius:6px; font-size:13px; cursor:not-allowed; font-family:inherit; }
      .asd-cancel-btn     { padding:8px 18px; background:#fff; color:#cc0000; border:1px solid #cc0000; border-radius:6px; font-size:13px; cursor:pointer; font-family:inherit; }
      .asd-cancel-btn-dis { padding:8px 18px; background:#fff; color:#ccc; border:1px solid #ccc; border-radius:6px; font-size:13px; cursor:not-allowed; font-family:inherit; }
      .asd-shipped-note   { background:#e7f0ff; color:#1a4fa0; padding:8px 14px; border-radius:6px; font-size:13px; }
      .asd-delivered-note { background:#eafaf0; color:#1a7a3a; padding:8px 14px; border-radius:6px; font-size:13px; }
      .asd-empty { text-align:center; color:#888; padding:40px; }
      .asd-table-card { background:#fff; border-radius:12px; overflow:hidden; border:1px solid #e8e4dc; }
      .asd-table-scroll { overflow-x:auto; }
      .asd-table { width:100%; border-collapse:collapse; min-width:600px; }
      .asd-thead { background:#f7f5f0; border-bottom:2px solid #eee; }
      .asd-th { padding:12px 16px; text-align:left; font-size:11px; color:#666; text-transform:uppercase; letter-spacing:.5px; }
      .asd-trow { border-top:1px solid #f5f5f5; }
      .asd-td { padding:14px 16px; vertical-align:middle; font-size:13px; }
      .asd-product-name   { font-size:13px; font-weight:600; color:#111; }
      .asd-product-seller { font-size:11px; color:#888; margin-top:2px; }
      .asd-category-badge { background:#eef2ff; color:#4338ca; padding:3px 8px; border-radius:6px; font-size:11px; font-weight:600; }

      /* ── REPORTS ── */
      .asd-reports-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
      .asd-report-card  { background:#fff; border-radius:12px; border:1px solid #e8e4dc; padding:24px; }
      .asd-report-title { font-size:16px; font-weight:700; color:#111; margin-bottom:16px; }
      .asd-report-row   { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid #f5f5f5; }
      .asd-report-rank  { font-size:11px; font-weight:700; color:#c8860a; width:24px; flex-shrink:0; }
      .asd-report-info  { flex:1; min-width:0; }
      .asd-report-name  { font-size:13px; font-weight:600; color:#111; }
      .asd-report-meta  { font-size:11px; color:#888; margin-top:2px; }
      .asd-report-value { font-size:13px; font-weight:700; color:#1f4d1f; flex-shrink:0; }
      .asd-revenue-row     { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
      .asd-revenue-month   { font-size:12px; color:#555; width:40px; flex-shrink:0; }
      .asd-revenue-bar-bg  { flex:1; height:8px; background:#eee; border-radius:99px; overflow:hidden; }
      .asd-revenue-bar-fill { height:100%; background:#1f4d1f; border-radius:99px; }
      .asd-revenue-val { font-size:12px; font-weight:600; color:#1f4d1f; width:80px; text-align:right; flex-shrink:0; }
      .asd-report-error-box { background:#fff0f0; border:1px solid #ffb3b3; border-radius:10px; padding:18px; margin-bottom:20px; }
      .asd-report-error-title { font-size:14px; font-weight:700; color:#cc0000; margin-bottom:6px; }
      .asd-report-error-text { font-size:13px; color:#a83232; line-height:1.6; }
      .asd-retry-btn { margin-top:12px; padding:8px 18px; background:#1f4d1f; color:#fff; border:none; border-radius:6px; font-size:13px; cursor:pointer; font-family:inherit; }

      /* ════════════════ TABLET (≤ 900px) ════════════════ */
      @media (max-width:900px) {
        .asd-stats-grid { grid-template-columns:repeat(2,1fr); }
        .asd-reports-grid { grid-template-columns:1fr; }
        .asd-low-stock-grid { grid-template-columns:repeat(2,1fr); }
      }

      /* ════════════════ MOBILE (≤ 768px) ════════════════ */
      @media (max-width:768px) {
        .asd-mobile-topbar {
          display:flex; align-items:center; justify-content:space-between;
          background:#1f4d1f; padding:10px 14px; position:sticky; top:0; z-index:250;
          box-shadow:0 2px 8px rgba(0,0,0,0.12);
        }
        .asd-mobile-topbar-left { display:flex; align-items:center; gap:8px; min-width:0; flex:1; }
        .asd-mobile-logo { width:30px; height:30px; object-fit:contain; flex-shrink:0; }
        .asd-mobile-title { font-size:13px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .asd-hamburger-btn {
          background:rgba(255,255,255,0.15); border:none; color:#fff;
          width:40px; height:40px; border-radius:10px; font-size:20px;
          cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center;
          margin-left:auto;
        }
        .asd-hamburger-btn:active { background:rgba(255,255,255,0.28); }
        .asd-sidebar { transform:translateX(-100%); width:80%; max-width:280px; z-index:400; box-shadow:4px 0 24px rgba(0,0,0,0.2); }
        .asd-sidebar-open { transform:translateX(0); }
        .asd-sidebar-close { display:block; background:rgba(255,255,255,0.15); border:none; color:#fff; width:30px; height:30px; border-radius:50%; font-size:14px; cursor:pointer; margin-left:auto; }
        .asd-overlay { display:block; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:350; }
        .asd-main { margin-left:0; padding:16px; }
        .asd-page-title { font-size:20px; }
        .asd-stats-grid { grid-template-columns:1fr 1fr; gap:10px; }
        .asd-stat-card { padding:14px; }
        .asd-stat-value { font-size:18px; }
        .asd-low-stock-grid { grid-template-columns:1fr 1fr; }
        .asd-controls-row { flex-direction:column; align-items:stretch; }
        .asd-filter-tabs { overflow-x:auto; flex-wrap:nowrap; padding-bottom:4px; -webkit-overflow-scrolling:touch; }
        .asd-filter-tab, .asd-filter-tab-active { white-space:nowrap; flex-shrink:0; }
        .asd-search-input { width:100%; min-width:0; }
        .asd-order-card { padding:14px; }
        .asd-order-right { align-items:flex-start; text-align:left; }
        .asd-order-header { flex-direction:column; }
        .asd-action-row { flex-direction:column; }
        .asd-action-btn, .asd-action-btn-dis, .asd-cancel-btn, .asd-cancel-btn-dis { width:100%; text-align:center; }
        .asd-unpaid-banner { flex-direction:column; align-items:stretch; }
        .asd-verify-btn, .asd-verify-btn-dis { width:100%; }
        .asd-item-name { min-width:0; }
        .asd-report-card { padding:16px; }
      }

      @media (max-width:420px) {
        .asd-stats-grid { grid-template-columns:1fr 1fr; }
        .asd-low-stock-grid { grid-template-columns:1fr; }
      }
    `;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    api.get('/staff/agro/dashboard')
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      setOrdersLoading(true);
      api.get('/staff/agro/orders')
        .then(res => setOrders(res.data.data || res.data || []))
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
    if (activeTab === 'inventory') {
      setInventoryLoading(true);
      Promise.all([
        api.get('/staff/agro/inventory'),
        api.get('/staff/agro/inventory/low-stock'),
      ]).then(([invRes, lowRes]) => {
        setInventory(invRes.data.data || invRes.data || []);
        setLowStock(lowRes.data.data || lowRes.data || []);
      }).catch(() => {})
        .finally(() => setInventoryLoading(false));
    }
    if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab]);

  // ✅ Extracted into its own function so we can retry, and now surfaces real errors
  const loadReports = () => {
    setReportsLoading(true);
    setReportsError(null);
    Promise.all([
      api.get('/staff/agro/reports/sales'),
      api.get('/staff/agro/reports/revenue'),
    ]).then(([salesRes, revRes]) => {
      // ✅ Sales response shape: { period, top_products: [...], category_breakdown: {...} }
      const salesData = salesRes.data?.top_products || salesRes.data?.data || salesRes.data;
      setSalesReport(Array.isArray(salesData) ? salesData : []);

      // ✅ Revenue response — try common nesting patterns
      const revData = revRes.data?.monthly_revenue || revRes.data?.monthly || revRes.data?.data || revRes.data;
      setRevenueReport(Array.isArray(revData) ? revData : []);
    }).catch(err => {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      setReportsError(`${status ? `${status}: ` : ''}${msg || 'Failed to load reports.'}`);
      setSalesReport([]);
      setRevenueReport([]);
    }).finally(() => setReportsLoading(false));
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await api.patch(`/staff/agro/orders/${orderId}/status`, { status });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
      showToast(`Order status updated to ${status}!`);
    } catch {
      showToast('Failed to update order status.');
    } finally {
      setUpdating(null);
    }
  };

  const handleVerifyPayment = async (orderId, reference) => {
    const ref = reference || window.prompt('Enter Paystack payment reference:');
    if (!ref) return;
    setVerifying(orderId);
    try {
      const res = await api.post(`/admin/orders/${orderId}/verify-payment`, { reference: ref });
      showToast(res.data?.message || 'Payment verified! Order confirmed.');
      const r = await api.get('/staff/agro/orders');
      setOrders(r.data.data || r.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Verification failed.');
    } finally {
      setVerifying(null);
    }
  };

  const getStatusStyle = (status) => ({
    pending:    { background: '#fff8e7', color: '#b36b00' },
    processing: { background: '#e7f0ff', color: '#1a4fa0' },
    shipped:    { background: '#e7f7ff', color: '#0077aa' },
    delivered:  { background: '#eafaf0', color: '#1a7a3a' },
    cancelled:  { background: '#fff0f0', color: '#cc0000' },
  }[status] || { background: '#f0f0f0', color: '#555' });

  const toMoney = (val) => `₦${Number(val || 0).toLocaleString()}`;

  const filteredOrders = orders.filter(o => {
    const matchFilter = orderFilter === 'all' || o.status === orderFilter;
    const matchSearch = !orderSearch ||
      (o.order_number || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.buyer?.name || '').toLowerCase().includes(orderSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filteredInventory = inventory.filter(p =>
    !inventorySearch ||
    p.name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    p.seller?.business_name?.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="asd-page">
      {toast && <div className="asd-toast">{toast}</div>}

      <div className="asd-mobile-topbar">
        <div className="asd-mobile-topbar-left">
          <img src={LOGO_PATH} alt="Achoice" className="asd-mobile-logo" />
          <span className="asd-mobile-title">ACHOICE Agro Staff</span>
        </div>
        <button className="asd-hamburger-btn" onClick={() => setSidebarOpen(true)}>☰</button>
      </div>

      {sidebarOpen && <div className="asd-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className={`asd-sidebar ${sidebarOpen ? 'asd-sidebar-open' : ''}`}>
        <div className="asd-sidebar-logo">
          <img src={LOGO_PATH} alt="Achoice" className="asd-logo-img" />
          <div style={{ flex: 1 }}>
            <div className="asd-sidebar-logo-name">ACHOICE</div>
            <div className="asd-sidebar-logo-sub">Agro/Sales Staff</div>
          </div>
          <button className="asd-sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="asd-sidebar-nav">
          {[
            { icon: '📊', label: 'Dashboard', tab: 'dashboard' },
            { icon: '📦', label: 'Orders', tab: 'orders' },
            { icon: '🌾', label: 'Inventory', tab: 'inventory' },
            { icon: '📈', label: 'Reports', tab: 'reports' },
          ].map(item => (
            <div key={item.tab}
              className={`asd-sidebar-item ${activeTab === item.tab ? 'asd-sidebar-item-active' : ''}`}
              onClick={() => handleTabClick(item.tab)}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
        {user?.role === 'admin' && (
          <div style={{ padding: '0 20px' }}>
            <button className="asd-back-admin-btn" onClick={() => navigate('/admin/dashboard')}>
              ← Admin Panel
            </button>
          </div>
        )}
        <div className="asd-sidebar-footer">
          <div className="asd-staff-name">{user?.name}</div>
          <div className="asd-staff-role">Agro/Sales Staff</div>
          <button className="asd-logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>
            Logout
          </button>
        </div>
      </div>

      <div className="asd-main">

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 className="asd-page-title">Agro/Sales Dashboard</h1>
            <p className="asd-page-sub">Welcome back, {user?.name?.split(' ')[0]}. Here's today's overview.</p>
            {stats ? (
              <>
                <div className="asd-stats-grid">
                  {[
                    { label: 'Total Orders', value: stats.orders?.total || 0, icon: '📦', color: '#1f4d1f' },
                    { label: 'Pending Orders', value: stats.orders?.pending || 0, icon: '⏳', color: '#b36b00' },
                    { label: 'Processing', value: stats.orders?.processing || 0, icon: '⚙️', color: '#1a4fa0' },
                    { label: 'Delivered', value: stats.orders?.delivered || 0, icon: '✅', color: '#1a7a3a' },
                    { label: 'Total Products', value: stats.inventory?.total_products || 0, icon: '🌾', color: '#c8860a' },
                    { label: 'Low Stock', value: stats.inventory?.low_stock || 0, icon: '⚠️', color: '#cc0000' },
                    { label: 'Out of Stock', value: stats.inventory?.out_of_stock || 0, icon: '❌', color: '#cc0000' },
                    { label: "Today's Revenue", value: `₦${Number(stats.revenue?.today || 0).toLocaleString()}`, icon: '💵', color: '#1f4d1f' },
                    { label: "Total Revenue", value: `₦${Number(stats.revenue?.total || 0).toLocaleString()}`, icon: '💰', color: '#1a7a3a' },
                  ].map(stat => (
                    <div key={stat.label} className="asd-stat-card">
                      <div className="asd-stat-top">
                        <div className="asd-stat-label">{stat.label}</div>
                        <div className="asd-stat-icon">{stat.icon}</div>
                      </div>
                      <div className="asd-stat-value" style={{ color: stat.color }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
                {stats.low_stock_count > 0 && (
                  <div className="asd-alert-box">
                    <div className="asd-alert-title">⚠️ Low Stock Alert</div>
                    <div className="asd-alert-text">
                      {stats.low_stock_count} product{stats.low_stock_count !== 1 ? 's are' : ' is'} running low.
                      <span className="asd-alert-link" onClick={() => setActiveTab('inventory')}> View Inventory</span>
                    </div>
                  </div>
                )}
              </>
            ) : <p className="asd-loading">Loading dashboard...</p>}
          </div>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <div>
            <h1 className="asd-page-title">Order Management</h1>
            <div className="asd-controls-row">
              <div className="asd-filter-tabs">
                {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(tab => (
                  <button key={tab}
                    className={orderFilter === tab ? 'asd-filter-tab-active' : 'asd-filter-tab'}
                    onClick={() => setOrderFilter(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab !== 'all' && orders.filter(o => o.status === tab).length > 0 && (
                      <span className="asd-tab-count">{orders.filter(o => o.status === tab).length}</span>
                    )}
                  </button>
                ))}
              </div>
              <input
                className="asd-search-input"
                type="text"
                placeholder="Search order or buyer..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
              />
            </div>

            {ordersLoading && <p className="asd-loading">Loading orders...</p>}

            {filteredOrders.map(order => {
              const isUnpaid = order.status === 'pending' && order.payment_status === 'unpaid';
              return (
                <div key={order.id} className={`asd-order-card ${isUnpaid ? 'asd-order-card-unpaid' : ''}`}>
                  <div className="asd-order-header">
                    <div>
                      <div className="asd-order-id">{order.order_number || `Order #${order.id}`}</div>
                      <div className="asd-order-meta">
                        {order.buyer?.name} — {order.delivery_address}, {order.delivery_state}
                        {' · '}{new Date(order.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="asd-order-right">
                      <div className="asd-status-badge" style={getStatusStyle(order.status)}>{order.status}</div>
                      <div className="asd-payment-badge" style={{
                        background: order.payment_status === 'paid' ? '#eafaf0' : '#fff0f0',
                        color: order.payment_status === 'paid' ? '#1a7a3a' : '#cc0000',
                      }}>
                        {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </div>
                      <div className="asd-order-total">{toMoney(order.total_amount || order.total)}</div>
                    </div>
                  </div>

                  {isUnpaid && (
                    <div className="asd-unpaid-banner">
                      <div className="asd-unpaid-text">Payment not verified — buyer may have paid via Paystack</div>
                      <button
                        className={verifying === order.id ? 'asd-verify-btn-dis' : 'asd-verify-btn'}
                        onClick={() => handleVerifyPayment(order.id, order.payment_reference)}
                        disabled={verifying === order.id}
                      >
                        {verifying === order.id ? 'Verifying...' : 'Verify Payment'}
                      </button>
                    </div>
                  )}

                  {order.items?.length > 0 && (
                    <div className="asd-order-items">
                      {order.items.map((item, i) => (
                        <div key={i} className="asd-order-item">
                          <span className="asd-item-name">{item.product_name || item.product?.name}</span>
                          <span className="asd-item-qty">×{item.quantity}</span>
                          <span className="asd-item-price">{toMoney(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="asd-action-row">
                    {order.status === 'pending' && order.payment_status === 'paid' && (
                      <button className={updating === order.id ? 'asd-action-btn-dis' : 'asd-action-btn'}
                        onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                        disabled={updating === order.id}>
                        {updating === order.id ? 'Updating...' : 'Mark as Processing'}
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <button className={updating === order.id ? 'asd-action-btn-dis' : 'asd-action-btn'}
                        onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                        disabled={updating === order.id}>
                        {updating === order.id ? 'Updating...' : 'Mark as Shipped'}
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <div className="asd-shipped-note">Waiting for buyer to confirm delivery</div>
                    )}
                    {order.status === 'delivered' && (
                      <div className="asd-delivered-note">Order delivered and completed</div>
                    )}
                    {(order.status === 'pending' || order.status === 'processing') && (
                      <button className={updating === order.id ? 'asd-cancel-btn-dis' : 'asd-cancel-btn'}
                        onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                        disabled={updating === order.id}>
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {!ordersLoading && filteredOrders.length === 0 && (
              <div className="asd-empty">No {orderFilter === 'all' ? '' : orderFilter} orders found.</div>
            )}
          </div>
        )}

        {/* Inventory */}
        {activeTab === 'inventory' && (
          <div>
            <h1 className="asd-page-title">Inventory Management</h1>

            <input
              className="asd-search-input"
              style={{ width: '100%', maxWidth: 400, marginBottom: 16 }}
              type="text"
              placeholder="Search product, category or seller..."
              value={inventorySearch}
              onChange={e => setInventorySearch(e.target.value)}
            />

            {lowStock.length > 0 && (
              <div className="asd-alert-box">
                <div className="asd-alert-title">⚠️ Low Stock Products ({lowStock.length})</div>
                <div className="asd-low-stock-grid">
                  {lowStock.map(p => (
                    <div key={p.id} className="asd-low-stock-item">
                      <div className="asd-low-stock-name">{p.name}</div>
                      <div className="asd-low-stock-qty">{p.quantity} {p.unit} left</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inventoryLoading && <p className="asd-loading">Loading inventory...</p>}

            <div className="asd-table-card">
              <div className="asd-table-scroll">
                <table className="asd-table">
                  <thead>
                    <tr className="asd-thead">
                      <th className="asd-th">Product</th>
                      <th className="asd-th">Category</th>
                      <th className="asd-th">Price</th>
                      <th className="asd-th">Stock</th>
                      <th className="asd-th">Sold</th>
                      <th className="asd-th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map(p => (
                      <tr key={p.id} className="asd-trow">
                        <td className="asd-td">
                          <div className="asd-product-name">{p.name}</div>
                          <div className="asd-product-seller">{p.seller?.business_name}</div>
                        </td>
                        <td className="asd-td"><span className="asd-category-badge">{p.category}</span></td>
                        <td className="asd-td">{toMoney(p.price)}</td>
                        <td className="asd-td">
                          <div style={{
                            fontWeight: 600,
                            color: p.quantity === 0 ? '#cc0000' : p.quantity < 10 ? '#b36b00' : '#1a7a3a'
                          }}>
                            {p.quantity} {p.unit}
                          </div>
                        </td>
                        <td className="asd-td">{p.items_sold || p.reviews_count || 0}</td>
                        <td className="asd-td">
                          <span className="asd-status-badge" style={{
                            background: p.status === 'available' ? '#eafaf0' : '#fff0f0',
                            color: p.status === 'available' ? '#1a7a3a' : '#cc0000',
                          }}>
                            {p.status?.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredInventory.length === 0 && !inventoryLoading && (
                <div className="asd-empty">No products found.</div>
              )}
            </div>
          </div>
        )}

        {/* Reports */}
        {activeTab === 'reports' && (
          <div>
            <h1 className="asd-page-title">Sales Reports</h1>

            {reportsLoading && <p className="asd-loading">Loading reports...</p>}

            {/* ✅ Show the real error instead of a silent blank page */}
            {reportsError && !reportsLoading && (
              <div className="asd-report-error-box">
                <div className="asd-report-error-title">⛔ Could Not Load Reports</div>
                <div className="asd-report-error-text">{reportsError}</div>
                <button className="asd-retry-btn" onClick={loadReports}>🔄 Retry</button>
              </div>
            )}

            {!reportsLoading && !reportsError && (
              <div className="asd-reports-grid">
                <div className="asd-report-card">
                  <h2 className="asd-report-title">Top Selling Products</h2>
                  {salesReport.length === 0 ? (
                    <p className="asd-empty">No sales data yet.</p>
                  ) : (
                    salesReport.map((p, i) => (
                      <div key={p.id || i} className="asd-report-row">
                        <div className="asd-report-rank">#{i + 1}</div>
                        <div className="asd-report-info">
                          <div className="asd-report-name">{p.name}</div>
                          <div className="asd-report-meta">{p.category} · {p.items_sold || 0} sold</div>
                        </div>
                        <div className="asd-report-value">{toMoney(p.revenue || p.total_revenue)}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="asd-report-card">
                  <h2 className="asd-report-title">Monthly Revenue</h2>
                  {revenueReport.length === 0 ? (
                    <p className="asd-empty">No revenue data yet.</p>
                  ) : (
                    revenueReport.map((r, i) => {
                      const maxRev = Math.max(...revenueReport.map(x => Number(x.revenue || x.total || 0)));
                      const pct = maxRev > 0 ? (Number(r.revenue || r.total || 0) / maxRev) * 100 : 0;
                      return (
                        <div key={i} className="asd-revenue-row">
                          <div className="asd-revenue-month">{r.month || r.label}</div>
                          <div className="asd-revenue-bar-bg">
                            <div className="asd-revenue-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="asd-revenue-val">{toMoney(r.revenue || r.total)}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}