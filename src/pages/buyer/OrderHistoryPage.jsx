import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyOrders, confirmDelivery } from '../../services/orderService';

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    getMyOrders()
      .then((res) => setOrders(res.data.data || res.data))
      .catch(() => setError('Failed to load orders. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleConfirmDelivery = async (orderId) => {
    if (!window.confirm('Confirm that you have received this order?')) return;
    try {
      await confirmDelivery(orderId);
      setOrders(orders.map((o) =>
        o.id === orderId ? { ...o, status: 'delivered' } : o
      ));
      showToast('Delivery confirmed successfully!');
    } catch (err) {
      showToast('Failed to confirm delivery. Please try again.');
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

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      <nav style={s.nav}>
        <div style={s.navLogo} onClick={() => navigate('/')}>
          ACHOICE <span style={s.navAccent}>LIMITED</span>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => navigate('/')}>Home</span>
          <span style={s.navLink} onClick={() => navigate('/cart')}>Cart</span>
          <span style={s.navLink} onClick={() => navigate('/loans/apply')}>Loans</span>
        </div>
      </nav>

      <div style={s.container}>
        <h1 style={s.pageTitle}>My Orders</h1>

        {loading && <p style={s.message}>Loading your orders...</p>}
        {error && <p style={s.errorMessage}>{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>📦</div>
            <p style={s.emptyTitle}>No orders yet</p>
            <p style={s.emptyText}>You have not placed any orders yet</p>
            <button style={s.shopBtn} onClick={() => navigate('/')}>
              Start Shopping
            </button>
          </div>
        )}

        {orders.map((order) => (
          <div key={order.id} style={s.orderCard}>
            <div style={s.orderHeader}>
              <div>
                <div style={s.orderId}>Order #{order.id}</div>
                <div style={s.orderDate}>
                  {new Date(order.created_at).toLocaleDateString('en-NG', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </div>
              </div>
              <div style={{ ...s.statusBadge, ...getStatusStyle(order.status) }}>
                {order.status
                  ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
                  : 'Pending'}
              </div>
            </div>

            {order.items && order.items.length > 0 && (
              <div style={s.orderItems}>
                {order.items.map((item) => (
                  <div key={item.id} style={s.orderItem}>
                    <div style={s.itemEmoji}>🌿</div>
                    <div style={s.itemInfo}>
                      <div style={s.itemName}>
                        {item.product ? item.product.name : 'Product'}
                      </div>
                      <div style={s.itemQty}>Qty: {item.quantity}</div>
                    </div>
                    <div style={s.itemPrice}>
                      ₦{Number(item.price).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={s.orderFooter}>
              <div style={s.deliveryInfo}>
                <span style={s.deliveryLabel}>Delivery: </span>
                <span style={s.deliveryAddress}>{order.delivery_address}</span>
              </div>
              <div style={s.orderTotal}>
                Total: <strong>₦{Number(order.total_amount).toLocaleString()}</strong>
              </div>
            </div>

            {order.status === 'shipped' && (
              <button
                style={s.confirmBtn}
                onClick={() => handleConfirmDelivery(order.id)}
              >
                Confirm Delivery
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f7f5f0', fontFamily: 'Arial, sans-serif' },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999 },
  nav: { background: '#fff', padding: '18px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e8e4dc' },
  navLogo: { fontSize: 20, fontWeight: 900, color: '#1f4d1f', cursor: 'pointer' },
  navAccent: { color: '#c8860a' },
  navLinks: { display: 'flex', gap: 24, alignItems: 'center' },
  navLink: { color: '#555', fontSize: 14, cursor: 'pointer' },
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 16px' },
  pageTitle: { fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 32 },
  message: { textAlign: 'center', color: '#666', padding: 40 },
  errorMessage: { textAlign: 'center', color: '#cc0000', padding: 40 },
  emptyBox: { background: '#fff', borderRadius: 12, border: '2px dashed #c5ddb8', padding: '60px 0', textAlign: 'center' },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#666', marginBottom: 24 },
  shopBtn: { background: '#1f4d1f', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 7, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' },
  orderCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 24, marginBottom: 16 },
  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  orderId: { fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 4 },
  orderDate: { fontSize: 13, color: '#888' },
  statusBadge: { fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 99 },
  orderItems: { borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '14px 0', marginBottom: 14 },
  orderItem: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  itemEmoji: { fontSize: 24 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: 500, color: '#111' },
  itemQty: { fontSize: 12, color: '#888', marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: 600, color: '#1f4d1f' },
  orderFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  deliveryInfo: { fontSize: 13, color: '#666' },
  deliveryLabel: { fontWeight: 500 },
  deliveryAddress: { color: '#444' },
  orderTotal: { fontSize: 15, color: '#111' },
  confirmBtn: { width: '100%', padding: '12px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
};