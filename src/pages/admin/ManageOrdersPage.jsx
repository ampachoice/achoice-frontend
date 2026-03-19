import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminOrders, updateOrderStatus } from '../../services/adminService';

export default function ManageOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getAdminOrders()
      .then((res) => setOrders(res.data.data || res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleUpdateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, { status });
      setOrders(orders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      ));
      showToast(`Order status updated to ${status}!`);
    } catch (err) {
      showToast('Failed to update order status.');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      pending: { background: '#fff8e7', color: '#b36b00' },
      processing: { background: '#e7f0ff', color: '#1a4fa0' },
      shipped: { background: '#e7f7ff', color: '#0077aa' },
      delivered: { background: '#eafaf0', color: '#1a7a3a' },
      cancelled: { background: '#fff0f0', color: '#cc0000' },
    };
    return styles[status] || { background: '#f0f0f0', color: '#555' };
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <div style={s.sidebarLogoIcon}>A</div>
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Admin Panel</div>
          </div>
        </div>
        <nav style={s.sidebarNav}>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/dashboard')}>
            <span style={s.sidebarIcon}>📊</span> Dashboard
          </div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/sellers')}>
            <span style={s.sidebarIcon}>🏪</span> Sellers
          </div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/products')}>
            <span style={s.sidebarIcon}>🌾</span> Products
          </div>
          <div style={{ ...s.sidebarItem, ...s.sidebarItemActive }}>
            <span style={s.sidebarIcon}>📦</span> Orders
          </div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/loans')}>
            <span style={s.sidebarIcon}>💰</span> Loans
          </div>
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
          <h1 style={s.headerTitle}>Manage Orders</h1>
          <p style={s.headerSub}>View and update all customer orders</p>
        </div>

        {/* Filter Tabs */}
        <div style={s.filterTabs}>
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((tab) => (
            <button
              key={tab}
              style={filter === tab ? s.filterTabActive : s.filterTab}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading && <p style={s.message}>Loading orders...</p>}

        {!loading && filtered.length === 0 && (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>📦</div>
            <p style={s.emptyText}>No {filter === 'all' ? '' : filter} orders found</p>
          </div>
        )}

        {filtered.map((order) => (
          <div key={order.id} style={s.orderCard}>
            <div style={s.orderHeader}>
              <div>
                <div style={s.orderId}>Order #{order.id}</div>
                <div style={s.orderMeta}>
                  {order.buyer ? order.buyer.name : 'Buyer'} —{' '}
                  {order.buyer ? order.buyer.email : ''} —{' '}
                  {new Date(order.created_at).toLocaleDateString('en-NG', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </div>
              </div>
              <div style={{ ...s.statusBadge, ...getStatusStyle(order.status) }}>
                {order.status}
              </div>
            </div>

            {order.items && order.items.length > 0 && (
              <div style={s.orderItems}>
                {order.items.map((item) => (
                  <div key={item.id} style={s.orderItem}>
                    <span style={s.itemName}>
                      {item.product ? item.product.name : 'Product'}
                    </span>
                    <span style={s.itemQty}>x{item.quantity}</span>
                    <span style={s.itemPrice}>
                      ₦{Number(item.price).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={s.orderFooter}>
              <div style={s.deliveryInfo}>
                <span style={s.deliveryLabel}>Delivery: </span>
                {order.delivery_address}, {order.delivery_state}
              </div>
              <div style={s.orderTotal}>
                Total: <strong>₦{Number(order.total_amount).toLocaleString()}</strong>
              </div>
            </div>

            {/* Status Update Buttons */}
            <div style={s.actionRow}>
              {order.status === 'pending' && (
                <button
                  style={updating === order.id ? s.actionBtnDisabled : s.actionBtn}
                  onClick={() => handleUpdateStatus(order.id, 'processing')}
                  disabled={updating === order.id}
                >
                  Mark as Processing
                </button>
              )}
              {order.status === 'processing' && (
                <button
                  style={updating === order.id ? s.actionBtnDisabled : s.actionBtn}
                  onClick={() => handleUpdateStatus(order.id, 'shipped')}
                  disabled={updating === order.id}
                >
                  Mark as Shipped
                </button>
              )}
              {order.status === 'shipped' && (
                <div style={s.shippedNote}>
                  Waiting for buyer to confirm delivery
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
        ))}
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif' },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999 },
  sidebar: { width: 240, background: '#1f4d1f', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: 10, padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  sidebarLogoIcon: { width: 36, height: 36, background: '#f0c050', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f4d1f', fontWeight: 900, fontSize: 18 },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: '#fff' },
  sidebarLogoSub: { fontSize: 10, color: '#a8d5a8', marginTop: 1 },
  sidebarNav: { flex: 1, padding: '16px 0' },
  sidebarItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', color: '#a8d5a8', fontSize: 14, cursor: 'pointer' },
  sidebarItemActive: { background: 'rgba(255,255,255,0.15)', color: '#fff', borderLeft: '3px solid #f0c050' },
  sidebarIcon: { fontSize: 16 },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  logoutBtn: { width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  main: { flex: 1, marginLeft: 240, padding: '32px' },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 4 },
  headerSub: { fontSize: 14, color: '#888' },
  filterTabs: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  filterTab: { padding: '8px 16px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, color: '#555', cursor: 'pointer', background: '#fff', fontFamily: 'inherit' },
  filterTabActive: { padding: '8px 16px', border: '1px solid #1f4d1f', borderRadius: 6, fontSize: 13, color: '#fff', cursor: 'pointer', background: '#1f4d1f', fontFamily: 'inherit' },
  message: { textAlign: 'center', color: '#666', padding: 40 },
  emptyBox: { textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#888' },
  orderCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 24, marginBottom: 16 },
  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  orderId: { fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 4 },
  orderMeta: { fontSize: 13, color: '#888' },
  statusBadge: { fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 99, textTransform: 'capitalize' },
  orderItems: { borderTop: '1px solid #eee', padding: '12px 0', marginBottom: 12 },
  orderItem: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 },
  itemName: { flex: 1, fontSize: 13, color: '#333' },
  itemQty: { fontSize: 12, color: '#888' },
  itemPrice: { fontSize: 13, fontWeight: 600, color: '#1f4d1f' },
  orderFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingTop: 12, borderTop: '1px solid #eee' },
  deliveryInfo: { fontSize: 13, color: '#666' },
  deliveryLabel: { fontWeight: 500 },
  orderTotal: { fontSize: 15, color: '#111' },
  actionRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  actionBtn: { padding: '9px 20px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  actionBtnDisabled: { padding: '9px 20px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'not-allowed', fontFamily: 'inherit' },
  cancelBtn: { padding: '9px 20px', background: '#fff', color: '#cc0000', border: '1px solid #cc0000', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  cancelBtnDisabled: { padding: '9px 20px', background: '#fff', color: '#ccc', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, cursor: 'not-allowed', fontFamily: 'inherit' },
  shippedNote: { background: '#e7f0ff', color: '#1a4fa0', padding: '9px 16px', borderRadius: 6, fontSize: 13 },
};