import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMyOrders, confirmDelivery } from '../../services/orderService';
import api from '../../services/api';
import BuyerDropdown from '../../components/buyer/BuyerDropdown';

const LOGO_PATH = '/achoice logo.png';

const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];

function OrderTracker({ status }) {
  const currentStep = statusSteps.indexOf(status);
  return (
    <div style={t.tracker}>
      {statusSteps.map((step, i) => (
        <div key={step} style={t.trackerStep}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <div style={{
              ...t.trackerDot,
              background: i <= currentStep ? '#1f4d1f' : '#e0e0e0',
              border: i === currentStep ? '3px solid #f0c050' : '3px solid transparent',
            }}>
              {i < currentStep ? '✓' : i + 1}
            </div>
            {i < statusSteps.length - 1 && (
              <div style={{
                ...t.trackerLine,
                background: i < currentStep ? '#1f4d1f' : '#e0e0e0',
              }} />
            )}
          </div>
          <div style={{
            ...t.trackerLabel,
            color: i <= currentStep ? '#1f4d1f' : '#aaa',
            fontWeight: i === currentStep ? 700 : 400,
          }}>
            {step.charAt(0).toUpperCase() + step.slice(1)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [lastRef, setLastRef] = useState(null);
 

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((acc, item) => acc + (item.quantity || 0), 0));

   const params = new URLSearchParams(location.search);
const urlRef = params.get('reference') || params.get('trxref');
const savedRef = localStorage.getItem('last_order_reference');
const reference = urlRef || savedRef;

if (reference) {
  setLastRef(reference);
  localStorage.removeItem('last_order_reference');
  window.history.replaceState({}, '', '/orders');
}
if (reference) {
  setLastRef(reference);
  localStorage.removeItem('last_order_reference');
  window.history.replaceState({}, '', '/orders');

  // Auto-verify payment immediately
  api.post('/orders/verify-payment', { reference })
    .then(res => {
      showToast(res.data?.message || '✅ Payment verified! Your order is confirmed.');
    })
    .catch(err => {
      // Payment not found or already verified — show manual option
      console.log('Auto-verify result:', err.response?.data?.message);
    });
}
    getMyOrders()
      .then(res => {
        const raw = res.data;
        const list = raw?.data || (Array.isArray(raw) ? raw : []);
        setOrders(list);
      })
      .catch(() => setError('Failed to load orders. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const handleConfirmDelivery = async (orderId) => {
  if (!window.confirm('Confirm that you have received this order?')) return;
  try {
    await confirmDelivery(orderId);
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o));
    showToast('Delivery confirmed successfully!');
  } catch {
    showToast('Failed to confirm delivery. Please try again.');
  }
};
 

  const getStatusStyle = (status) => ({
    pending:    { background: '#fff8e7', color: '#b36b00' },
    processing: { background: '#e7f0ff', color: '#1a4fa0' },
    shipped:    { background: '#e7f7ff', color: '#0077aa' },
    delivered:  { background: '#eafaf0', color: '#1a7a3a' },
    cancelled:  { background: '#fff0f0', color: '#cc0000' },
  }[status] || { background: '#f0f0f0', color: '#555' });

  const getProductImage = (item) =>
    item.product?.images?.[0]?.image_url ||
    item.product?.images?.[0]?.url ||
    item.product?.image ||
    item.product_image ||
    null;

  const getOrderTotal = (order) =>
    Number(order.total_amount || order.total || order.grand_total || 0);

  const filtered = orders.filter(o => {
    const matchSearch = !search || (o.order_number || `Order #${o.id}`).toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || o.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Top Bar */}
      <div style={s.topBar}>
        <div style={s.topBarLeft}>
          <span>📍 No 6 faith avenue off ekenwan Rd Benin City</span>
          <span>✉ support@achoice.ng</span>
        </div>
        <div style={s.topBarRight}>
          <span>📞 09067794991</span>
          <span>Mon - Sat: 07:00am to 06:00pm</span>
        </div>
      </div>

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navBrand} onClick={() => navigate('/')}>
          <img src={LOGO_PATH} alt="Achoice Logo" style={s.navLogoImg} />
          <div>
            <div style={s.navLogoName}>ACHOICE LIMITED</div>
            <div style={s.navLogoTag}>Your needs our solutions</div>
          </div>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => navigate('/')}>Home</span>
          <span style={s.navLink} onClick={() => navigate('/products')}>Shop</span>
          <span style={s.navLink} onClick={() => navigate('/loans/apply')}>Loans</span>
          <span style={s.navLink} onClick={() => navigate('/cart')}>
            Cart {cartCount > 0 && <span style={s.cartBadge}>{cartCount}</span>}
          </span>
        </div>
        <BuyerDropdown cartCount={cartCount} />
      </nav>

      <div style={s.container}>
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>My Orders</h1>
            <p style={s.pageSub}>{orders.length} total orders</p>
          </div>
          <button style={s.shopBtn} onClick={() => navigate('/')}>Continue Shopping</button>
        </div>

       

        {/* Filter Tabs */}
        <div style={s.filterTabs}>
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(tab => (
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
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search order number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading && <p style={s.message}>Loading your orders...</p>}
        {error && <p style={s.errorMsg}>{error}</p>}

        {!loading && filtered.length === 0 && (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>📦</div>
            <h2 style={s.emptyTitle}>No {filter === 'all' ? '' : filter} orders yet</h2>
            <p style={s.emptyText}>
              {filter === 'all' ? 'You have not placed any orders yet.' : `You have no ${filter} orders.`}
            </p>
            <button style={s.emptyBtn} onClick={() => navigate('/')}>Browse Products</button>
          </div>
        )}

        {filtered.map(order => {
          const isIncomplete = order.status === 'pending' && order.payment_status === 'unpaid';
          const isExpanded = expandedOrder === order.id;
          const total = getOrderTotal(order);

          return (
            <div key={order.id} style={s.orderCard}>
              {/* Order Header */}
              <div style={s.orderHeader}>
                <div>
                  <div style={s.orderId}>{order.order_number || `Order #${order.id}`}</div>
                  <div style={s.orderDate}>
                    {new Date(order.created_at).toLocaleDateString('en-NG', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </div>
                </div>
                <div style={s.orderHeaderRight}>
                  <div style={{
                    ...s.statusBadge,
                    ...(isIncomplete ? { background: '#fff8e7', color: '#b36b00' } : getStatusStyle(order.status))
                  }}>
                    {isIncomplete ? 'Payment Incomplete' : (order.status?.charAt(0).toUpperCase() + order.status?.slice(1))}
                  </div>
                  <button
                    style={s.toggleBtn}
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    {isExpanded ? 'Hide ▲' : 'Details ▼'}
                  </button>
                </div>
              </div>

              {/* Order Summary Row */}
              <div style={s.orderSummary}>
                <div style={s.summaryItem}>
                  <div style={s.summaryLabel}>Items</div>
                  <div style={s.summaryValue}>{order.items?.length || 0}</div>
                </div>
                <div style={s.summaryItem}>
                  <div style={s.summaryLabel}>Total</div>
                  <div style={{ ...s.summaryValue, color: '#1f4d1f', fontWeight: 700 }}>
                    ₦{total.toLocaleString()}
                  </div>
                </div>
                <div style={s.summaryItem}>
                  <div style={s.summaryLabel}>Delivery</div>
                  <div style={s.summaryValue}>{order.delivery_state || 'N/A'}</div>
                </div>
                <div style={s.summaryItem}>
                  <div style={s.summaryLabel}>Payment</div>
                  <div style={{
                    ...s.summaryValue,
                    color: order.payment_status === 'paid' ? '#1a7a3a' : '#b36b00'
                  }}>
                    {order.payment_status || 'Pending'}
                  </div>
                </div>
              </div>


              {/* Expanded Details */}
              {isExpanded && (
                <div style={s.expandedSection}>

                  {/* Tracker */}
                  {order.status !== 'cancelled' && (
                    <div style={s.trackerSection}>
                      <div style={s.sectionTitle}>Order Tracking</div>
                      <OrderTracker status={order.status} />
                    </div>
                  )}

                  {/* Items */}
                  {order.items && order.items.length > 0 && (
                    <div style={s.itemsSection}>
                      <div style={s.sectionTitle}>Order Items</div>
                      {order.items.map((item, i) => (
                        <div key={item.id || i} style={s.orderItem}>
                          <div style={s.itemImgBox}>
                            {getProductImage(item)
                              ? <img src={getProductImage(item)} alt={item.product_name} style={s.itemImg} />
                              : <div style={s.itemImgPlaceholder}>🌿</div>
                            }
                          </div>
                          <div style={s.itemInfo}>
                            <div style={s.itemName}>{item.product_name || item.product?.name || 'Product'}</div>
                            <div style={s.itemMeta}>
                              Qty: {item.quantity} × ₦{Number(item.unit_price || item.price || 0).toLocaleString()}
                            </div>
                            {item.product?.seller && (
                              <div style={s.itemSeller}>By: {item.product.seller.business_name}</div>
                            )}
                          </div>
                          <div style={s.itemTotal}>
                            ₦{Number(item.subtotal || 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Delivery */}
                  <div style={s.deliverySection}>
                    <div style={s.sectionTitle}>Delivery Information</div>
                    <div style={s.deliveryGrid}>
                      <div>
                        <div style={s.deliveryLabel}>Address</div>
                        <div style={s.deliveryValue}>{order.delivery_address || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={s.deliveryLabel}>State</div>
                        <div style={s.deliveryValue}>{order.delivery_state || 'N/A'}</div>
                      </div>
                      {order.delivery_fee > 0 && (
                        <div>
                          <div style={s.deliveryLabel}>Delivery Fee</div>
                          <div style={s.deliveryValue}>₦{Number(order.delivery_fee).toLocaleString()}</div>
                        </div>
                      )}
                      <div>
                        <div style={s.deliveryLabel}>Order Total</div>
                        <div style={{ ...s.deliveryValue, fontWeight: 700, color: '#1f4d1f' }}>
                          ₦{total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={s.actionRow}>
                    {order.status === 'shipped' && (
                      <button style={s.confirmBtn} onClick={() => handleConfirmDelivery(order.id)}>
                        Confirm Delivery Received
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      <div style={s.deliveredNote}>Order delivered successfully</div>
                    )}
                    {order.status === 'cancelled' && (
                      <div style={s.cancelledNote}>This order was cancelled</div>
                    )}
                    <button style={s.reorderBtn} onClick={() => navigate('/')}>Shop Again</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <footer style={s.footer}>
        <div style={s.footerBottom}>
          <span>© 2026 ACHOICE LIMITED. All rights reserved.</span>
          <span>support@achoice.ng | 09067794991</span>
        </div>
      </footer>
    </div>
  );
}

const t = {
  tracker: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 0' },
  trackerStep: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 },
  trackerDot: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  trackerLine: { flex: 1, height: 3, marginTop: 0 },
  trackerLabel: { fontSize: 11, textAlign: 'center', marginTop: 6 },
};

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f7f5f0', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999 },
  topBar: { background: '#1f4d1f', color: '#fff', padding: '8px 60px', display: 'flex', justifyContent: 'space-between', fontSize: 12 },
  topBarLeft: { display: 'flex', gap: 24 },
  topBarRight: { display: 'flex', gap: 24 },
  nav: { background: '#1a3d1a', padding: '14px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100 },
  navBrand: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  navLogoImg: { width: 45, height: 45, objectFit: 'contain' },
  navLogoName: { fontSize: 15, fontWeight: 700, color: '#fff' },
  navLogoTag: { fontSize: 10, color: '#fff' },
  navLinks: { display: 'flex', gap: 28, alignItems: 'center' },
  navLink: { color: '#fff', fontSize: 14, cursor: 'pointer' },
  cartBadge: { background: '#f0c050', color: '#1a1a1a', fontSize: 10, fontWeight: 700, borderRadius: '50%', padding: '1px 5px', marginLeft: 4 },
  container: { maxWidth: '900px', margin: '0 auto', padding: '32px 16px', flex: 1 },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 4 },
  pageSub: { fontSize: 14, color: '#888' },
  shopBtn: { padding: '10px 20px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  verifyBanner: { background: '#fff8e7', border: '1px solid #f0c050', borderRadius: 8, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  verifyTitle: { fontSize: 14, fontWeight: 700, color: '#b36b00', marginBottom: 4 },
  verifySub: { fontSize: 13, color: '#888' },
  verifyBtn: { padding: '10px 20px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  verifyBtnDisabled: { padding: '10px 20px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'not-allowed', fontFamily: 'inherit' },
  verifyManual: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '10px 16px', background: '#fff', borderRadius: 8, border: '1px solid #eee' },
  verifyManualText: { fontSize: 13, color: '#888', flex: 1 },
  verifyManualBtn: { padding: '8px 16px', background: '#f0f7ec', color: '#1f4d1f', border: '1px solid #a8d5a8', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  filterTabs: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
  filterTab: { padding: '8px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, color: '#555', cursor: 'pointer', background: '#fff', fontFamily: 'inherit' },
  filterTabActive: { padding: '8px 14px', border: '1px solid #1f4d1f', borderRadius: 6, fontSize: 13, color: '#fff', cursor: 'pointer', background: '#1f4d1f', fontFamily: 'inherit' },
  tabCount: { marginLeft: 5, background: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, padding: '1px 5px', borderRadius: 99 },
  searchInput: { flex: 1, minWidth: 180, padding: '8px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none' },
  message: { textAlign: 'center', color: '#666', padding: 40 },
  errorMsg: { textAlign: 'center', color: '#cc0000', padding: 40 },
  emptyBox: { background: '#fff', borderRadius: 12, border: '2px dashed #c5ddb8', padding: '60px 0', textAlign: 'center' },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#666', marginBottom: 24 },
  emptyBtn: { background: '#1f4d1f', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 7, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' },
  orderCard: { background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc', marginBottom: 16, overflow: 'hidden' },
  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f0f0f0' },
  orderId: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 },
  orderDate: { fontSize: 13, color: '#888' },
  orderHeaderRight: { display: 'flex', alignItems: 'center', gap: 10 },
  statusBadge: { fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 99 },
  toggleBtn: { padding: '7px 14px', background: '#f7f5f0', border: '1px solid #e8e4dc', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#333' },
  orderSummary: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '14px 24px', background: '#f9f9f9' },
  summaryItem: { padding: '4px 0' },
  summaryLabel: { fontSize: 11, color: '#888', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 14, color: '#111' },
  verifyOrderBtn: { margin: '0 24px 14px', padding: '10px 20px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  verifyOrderBtnDisabled: { margin: '0 24px 14px', padding: '10px 20px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'not-allowed', fontFamily: 'inherit' },
  expandedSection: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, borderTop: '1px solid #f0f0f0' },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 10 },
  trackerSection: {},
  itemsSection: {},
  orderItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' },
  itemImgBox: { width: 52, height: 52, background: '#f7f5f0', borderRadius: 8, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  itemImg: { width: '100%', height: '100%', objectFit: 'cover' },
  itemImgPlaceholder: { fontSize: 22 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 3 },
  itemMeta: { fontSize: 12, color: '#888' },
  itemSeller: { fontSize: 11, color: '#1f4d1f', marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: 700, color: '#1f4d1f' },
  deliverySection: {},
  deliveryGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 },
  deliveryLabel: { fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  deliveryValue: { fontSize: 14, color: '#111' },
  actionRow: { display: 'flex', gap: 12, alignItems: 'center' },
  confirmBtn: { padding: '12px 24px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 7, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  deliveredNote: { padding: '10px 16px', background: '#eafaf0', color: '#1a7a3a', borderRadius: 6, fontSize: 13, fontWeight: 500 },
  cancelledNote: { padding: '10px 16px', background: '#fff0f0', color: '#cc0000', borderRadius: 6, fontSize: 13 },
  reorderBtn: { padding: '12px 24px', background: '#fff', color: '#1f4d1f', border: '1px solid #1f4d1f', borderRadius: 7, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  footer: { background: '#1f4d1f', padding: '20px 60px', marginTop: 'auto' },
  footerBottom: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#a8d5a8' },
};