import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminOrders, updateOrderStatus } from '../../services/adminService';
import api from '../../services/api';

const LOGO_PATH = "/achoice logo.png";

export default function ManageOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [updating, setUpdating] = useState(null);
  const [verifying, setVerifying] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAdminOrders()
      .then((res) => {
        const raw = res.data;
        setOrders(raw?.data || (Array.isArray(raw) ? raw : []));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleUpdateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, { status });
      setOrders(orders.map((o) => o.id === orderId ? { ...o, status } : o));
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
      //const res = await api.post('/orders/verify-payment', { reference: ref });
      const res = await api.post(`/admin/orders/${orderId}/verify-payment`, { reference: ref });
      showToast(res.data?.message || 'Payment verified! Order confirmed.');
      const r = await getAdminOrders();
      const raw = r.data;
      setOrders(raw?.data || (Array.isArray(raw) ? raw : []));
    } catch (err) {
      showToast(err.response?.data?.message || 'Verification failed. Check the reference and try again.');
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

  const toMoney = (val) => {
    const n = Number(val);
    return isNaN(n) ? '—' : `₦${n.toLocaleString()}`;
  };

  const getProductImage = (item) =>
    item.product?.images?.[0]?.image_url ||
    item.product?.images?.[0]?.url ||
    item.product?.image ||
    item.product_image ||
    null;

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter;
    const matchSearch = !search ||
      (o.order_number || `Order #${o.id}`).toLowerCase().includes(search.toLowerCase()) ||
      (o.buyer?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const unpaidCount = orders.filter(o => o.payment_status === 'unpaid' && o.status === 'pending').length;

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
          {[
            { icon: '📊', label: 'Dashboard', path: '/admin/dashboard' },
            { icon: '🏪', label: 'Sellers', path: '/admin/sellers' },
            { icon: '🌾', label: 'Products', path: '/admin/products' },
            { icon: '📦', label: 'Orders', path: '/admin/orders', active: true },
            { icon: '💰', label: 'Loans', path: '/admin/loans' },
            { icon: '⚙️', label: 'Loan Settings', path: '/admin/loan-settings' },
            { icon: '🚚', label: 'Delivery Zones', path: '/admin/delivery-zones' },
             { icon: '👥', label: 'Staff', path: '/admin/staff'},
          ].map(item => (
            <div key={item.label}
              style={{ ...s.sidebarItem, ...(item.active ? s.sidebarItemActive : {}) }}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
        <div style={s.sidebarFooter}>
          <button style={s.logoutBtn} onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/admin');
          }}>Logout</button>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>Manage Orders</h1>
            <p style={s.headerSub}>{orders.length} total orders</p>
          </div>
          {unpaidCount > 0 && (
            <div style={s.unpaidAlert}>
              {unpaidCount} order{unpaidCount !== 1 ? 's' : ''} with unverified payment
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={s.statsGrid}>
          {[
            { label: 'Total Orders', value: orders.length, color: '#111' },
            { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: '#b36b00' },
            { label: 'Processing', value: orders.filter(o => o.status === 'processing').length, color: '#1a4fa0' },
            { label: 'Shipped', value: orders.filter(o => o.status === 'shipped').length, color: '#0077aa' },
            { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: '#1a7a3a' },
          ].map(stat => (
            <div key={stat.label} style={s.statCard}>
              <div style={s.statLabel}>{stat.label}</div>
              <div style={{ ...s.statValue, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filter + Search */}
        <div style={s.controlsRow}>
          <div style={s.filterTabs}>
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((tab) => (
              <button
                key={tab}
                style={filter === tab ? s.filterTabActive : s.filterTab}
                onClick={() => setFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab !== 'all' && orders.filter(o => o.status === tab).length > 0 && (
                  <span style={s.tabCount}>{orders.filter(o => o.status === tab).length}</span>
                )}
              </button>
            ))}
          </div>
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search order or buyer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading && <p style={s.message}>Loading orders...</p>}

        {!loading && filtered.length === 0 && (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>📦</div>
            <p style={s.emptyText}>No {filter === 'all' ? '' : filter} orders found</p>
          </div>
        )}

        {filtered.map((order) => {
          const isUnpaid = order.payment_status === 'unpaid' && order.status === 'pending';
          const total = Number(order.total_amount || order.total || order.grand_total || 0);

          return (
            <div key={order.id} style={{ ...s.orderCard, ...(isUnpaid ? s.orderCardUnpaid : {}) }}>
              <div style={s.orderHeader}>
                <div>
                  <div style={s.orderId}>{order.order_number || `Order #${order.id}`}</div>
                  <div style={s.orderMeta}>
                    {order.buyer?.name || 'Buyer'}
                    {order.buyer?.email ? ` — ${order.buyer.email}` : ''}
                    {' · '}
                    {new Date(order.created_at).toLocaleDateString('en-NG', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </div>
                </div>
                <div style={s.orderHeaderRight}>
                  <div style={{ ...s.statusBadge, ...getStatusStyle(order.status) }}>
                    {order.status}
                  </div>
                  <div style={{
                    ...s.paymentBadge,
                    background: order.payment_status === 'paid' ? '#eafaf0' : '#fff0f0',
                    color: order.payment_status === 'paid' ? '#1a7a3a' : '#cc0000',
                  }}>
                    {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                  </div>
                </div>
              </div>

              {/* Unpaid warning with verify button */}
              {isUnpaid && (
                <div style={s.unpaidBanner}>
                  <div style={s.unpaidBannerText}>
                    Payment not verified — buyer may have paid via Paystack but webhook failed
                  </div>
                  <button
                    style={verifying === order.id ? s.verifyBtnDisabled : s.verifyBtn}
                    onClick={() => handleVerifyPayment(order.id, order.payment_reference)}
                    disabled={verifying === order.id}
                  >
                    {verifying === order.id ? 'Verifying...' : 'Verify Payment'}
                  </button>
                </div>
              )}

              {/* Order Items */}
              {order.items?.length > 0 && (
                <div style={s.orderItems}>
                  {order.items.map((item) => (
                    <div key={item.id} style={s.orderItem}>
                      <div style={s.itemImgBox}>
                        {getProductImage(item)
                          ? <img src={getProductImage(item)} alt={item.product_name} style={s.itemImg} />
                          : <div style={s.itemImgPlaceholder}>🌿</div>
                        }
                      </div>
                      <span style={s.itemName}>{item.product_name || item.product?.name || 'Product'}</span>
                      <span style={s.itemQty}>×{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                      <span style={s.itemPrice}>{toMoney(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Order Footer */}
              <div style={s.orderFooter}>
                <div style={s.deliveryInfo}>
                  <span style={s.deliveryLabel}>Delivery: </span>
                  {[order.delivery_address, order.delivery_lga, order.delivery_state].filter(Boolean).join(', ')}
                  {order.delivery_fee > 0 && (
                    <span style={s.deliveryFee}> · Fee: {toMoney(order.delivery_fee)}</span>
                  )}
                </div>
                <div style={s.orderTotal}>
                  Total: <strong>{toMoney(total)}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={s.actionRow}>
                {order.status === 'pending' && order.payment_status === 'paid' && (
                  <button
                    style={updating === order.id ? s.actionBtnDisabled : s.actionBtn}
                    onClick={() => handleUpdateStatus(order.id, 'processing')}
                    disabled={updating === order.id}
                  >
                    {updating === order.id ? 'Updating...' : 'Mark as Processing'}
                  </button>
                )}
                {order.status === 'processing' && (
                  <button
                    style={updating === order.id ? s.actionBtnDisabled : s.actionBtn}
                    onClick={() => handleUpdateStatus(order.id, 'shipped')}
                    disabled={updating === order.id}
                  >
                    {updating === order.id ? 'Updating...' : 'Mark as Shipped'}
                  </button>
                )}
                {order.status === 'shipped' && (
                  <div style={s.shippedNote}>
                    Waiting for buyer to confirm delivery
                  </div>
                )}
                {order.status === 'delivered' && (
                  <div style={s.deliveredNote}>
                    Order delivered and completed
                  </div>
                )}
                {(order.status === 'pending' || order.status === 'processing') && (
                  <button
                    style={updating === order.id ? s.cancelBtnDisabled : s.cancelBtn}
                    onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                    disabled={updating === order.id}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif' },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999 },
  sidebar: { width: 240, background: '#1f4d1f', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: 10, padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoImg: { width: 40, height: 40, objectFit: 'contain' },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: '#fff' },
  sidebarLogoSub: { fontSize: 10, color: '#a8d5a8' },
  sidebarNav: { flex: 1, padding: '16px 0' },
  sidebarItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', color: '#a8d5a8', fontSize: 14, cursor: 'pointer' },
  sidebarItemActive: { background: 'rgba(255,255,255,0.15)', color: '#fff', borderLeft: '3px solid #f0c050' },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  logoutBtn: { width: '100%', padding: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  main: { flex: 1, marginLeft: 240, padding: 32 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 4 },
  headerSub: { fontSize: 14, color: '#888' },
  unpaidAlert: { background: '#fff0f0', color: '#cc0000', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #ffa39e' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 },
  statCard: { background: '#fff', borderRadius: 8, border: '1px solid #e8e4dc', padding: 14 },
  statLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 700 },
  controlsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' },
  filterTabs: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filterTab: { padding: '8px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, color: '#555', cursor: 'pointer', background: '#fff', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 },
  filterTabActive: { padding: '8px 14px', border: '1px solid #1f4d1f', borderRadius: 6, fontSize: 13, color: '#fff', cursor: 'pointer', background: '#1f4d1f', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 },
  tabCount: { background: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 99 },
  searchInput: { padding: '9px 16px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', minWidth: 220 },
  message: { textAlign: 'center', color: '#666', padding: 40 },
  emptyBox: { textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#888' },
  orderCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 24, marginBottom: 16 },
  orderCardUnpaid: { border: '1px solid #ffa39e' },
  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  orderId: { fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 4 },
  orderMeta: { fontSize: 13, color: '#888' },
  orderHeaderRight: { display: 'flex', alignItems: 'center', gap: 8 },
  statusBadge: { fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 99, textTransform: 'capitalize' },
  paymentBadge: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99 },
  unpaidBanner: { background: '#fff8e7', border: '1px solid #f0c050', borderRadius: 8, padding: '12px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  unpaidBannerText: { fontSize: 13, color: '#b36b00', flex: 1 },
  verifyBtn: { padding: '8px 18px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  verifyBtnDisabled: { padding: '8px 18px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'not-allowed', fontFamily: 'inherit' },
  orderItems: { borderTop: '1px solid #eee', padding: '12px 0', marginBottom: 12 },
  orderItem: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 },
  itemImgBox: { width: 44, height: 44, borderRadius: 6, overflow: 'hidden', background: '#f5f5f5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  itemImg: { width: '100%', height: '100%', objectFit: 'cover' },
  itemImgPlaceholder: { fontSize: 20 },
  itemName: { flex: 1, fontSize: 13, color: '#333' },
  itemQty: { fontSize: 12, color: '#888' },
  itemPrice: { fontSize: 13, fontWeight: 600, color: '#1f4d1f' },
  orderFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingTop: 12, borderTop: '1px solid #eee' },
  deliveryInfo: { fontSize: 13, color: '#666' },
  deliveryLabel: { fontWeight: 500 },
  deliveryFee: { color: '#888' },
  orderTotal: { fontSize: 15, color: '#111' },
  actionRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  actionBtn: { padding: '9px 20px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  actionBtnDisabled: { padding: '9px 20px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'not-allowed', fontFamily: 'inherit' },
  cancelBtn: { padding: '9px 20px', background: '#fff', color: '#cc0000', border: '1px solid #cc0000', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  cancelBtnDisabled: { padding: '9px 20px', background: '#fff', color: '#ccc', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, cursor: 'not-allowed', fontFamily: 'inherit' },
  shippedNote: { background: '#e7f0ff', color: '#1a4fa0', padding: '9px 16px', borderRadius: 6, fontSize: 13 },
  deliveredNote: { background: '#eafaf0', color: '#1a7a3a', padding: '9px 16px', borderRadius: 6, fontSize: 13 },
};