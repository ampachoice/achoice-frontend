import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(saved);
  }, []);

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 2000);
  };

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return;
    const updated = cart.map((item) =>
      item.id === id ? { ...item, quantity: newQty } : item
    );
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    showFeedback('Quantity updated');
  };

  const removeItem = (id) => {
    if (!window.confirm('Remove this item from your cart?')) return;
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    showFeedback('Item removed');
  };

  const clearCart = () => {
    if (!window.confirm('Clear all items from your cart?')) return;
    setCart([]);
    localStorage.removeItem('cart');
    showFeedback('Cart cleared');
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity, 0
  );

  return (
    <div style={s.page}>

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navLogo} onClick={() => navigate('/')}>
          ACHOICE <span style={s.navAccent}>LIMITED</span>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => navigate('/')}>Back to Products</span>
        </div>
      </nav>

      {/* Feedback Toast */}
      {feedback && (
        <div style={s.toast}>{feedback}</div>
      )}

      <div style={s.container}>
        <h1 style={s.pageTitle}>Your Cart</h1>

        {cart.length === 0 ? (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>🛒</div>
            <p style={s.emptyText}>Your cart is empty</p>
            <button style={s.shopBtn} onClick={() => navigate('/')}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <div style={s.layout}>

            {/* Cart Items */}
            <div style={s.itemsCol}>
              <div style={s.itemsHeader}>
                <span style={s.itemsCount}>
                  {cart.length} item{cart.length > 1 ? 's' : ''}
                </span>
                <button style={s.clearBtn} onClick={clearCart}>
                  Clear Cart
                </button>
              </div>

              {cart.map((item) => (
                <div key={item.id} style={s.cartItem}>
                  <div style={s.itemImage}>{item.emoji || '🌿'}</div>
                  <div style={s.itemInfo}>
                    <div style={s.itemName}>{item.name}</div>
                    <div style={s.itemSeller}>
                      {item.seller ? item.seller.business_name : 'ACHOICE Seller'}
                    </div>
                    <div style={s.itemPrice}>
                      ₦{Number(item.price).toLocaleString()} each
                    </div>
                  </div>
                  <div style={s.itemActions}>
                    <div style={s.qtyControl}>
                      <button
                        style={s.qBtn}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span style={s.qNum}>{item.quantity}</span>
                      <button
                        style={s.qBtn}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div style={s.itemTotal}>
                      ₦{(Number(item.price) * item.quantity).toLocaleString()}
                    </div>
                    <button
                      style={s.removeBtn}
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div style={s.summaryCol}>
              <div style={s.summaryCard}>
                <h2 style={s.summaryTitle}>Order Summary</h2>

                <div style={s.summaryRows}>
                  {cart.map((item) => (
                    <div key={item.id} style={s.summaryRow}>
                      <span style={s.summaryLabel}>
                        {item.name} x{item.quantity}
                      </span>
                      <span style={s.summaryValue}>
                        ₦{(Number(item.price) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={s.divider}></div>

                <div style={s.totalRow}>
                  <span style={s.totalLabel}>Total</span>
                  <span style={s.totalValue}>
                    ₦{total.toLocaleString()}
                  </span>
                </div>

                <button
                  style={cart.length === 0 ? s.checkoutBtnDisabled : s.checkoutBtn}
                  onClick={() => cart.length > 0 && navigate('/checkout')}
                  disabled={cart.length === 0}
                >
                  Proceed to Checkout
                </button>

                <button
                  style={s.continueBtn}
                  onClick={() => navigate('/')}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f7f5f0', fontFamily: 'Arial, sans-serif' },
  nav: { background: '#fff', padding: '18px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e8e4dc' },
  navLogo: { fontSize: 20, fontWeight: 900, color: '#1f4d1f', cursor: 'pointer' },
  navAccent: { color: '#c8860a' },
  navLinks: { display: 'flex', gap: 24, alignItems: 'center' },
  navLink: { color: '#555', fontSize: 14, cursor: 'pointer' },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999 },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '40px 16px' },
  pageTitle: { fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 32 },
  emptyBox: { textAlign: 'center', padding: '80px 0' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#666', marginBottom: 24 },
  shopBtn: { background: '#1f4d1f', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 7, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 },
  itemsCol: {},
  itemsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  itemsCount: { fontSize: 14, color: '#666' },
  clearBtn: { background: 'none', border: 'none', color: '#cc0000', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  cartItem: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: '20px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12 },
  itemImage: { fontSize: 48, flexShrink: 0 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 500, color: '#111', marginBottom: 4 },
  itemSeller: { fontSize: 12, color: '#888', marginBottom: 6 },
  itemPrice: { fontSize: 13, color: '#666' },
  itemActions: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 },
  qtyControl: { display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #ddd', borderRadius: 6, padding: '5px 10px' },
  qBtn: { background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#1f4d1f', fontWeight: 700 },
  qNum: { fontSize: 14, fontWeight: 500, minWidth: 20, textAlign: 'center' },
  itemTotal: { fontSize: 16, fontWeight: 700, color: '#1f4d1f' },
  removeBtn: { background: 'none', border: 'none', color: '#cc0000', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  summaryCol: {},
  summaryCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 24, position: 'sticky', top: 20 },
  summaryTitle: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 20 },
  summaryRows: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  summaryRow: { display: 'flex', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: '#666' },
  summaryValue: { fontSize: 13, color: '#333', fontWeight: 500 },
  divider: { height: 1, background: '#eee', margin: '16px 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  totalLabel: { fontSize: 16, fontWeight: 700, color: '#111' },
  totalValue: { fontSize: 22, fontWeight: 700, color: '#1f4d1f' },
  checkoutBtn: { width: '100%', padding: '14px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 7, fontSize: 15, fontWeight: 500, cursor: 'pointer', marginBottom: 10, fontFamily: 'inherit' },
  checkoutBtnDisabled: { width: '100%', padding: '14px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 7, fontSize: 15, fontWeight: 500, cursor: 'not-allowed', marginBottom: 10, fontFamily: 'inherit' },
  continueBtn: { width: '100%', padding: '14px', background: '#fff', color: '#1f4d1f', border: '2px solid #1f4d1f', borderRadius: 7, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
};