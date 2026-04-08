import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [feedback, setFeedback] = useState('');

  // 1. Logic to identify a genuine registered user
  const isLoggedIn = !!localStorage.getItem('token');

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

      {/* Navbar with Conditional Loan Link */}
    {/* Navbar with Correct Loan Path */}
      <nav style={s.nav}>
        <div style={s.navLeft} onClick={() => navigate('/products')}>
          <img src="/android-chrome-192x192.png" alt="Logo" style={s.logoImg} />
          <div style={s.logoText}>ACHOICE <span style={{color: '#f0c050'}}>MARKET</span></div>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => navigate('/products')}>← Back to Marketplace</span>
          
          {/* Check for genuine registered user */}
          {isLoggedIn && (
            <span 
              style={{
                ...s.navLink, 
                color: '#fff', 
                border: '1px solid #f0c050', 
                padding: '5px 12px', 
                borderRadius: '4px',
                marginLeft: '15px'
              }} 
              onClick={() => navigate('/loans/apply')} // Changed from /loans to /loans/apply
            >
              Apply for Loan
            </span>
          )}
        </div>
      </nav>

      {/* Feedback Toast */}
      {feedback && (
        <div style={s.toast}>{feedback}</div>
      )}

      <div style={s.container}>
        <h1 style={s.pageTitle}>Your Shopping Cart</h1>

        {cart.length === 0 ? (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>🛒</div>
            <p style={s.emptyText}>Your cart is empty</p>
            <button style={s.shopBtn} onClick={() => navigate('/products')}>
              Start Shopping
            </button>
          </div>
        ) : (
          <div style={s.layout}>

            {/* Cart Items */}
            <div style={s.itemsCol}>
              <div style={s.itemsHeader}>
                <span style={s.itemsCount}>
                  {cart.length} item{cart.length > 1 ? 's' : ''} in your basket
                </span>
                <button style={s.clearBtn} onClick={clearCart}>
                  Clear All
                </button>
              </div>

              {cart.map((item) => (
                <div key={item.id} style={s.cartItem}>
                  <div style={s.itemImageWrap}>
                    {item.image ? (
                        <img src={item.image} style={s.img} alt={item.name} />
                    ) : (
                        <span style={{fontSize: '40px'}}>{item.emoji || '🌿'}</span>
                    )}
                  </div>
                  <div style={s.itemInfo}>
                    <div style={s.itemName}>{item.name}</div>
                    <div style={s.itemSeller}>
                      {item.seller ? item.seller.business_name : 'Verified ACHOICE Produce'}
                    </div>
                    <div style={s.itemPrice}>
                      ₦{Number(item.price).toLocaleString()}
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
                <h2 style={s.summaryTitle}>Summary</h2>

                <div style={s.summaryRows}>
                   <div style={s.summaryRow}>
                      <span style={s.summaryLabel}>Subtotal</span>
                      <span style={s.summaryValue}>₦{total.toLocaleString()}</span>
                   </div>
                   <div style={s.summaryRow}>
                      <span style={s.summaryLabel}>Delivery</span>
                      <span style={s.summaryValue}>Calculated at next step</span>
                   </div>
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
                  onClick={() => navigate('/products')}
                >
                  Keep Shopping
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
  page: { minHeight: '100vh', backgroundColor: '#fcfbf7', fontFamily: 'Arial, sans-serif' },
  nav: { background: '#1f4d1f', padding: '12px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', position: 'sticky', top: 0, zIndex: 100 },
  navLeft: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' },
  logoImg: { width: '35px', height: '35px', borderRadius: '4px' },
  logoText: { fontWeight: 'bold', fontSize: '18px' },
  navLinks: { display: 'flex', gap: 20, alignItems: 'center' },
  navLink: { color: '#f0c050', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'none' },
  toast: { position: 'fixed', top: 80, right: 20, background: '#1f4d1f', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999, border: '1px solid #f0c050' },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '40px 16px' },
  pageTitle: { fontSize: 28, fontWeight: 700, color: '#1f4d1f', marginBottom: 32 },
  emptyBox: { textAlign: 'center', padding: '80px 0', background: '#fff', borderRadius: '15px', border: '1px solid #eee' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#666', marginBottom: 24 },
  shopBtn: { background: '#1f4d1f', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 7, fontSize: 15, cursor: 'pointer' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 30 },
  itemsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  itemsCount: { fontSize: 14, color: '#666' },
  clearBtn: { background: 'none', border: 'none', color: '#cc0000', fontSize: 13, cursor: 'pointer' },
  cartItem: { background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: '20px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 15 },
  itemImageWrap: { width: '80px', height: '80px', background: '#f5f5f5', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 17, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  itemSeller: { fontSize: 12, color: '#1f4d1f', fontWeight: '600', marginBottom: 6 },
  itemPrice: { fontSize: 14, color: '#666' },
  itemActions: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 },
  qtyControl: { display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #ddd', borderRadius: '20px', padding: '4px 12px' },
  qBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#1f4d1f', fontWeight: 'bold' },
  qNum: { fontSize: 14, fontWeight: 'bold' },
  itemTotal: { fontSize: 18, fontWeight: '900', color: '#1f4d1f' },
  removeBtn: { background: 'none', border: 'none', color: '#cc0000', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' },
  summaryCard: { background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 24, position: 'sticky', top: 100 },
  summaryTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f4d1f', marginBottom: 20 },
  summaryRows: { display: 'flex', flexDirection: 'column', gap: 12 },
  summaryRow: { display: 'flex', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, color: '#333', fontWeight: 'bold' },
  divider: { height: 1, background: '#eee', margin: '20px 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  totalValue: { fontSize: 24, fontWeight: '900', color: '#1f4d1f' },
  checkoutBtn: { width: '100%', padding: '15px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: '8px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', marginBottom: 12 },
  checkoutBtnDisabled: { width: '100%', padding: '15px', background: '#ccc', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'not-allowed', marginBottom: 12 },
  continueBtn: { width: '100%', padding: '13px', background: 'none', color: '#1f4d1f', border: '2px solid #1f4d1f', borderRadius: '8px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer' },
};