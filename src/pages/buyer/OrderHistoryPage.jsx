import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMyOrders, confirmDelivery } from '../../services/orderService';
import api from '../../services/api';
import BuyerDropdown from '../../components/buyer/BuyerDropdown';

const LOGO_PATH = '/achoice logo.png';
const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

function OrderTracker({ status }) {
  const cur = STATUS_STEPS.indexOf(status);
  return (
    <div className="oht-tracker">
      {STATUS_STEPS.map((step, i) => (
        <div key={step} className="oht-tracker-step">
          <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
            <div className="oht-tracker-dot" style={{
              background: i <= cur ? '#1f4d1f' : '#e0e0e0',
              border: i === cur ? '3px solid #f0c050' : '3px solid transparent',
              boxShadow: i === cur ? '0 0 0 3px rgba(240,192,80,0.25)' : 'none',
            }}>
              {i < cur ? '✓' : i + 1}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className="oht-tracker-line"
                style={{ background: i < cur ? '#1f4d1f' : '#e0e0e0' }} />
            )}
          </div>
          <div className="oht-tracker-label" style={{
            color: i === cur ? '#1f4d1f' : i < cur ? '#555' : '#aaa',
            fontWeight: i === cur ? 700 : 400,
          }}>
            {step.charAt(0).toUpperCase() + step.slice(1)}
            {i === cur && <div className="oht-tracker-current">● Now</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrderHistoryPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [toast, setToast]                 = useState({ msg:'', type:'success' });
  const [cartCount, setCartCount]         = useState(0);
  const [search, setSearch]               = useState('');
  const [filter, setFilter]               = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (document.getElementById('oht-style')) return;
    const el = document.createElement('style');
    el.id = 'oht-style';
    el.textContent = `
      * { box-sizing:border-box; }
      body { margin:0; }
      .oht-wrap { min-height:100vh; background:#f7f5f0; font-family:Arial,sans-serif; display:flex; flex-direction:column; }

      /* ── TOP BAR ── */
      .oht-topbar { background:#1f4d1f; color:#fff; padding:7px 48px; display:flex; justify-content:space-between; font-size:12px; flex-wrap:wrap; gap:4px; align-items:center; }
      .oht-topbar-right { display:flex; gap:16px; }

      /* ── NAV ── */
      .oht-nav { background:#1a3d1a; padding:12px 48px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:200; gap:12px; }
      .oht-nav-brand { display:flex; align-items:center; gap:10px; cursor:pointer; flex-shrink:0; }
      .oht-nav-logo  { width:40px; height:40px; object-fit:contain; }
      .oht-nav-name  { font-size:14px; font-weight:700; color:#fff; line-height:1.2; }
      .oht-nav-tag   { font-size:10px; color:#a8d5a8; }
      .oht-nav-links { display:flex; gap:24px; align-items:center; }
      .oht-nav-link  { color:#fff; font-size:14px; cursor:pointer; }
      .oht-nav-link:hover { color:#f0c050; }
      .oht-cart-badge { background:#f0c050; color:#1a1a1a; font-size:10px; font-weight:700; border-radius:50%; padding:1px 5px; margin-left:4px; }

      /* ── TOAST ── */
      .oht-toast { position:fixed; top:20px; left:50%; transform:translateX(-50%); padding:14px 28px; border-radius:10px; font-size:14px; font-weight:600; z-index:9999; box-shadow:0 6px 24px rgba(0,0,0,0.15); white-space:nowrap; max-width:90vw; text-align:center; }
      .oht-toast-success { background:#1f4d1f; color:#fff; border:1px solid #f0c050; }
      .oht-toast-error   { background:#cc0000; color:#fff; }

      /* ── PAYMENT SUCCESS BANNER ── */
      .oht-pay-success-banner { background:linear-gradient(135deg,#1f4d1f,#2d6b2d); color:#fff; margin:16px 48px; border-radius:14px; padding:20px 24px; display:flex; align-items:center; gap:16px; box-shadow:0 4px 20px rgba(0,0,0,0.15); }
      .oht-pay-success-icon   { font-size:40px; flex-shrink:0; }
      .oht-pay-success-title  { font-size:17px; font-weight:700; margin-bottom:4px; }
      .oht-pay-success-sub    { font-size:13px; color:#a8d5a8; line-height:1.5; }

      /* ── CONTAINER ── */
      .oht-container { max-width:900px; margin:0 auto; padding:28px 48px; flex:1; width:100%; }
      .oht-page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:22px; flex-wrap:wrap; gap:12px; }
      .oht-page-title  { font-size:26px; font-weight:700; color:#111; margin:0 0 4px; }
      .oht-page-sub    { font-size:14px; color:#888; margin:0; }
      .oht-shop-btn    { padding:10px 20px; background:#1f4d1f; color:#fff; border:none; border-radius:8px; font-size:14px; cursor:pointer; font-family:inherit; font-weight:600; white-space:nowrap; }

      /* ── STATUS SUMMARY CARDS ── */
      .oht-status-summary { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:22px; }
      .oht-stat-card { background:#fff; border-radius:10px; border:1px solid #e8e4dc; padding:12px 10px; text-align:center; cursor:pointer; transition:all .2s; }
      .oht-stat-card:hover { box-shadow:0 2px 10px rgba(0,0,0,0.08); }
      .oht-stat-card-active { background:#1f4d1f; border-color:#1f4d1f; }
      .oht-stat-icon  { font-size:20px; margin-bottom:4px; }
      .oht-stat-count { font-size:20px; font-weight:700; color:#111; line-height:1; margin-bottom:2px; }
      .oht-stat-card-active .oht-stat-count { color:#f0c050; }
      .oht-stat-label { font-size:10px; color:#888; text-transform:uppercase; letter-spacing:.5px; font-weight:600; }
      .oht-stat-card-active .oht-stat-label { color:#a8d5a8; }

      /* ── SEARCH BAR ── */
      .oht-search-bar { display:flex; gap:10px; margin-bottom:18px; }
      .oht-search-input { flex:1; padding:11px 16px; border:1.5px solid #ddd; border-radius:9px; font-size:14px; font-family:inherit; outline:none; transition:border .2s; }
      .oht-search-input:focus { border-color:#1f4d1f; }

      /* ── MESSAGES ── */
      .oht-msg     { text-align:center; color:#666; padding:48px; font-size:15px; }
      .oht-err-msg { text-align:center; color:#cc0000; padding:48px; font-size:14px; background:#fff0f0; border-radius:10px; border:1px solid #ffb3b3; }
      .oht-empty { background:#fff; border-radius:14px; border:2px dashed #c5ddb8; padding:60px 16px; text-align:center; }
      .oht-empty-icon  { font-size:56px; margin-bottom:14px; }
      .oht-empty-title { font-size:20px; font-weight:700; color:#111; margin:0 0 8px; }
      .oht-empty-text  { font-size:14px; color:#666; margin:0 0 24px; }
      .oht-empty-btn   { background:#1f4d1f; color:#fff; border:none; padding:12px 28px; border-radius:8px; font-size:15px; cursor:pointer; font-family:inherit; font-weight:600; }

      /* ── ORDER CARD ── */
      .oht-card { background:#fff; border-radius:14px; border:1px solid #e8e4dc; margin-bottom:16px; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,0.04); }
      .oht-card-header { padding:18px 22px; border-bottom:1px solid #f0f0f0; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; }
      .oht-order-id   { font-size:15px; font-weight:700; color:#111; margin-bottom:3px; }
      .oht-order-date { font-size:13px; color:#888; }
      .oht-header-right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
      .oht-status-badge { font-size:12px; font-weight:700; padding:6px 14px; border-radius:99px; }
      .oht-toggle-btn { padding:7px 14px; background:#f7f5f0; border:1px solid #e8e4dc; border-radius:7px; font-size:12px; cursor:pointer; font-family:inherit; color:#333; font-weight:600; }

      /* ── QUICK INFO STRIP ── */
      .oht-quick-strip { display:grid; grid-template-columns:repeat(4,1fr); background:#f9f9f9; border-bottom:1px solid #f0f0f0; }
      .oht-strip-item  { padding:12px 16px; border-right:1px solid #f0f0f0; }
      .oht-strip-item:last-child { border-right:none; }
      .oht-strip-label { font-size:10px; color:#aaa; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
      .oht-strip-val   { font-size:14px; font-weight:600; color:#111; }

      /* ── PAYMENT ALERT (inside card) ── */
      .oht-pay-alert { margin:14px 22px; background:#fff8e7; border:1px solid #f0c050; border-radius:9px; padding:14px 16px; display:flex; align-items:center; gap:12px; }
      .oht-pay-alert-icon { font-size:24px; flex-shrink:0; }
      .oht-pay-alert-title { font-size:14px; font-weight:700; color:#b36b00; margin-bottom:3px; }
      .oht-pay-alert-sub   { font-size:12px; color:#7a5c00; }

      /* ── EXPANDED SECTION ── */
      .oht-expanded { padding:20px 22px; display:flex; flex-direction:column; gap:20px; border-top:1px solid #f0f0f0; }
      .oht-section-title { font-size:14px; font-weight:700; color:#333; margin-bottom:12px; display:flex; align-items:center; gap:6px; }

      /* ── TRACKER ── */
      .oht-tracker       { display:flex; align-items:flex-start; justify-content:space-between; padding:8px 0 4px; }
      .oht-tracker-step  { display:flex; flex-direction:column; align-items:center; flex:1; }
      .oht-tracker-dot   { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; font-weight:700; flex-shrink:0; transition:all .3s; }
      .oht-tracker-line  { flex:1; height:4px; margin-top:0; border-radius:2px; }
      .oht-tracker-label { font-size:11px; text-align:center; margin-top:7px; line-height:1.3; }
      .oht-tracker-current { font-size:9px; color:#f0c050; font-weight:700; margin-top:2px; }

      /* ── ORDER ITEMS ── */
      .oht-order-item { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #f5f5f5; }
      .oht-order-item:last-child { border-bottom:none; }
      .oht-item-img  { width:56px; height:56px; background:#f7f5f0; border-radius:9px; overflow:hidden; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
      .oht-item-img img { width:100%; height:100%; object-fit:cover; }
      .oht-item-info  { flex:1; min-width:0; }
      .oht-item-name  { font-size:14px; font-weight:600; color:#111; margin-bottom:3px; }
      .oht-item-meta  { font-size:12px; color:#888; }
      .oht-item-seller { font-size:11px; color:#1f4d1f; font-weight:600; margin-top:3px; }
      .oht-item-total { font-size:15px; font-weight:700; color:#1f4d1f; flex-shrink:0; }

      /* ── DELIVERY INFO ── */
      .oht-delivery-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; background:#f9f9f9; border-radius:10px; padding:16px; }
      .oht-del-label { font-size:10px; color:#888; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
      .oht-del-val   { font-size:14px; color:#111; font-weight:500; }

      /* ── ORDER TOTAL BREAKDOWN ── */
      .oht-price-breakdown { background:#f0f7ec; border:1px solid #c5ddb8; border-radius:10px; padding:14px 16px; }
      .oht-price-row  { display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px; color:#555; }
      .oht-price-row:last-child { margin-bottom:0; padding-top:8px; border-top:1px solid #c5ddb8; font-size:16px; font-weight:700; color:#1f4d1f; }

      /* ── ACTIONS ── */
      .oht-action-row { display:flex; gap:12px; flex-wrap:wrap; }
      .oht-confirm-btn    { flex:1; padding:14px; background:#1f4d1f; color:#fff; border:none; border-radius:9px; font-size:14px; cursor:pointer; font-family:inherit; font-weight:700; text-align:center; }
      .oht-delivered-note { flex:1; padding:12px 16px; background:#eafaf0; color:#1a7a3a; border-radius:9px; font-size:13px; font-weight:600; text-align:center; border:1px solid #a8d5a8; }
      .oht-cancelled-note { flex:1; padding:12px 16px; background:#fff0f0; color:#cc0000; border-radius:9px; font-size:13px; text-align:center; border:1px solid #ffb3b3; }
      .oht-reorder-btn    { padding:14px 22px; background:#fff; color:#1f4d1f; border:2px solid #1f4d1f; border-radius:9px; font-size:14px; cursor:pointer; font-family:inherit; font-weight:700; }

      /* ── FOOTER ── */
      .oht-footer { background:#1f4d1f; padding:18px 48px; margin-top:auto; }
      .oht-footer-bottom { display:flex; justify-content:space-between; font-size:12px; color:#a8d5a8; flex-wrap:wrap; gap:6px; }

      /* ════════════════════════════════
         TABLET  (≤ 768px)
         ════════════════════════════════ */
      @media (max-width:768px) {
        .oht-topbar { padding:6px 16px; font-size:11px; }
        .oht-topbar-right { display:none; }
        .oht-nav { padding:10px 16px; }
        .oht-nav-links { display:none; }
        .oht-pay-success-banner { margin:12px 16px; }
        .oht-container { padding:16px; }
        .oht-status-summary { grid-template-columns:repeat(5,1fr); gap:8px; }
        .oht-stat-card { padding:10px 6px; }
        .oht-stat-icon  { font-size:16px; }
        .oht-stat-count { font-size:17px; }
        .oht-stat-label { font-size:9px; }
        .oht-quick-strip { grid-template-columns:repeat(2,1fr); }
        .oht-strip-item:nth-child(2) { border-right:none; }
        .oht-strip-item:nth-child(3) { border-top:1px solid #f0f0f0; }
        .oht-strip-item:nth-child(4) { border-top:1px solid #f0f0f0; border-right:none; }
        .oht-footer { padding:16px; }
      }

      /* ════════════════════════════════
         MOBILE  (≤ 540px)
         ════════════════════════════════ */
      @media (max-width:540px) {
        .oht-nav { padding:8px 12px; }
        .oht-nav-logo { width:34px; height:34px; }
        .oht-nav-name { font-size:13px; }

        /* Payment success banner */
        .oht-pay-success-banner { flex-direction:column; text-align:center; gap:10px; padding:16px; }
        .oht-pay-success-icon { font-size:48px; }
        .oht-pay-success-title { font-size:16px; }

        /* Page header */
        .oht-page-header { flex-direction:column; align-items:flex-start; gap:10px; }
        .oht-shop-btn { width:100%; }

        /* Status summary — 3+2 layout */
        .oht-status-summary { grid-template-columns:repeat(3,1fr); }

        /* Search */
        .oht-search-input { font-size:16px; }

        /* Card header */
        .oht-card-header { padding:14px; flex-direction:column; gap:10px; }
        .oht-header-right { width:100%; justify-content:space-between; }
        .oht-order-id { font-size:14px; }

        /* Quick strip — 2 col */
        .oht-quick-strip { grid-template-columns:1fr 1fr; }
        .oht-strip-item { padding:10px 14px; }
        .oht-strip-val { font-size:13px; }

        /* Payment alert */
        .oht-pay-alert { margin:12px 14px; padding:12px; }
        .oht-pay-alert-title { font-size:13px; }

        /* Expanded */
        .oht-expanded { padding:14px; gap:16px; }

        /* Tracker — bigger dots + labels on mobile */
        .oht-tracker { padding:6px 0 2px; }
        .oht-tracker-dot { width:28px; height:28px; font-size:11px; }
        .oht-tracker-label { font-size:10px; }
        .oht-tracker-current { font-size:8px; }

        /* Items */
        .oht-item-img  { width:50px; height:50px; }
        .oht-item-name { font-size:13px; }
        .oht-item-total { font-size:14px; }

        /* Delivery — 1 col on mobile */
        .oht-delivery-grid { grid-template-columns:1fr; gap:10px; padding:12px; }

        /* Price breakdown */
        .oht-price-row { font-size:13px; }
        .oht-price-row:last-child { font-size:15px; }

        /* Actions — full width stack */
        .oht-action-row { flex-direction:column; }
        .oht-confirm-btn, .oht-reorder-btn,
        .oht-delivered-note, .oht-cancelled-note { width:100%; }

        .oht-footer-bottom { flex-direction:column; text-align:center; }
      }

      @media (max-width:360px) {
        .oht-status-summary { grid-template-columns:repeat(3,1fr); gap:6px; }
        .oht-stat-label { display:none; }
        .oht-stat-count { font-size:15px; }
      }
    `;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((acc, item) => acc + (item.quantity || 0), 0));

    const params   = new URLSearchParams(location.search);
    const urlRef   = params.get('reference') || params.get('trxref');
    const savedRef = localStorage.getItem('last_order_reference');
    const reference = urlRef || savedRef;

    if (reference) {
      localStorage.removeItem('last_order_reference');
      window.history.replaceState({}, '', '/orders');
      api.post('/orders/verify-payment', { reference })
        .then(res => showToast(res.data?.message || '✅ Payment verified! Your order is confirmed.', 'success'))
        .catch(() => showToast('Payment verification pending. Check your order below.', 'error'));
    }

    getMyOrders()
      .then(res => {
        const raw = res.data;
        const list = raw?.data || (Array.isArray(raw) ? raw : []);
        setOrders(list);
        // Auto-expand the most recent order
        if (list.length > 0 && reference) setExpandedOrder(list[0].id);
      })
      .catch(() => setError('Failed to load orders. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:'', type:'success' }), 4000);
  };

  const handleConfirmDelivery = async (orderId) => {
    if (!window.confirm('Confirm that you have received this order?')) return;
    try {
      await confirmDelivery(orderId);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status:'delivered' } : o));
      showToast('✅ Delivery confirmed! Thank you.');
    } catch { showToast('Failed to confirm delivery.', 'error'); }
  };

  const statusConfig = {
    pending:    { bg:'#fff8e7', color:'#b36b00', icon:'⏳' },
    processing: { bg:'#e7f0ff', color:'#1a4fa0', icon:'⚙️' },
    shipped:    { bg:'#e7f7ff', color:'#0077aa', icon:'🚚' },
    delivered:  { bg:'#eafaf0', color:'#1a7a3a', icon:'✅' },
    cancelled:  { bg:'#fff0f0', color:'#cc0000', icon:'✕' },
  };

  const getStatusStyle = (status) => statusConfig[status] || { bg:'#f0f0f0', color:'#555', icon:'📦' };

  const getProductImage = (item) =>
    item.product?.images?.[0]?.image_url ||
    item.product?.images?.[0]?.url ||
    item.product?.image ||
    item.product_image || null;

  const getOrderTotal = (order) =>
    Number(order.total_amount || order.total || order.grand_total || 0);

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-NG', { year:'numeric', month:'short', day:'numeric' });

  // Status counts for summary cards
  const counts = ['all','pending','processing','shipped','delivered','cancelled']
    .reduce((acc, s) => ({ ...acc, [s]: s === 'all' ? orders.length : orders.filter(o => o.status === s).length }), {});

  const statCards = [
    { key:'all',        icon:'📦', label:'All' },
    { key:'pending',    icon:'⏳', label:'Pending' },
    { key:'processing', icon:'⚙️', label:'Processing' },
    { key:'shipped',    icon:'🚚', label:'Shipped' },
    { key:'delivered',  icon:'✅', label:'Delivered' },
  ];

  const filtered = orders.filter(o => {
    const matchSearch = !search || (o.order_number||`Order #${o.id}`).toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || o.status === filter;
    return matchSearch && matchFilter;
  });

  // Check if latest order just came back from Paystack
  const justPaid = new URLSearchParams(location.search).get('reference') ||
    new URLSearchParams(location.search).get('trxref');

  return (
    <div className="oht-wrap">
      {toast.msg && (
        <div className={`oht-toast ${toast.type === 'error' ? 'oht-toast-error' : 'oht-toast-success'}`}>
          {toast.msg}
        </div>
      )}

      {/* Top Bar */}
      <div className="oht-topbar">
        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          <span>📍 No 6 faith avenue off ekenwan Rd Benin City</span>
          <span>✉ support@achoice.ng</span>
        </div>
        <div className="oht-topbar-right">
          <span>📞 09067794991</span>
          <span>Mon-Sat: 07:00am-06:00pm</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="oht-nav">
        <div className="oht-nav-brand" onClick={() => navigate('/')}>
          <img src={LOGO_PATH} alt="ACHOICE" className="oht-nav-logo" />
          <div>
            <div className="oht-nav-name">ACHOICE LIMITED</div>
            <div className="oht-nav-tag">Your needs our solutions</div>
          </div>
        </div>
        <div className="oht-nav-links">
          <span className="oht-nav-link" onClick={() => navigate('/')}>Home</span>
          <span className="oht-nav-link" onClick={() => navigate('/products')}>Shop</span>
          <span className="oht-nav-link" onClick={() => navigate('/loans/apply')}>Loans</span>
          <span className="oht-nav-link" onClick={() => navigate('/cart')}>
            Cart {cartCount > 0 && <span className="oht-cart-badge">{cartCount}</span>}
          </span>
        </div>
        <BuyerDropdown cartCount={cartCount} />
      </nav>

      {/* ✅ Payment Success Banner — shows when redirected from Paystack */}
      {justPaid && (
        <div className="oht-pay-success-banner">
          <div className="oht-pay-success-icon">🎉</div>
          <div>
            <div className="oht-pay-success-title">Payment Successful!</div>
            <div className="oht-pay-success-sub">
              Your order has been placed and confirmed. You can track your delivery status below.
            </div>
          </div>
        </div>
      )}

      <div className="oht-container">
        <div className="oht-page-header">
          <div>
            <h1 className="oht-page-title">My Orders</h1>
            <p className="oht-page-sub">{orders.length} total order{orders.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="oht-shop-btn" onClick={() => navigate('/products')}>+ Shop More</button>
        </div>

        {/* ✅ Status Summary Cards — tap to filter */}
        <div className="oht-status-summary">
          {statCards.map(sc => (
            <div key={sc.key}
              className={`oht-stat-card ${filter === sc.key ? 'oht-stat-card-active' : ''}`}
              onClick={() => setFilter(sc.key)}>
              <div className="oht-stat-icon">{sc.icon}</div>
              <div className="oht-stat-count">{counts[sc.key]}</div>
              <div className="oht-stat-label">{sc.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="oht-search-bar">
          <input className="oht-search-input" type="search"
            placeholder="🔍 Search by order number..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading && <p className="oht-msg">⏳ Loading your orders...</p>}
        {error   && <p className="oht-err-msg">⚠️ {error}</p>}

        {!loading && filtered.length === 0 && (
          <div className="oht-empty">
            <div className="oht-empty-icon">{filter === 'all' ? '📦' : statusConfig[filter]?.icon || '📦'}</div>
            <h2 className="oht-empty-title">
              {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
            </h2>
            <p className="oht-empty-text">
              {filter === 'all' ? 'You haven\'t placed any orders yet.' : `You have no ${filter} orders right now.`}
            </p>
            <button className="oht-empty-btn" onClick={() => navigate('/products')}>Browse Products</button>
          </div>
        )}

        {filtered.map(order => {
          const isIncomplete = order.status === 'pending' && order.payment_status === 'unpaid';
          const isExpanded   = expandedOrder === order.id;
          const total        = getOrderTotal(order);
          const sc           = getStatusStyle(order.status);
          const subtotal     = Number(order.subtotal || order.total_amount || total);
          const deliveryFee  = Number(order.delivery_fee || 0);

          return (
            <div key={order.id} className="oht-card">

              {/* ── Card Header ── */}
              <div className="oht-card-header">
                <div>
                  <div className="oht-order-id">
                    {order.order_number || `Order #${order.id}`}
                  </div>
                  <div className="oht-order-date">📅 {fmtDate(order.created_at)}</div>
                </div>
                <div className="oht-header-right">
                  <div className="oht-status-badge"
                    style={{ background: sc.bg, color: sc.color }}>
                    {sc.icon} {isIncomplete ? 'Payment Incomplete' : order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                  </div>
                  <button className="oht-toggle-btn"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                    {isExpanded ? 'Hide ▲' : 'View Details ▼'}
                  </button>
                </div>
              </div>

              {/* ── Quick Info Strip ── always visible on mobile ── */}
              <div className="oht-quick-strip">
                <div className="oht-strip-item">
                  <div className="oht-strip-label">Items</div>
                  <div className="oht-strip-val">{order.items?.length || 0} item{(order.items?.length||0) !== 1 ? 's' : ''}</div>
                </div>
                <div className="oht-strip-item">
                  <div className="oht-strip-label">Total</div>
                  <div className="oht-strip-val" style={{ color:'#1f4d1f', fontWeight:700 }}>₦{total.toLocaleString()}</div>
                </div>
                <div className="oht-strip-item">
                  <div className="oht-strip-label">Delivery to</div>
                  <div className="oht-strip-val">{order.delivery_state || 'N/A'}</div>
                </div>
                <div className="oht-strip-item">
                  <div className="oht-strip-label">Payment</div>
                  <div className="oht-strip-val"
                    style={{ color: order.payment_status === 'paid' ? '#1a7a3a' : '#b36b00', fontWeight:600 }}>
                    {order.payment_status === 'paid' ? '✅ Paid' : '⚠️ ' + (order.payment_status || 'Pending')}
                  </div>
                </div>
              </div>

              {/* ── Incomplete payment alert ── */}
              {isIncomplete && (
                <div className="oht-pay-alert">
                  <div className="oht-pay-alert-icon">⚠️</div>
                  <div>
                    <div className="oht-pay-alert-title">Payment not completed</div>
                    <div className="oht-pay-alert-sub">Your order is saved. Go to cart to retry payment.</div>
                  </div>
                  <button style={{ marginLeft:'auto', padding:'8px 16px', background:'#1f4d1f', color:'#fff', border:'none', borderRadius:7, fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:600, flexShrink:0 }}
                    onClick={() => navigate('/cart')}>
                    Retry →
                  </button>
                </div>
              )}

              {/* ── Expanded Details ── */}
              {isExpanded && (
                <div className="oht-expanded">

                  {/* ✅ ORDER TRACKER — most important on mobile */}
                  {order.status !== 'cancelled' && (
                    <div>
                      <div className="oht-section-title">📍 Order Tracking</div>
                      <OrderTracker status={order.status} />
                      {/* Status description */}
                      <div style={{ marginTop:12, padding:'10px 14px', borderRadius:8, fontSize:13, fontWeight:500,
                        background: sc.bg, color: sc.color }}>
                        {order.status === 'pending'    && '⏳ Your order has been placed and is awaiting processing by the seller.'}
                        {order.status === 'processing' && '⚙️ The seller is preparing your order for shipment.'}
                        {order.status === 'shipped'    && '🚚 Your order is on the way! Confirm receipt when it arrives.'}
                        {order.status === 'delivered'  && '✅ Your order was delivered successfully. Thank you for shopping with ACHOICE!'}
                      </div>
                    </div>
                  )}

                  {/* ✅ ORDER ITEMS */}
                  {order.items?.length > 0 && (
                    <div>
                      <div className="oht-section-title">🛒 Order Items ({order.items.length})</div>
                      {order.items.map((item, i) => (
                        <div key={item.id || i} className="oht-order-item">
                          <div className="oht-item-img">
                            {getProductImage(item)
                              ? <img src={getProductImage(item)} alt={item.product_name} />
                              : <span style={{ fontSize:24 }}>🌿</span>}
                          </div>
                          <div className="oht-item-info">
                            <div className="oht-item-name">{item.product_name || item.product?.name || 'Product'}</div>
                            <div className="oht-item-meta">Qty: {item.quantity} × ₦{Number(item.unit_price || item.price || 0).toLocaleString()}</div>
                            {item.product?.seller && <div className="oht-item-seller">Sold by: {item.product.seller.business_name}</div>}
                          </div>
                          <div className="oht-item-total">₦{Number(item.subtotal || 0).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ✅ DELIVERY INFO */}
                  <div>
                    <div className="oht-section-title">🚚 Delivery Information</div>
                    <div className="oht-delivery-grid">
                      <div>
                        <div className="oht-del-label">Address</div>
                        <div className="oht-del-val">{order.delivery_address || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="oht-del-label">State / LGA</div>
                        <div className="oht-del-val">{order.delivery_state || 'N/A'}{order.delivery_lga ? `, ${order.delivery_lga}` : ''}</div>
                      </div>
                    </div>
                  </div>

                  {/* ✅ PRICE BREAKDOWN */}
                  <div>
                    <div className="oht-section-title">💳 Payment Breakdown</div>
                    <div className="oht-price-breakdown">
                      <div className="oht-price-row">
                        <span>Subtotal</span>
                        <span>₦{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="oht-price-row">
                        <span>Delivery fee</span>
                        <span>{deliveryFee > 0 ? `₦${deliveryFee.toLocaleString()}` : 'Free 🎉'}</span>
                      </div>
                      <div className="oht-price-row">
                        <span>Grand Total</span>
                        <span>₦{total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* ✅ ACTIONS */}
                  <div className="oht-action-row">
                    {order.status === 'shipped' && (
                      <button className="oht-confirm-btn" onClick={() => handleConfirmDelivery(order.id)}>
                        ✅ I've Received This Order
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      <div className="oht-delivered-note">✅ Delivered Successfully</div>
                    )}
                    {order.status === 'cancelled' && (
                      <div className="oht-cancelled-note">✕ This order was cancelled</div>
                    )}
                    <button className="oht-reorder-btn" onClick={() => navigate('/products')}>
                      🛒 Shop Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="oht-footer">
        <div className="oht-footer-bottom">
          <span>© 2026 ACHOICE LIMITED. All rights reserved.</span>
          <span>support@achoice.ng | 09067794991</span>
        </div>
      </footer>
    </div>
  );
}