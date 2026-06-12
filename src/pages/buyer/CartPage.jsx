import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BuyerDropdown from '../../components/buyer/BuyerDropdown';

export default function CartPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [cart, setCart]                   = useState([]);
  const [feedback, setFeedback]           = useState('');
  const [cartCount, setCartCount]         = useState(0);
  const [cancelledNotice, setCancelledNotice] = useState(false);

  useEffect(() => {
    if (document.getElementById('cp2-style')) return;
    const el = document.createElement('style');
    el.id = 'cp2-style';
    el.textContent = `
      body { margin:0; }
      .crt-wrap { min-height:100vh; background:#f7f5f0; font-family:Arial,sans-serif; }

      /* ── NAV ── */
      .crt-nav { background:#1f4d1f; padding:10px 40px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; gap:12px; }
      .crt-nav-left { display:flex; align-items:center; gap:10px; cursor:pointer; flex-shrink:0; }
      .crt-nav-logo { width:36px; height:36px; border-radius:6px; }
      .crt-nav-name { font-weight:700; font-size:17px; color:#fff; line-height:1.2; }
      .crt-nav-name span { color:#f0c050; }
      .crt-nav-motto { font-size:9px; color:#a8d5a8; letter-spacing:.3px; }
      .crt-nav-back { color:#f0c050; font-size:13px; cursor:pointer; font-weight:700; white-space:nowrap; }
      .crt-nav-right { display:flex; align-items:center; gap:14px; flex-shrink:0; }
      .crt-cart-icon { font-size:22px; position:relative; color:#fff; cursor:pointer; }
      .crt-cart-badge { position:absolute; top:-8px; right:-10px; background:#f0c050; color:#1f4d1f; font-size:10px; font-weight:700; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #1f4d1f; }

      /* ── TOAST ── */
      .crt-toast { position:fixed; top:76px; right:20px; background:#1f4d1f; color:#fff; padding:12px 24px; border-radius:8px; font-size:14px; z-index:999; border:1px solid #f0c050; box-shadow:0 4px 16px rgba(0,0,0,0.15); }

      /* ── CANCELLED BANNER ── */
      .crt-banner { background:#fff8e7; border:1px solid #f0c050; border-radius:10px; padding:16px 20px; margin:16px 40px 0; display:flex; justify-content:space-between; align-items:flex-start; gap:16px; }
      .crt-banner-title { font-size:15px; font-weight:700; color:#b36b00; margin-bottom:4px; }
      .crt-banner-text  { font-size:13px; color:#7a5000; line-height:1.6; }
      .crt-banner-close { background:none; border:none; font-size:18px; cursor:pointer; color:#b36b00; flex-shrink:0; }

      /* ── CONTAINER ── */
      .crt-container { max-width:1100px; margin:0 auto; padding:36px 40px; }
      .crt-title { font-size:26px; font-weight:700; color:#1f4d1f; margin:0 0 28px; }

      /* ── EMPTY ── */
      .crt-empty { text-align:center; padding:80px 20px; background:#fff; border-radius:14px; border:1px solid #e8e4dc; }
      .crt-empty-icon { font-size:64px; margin-bottom:16px; }
      .crt-empty-text { font-size:17px; color:#666; margin-bottom:24px; }
      .crt-empty-btn  { background:#1f4d1f; color:#fff; border:none; padding:13px 28px; border-radius:8px; font-size:15px; cursor:pointer; font-family:inherit; font-weight:600; }

      /* ── LAYOUT ── */
      .crt-layout { display:grid; grid-template-columns:1fr 340px; gap:28px; align-items:start; }

      /* ── ITEMS COL ── */
      .crt-items-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
      .crt-items-count { font-size:14px; color:#888; font-weight:500; }
      .crt-clear-btn { background:none; border:none; color:#cc0000; font-size:13px; cursor:pointer; font-family:inherit; font-weight:600; }

      .crt-item { background:#fff; border-radius:12px; border:1px solid #e8e4dc; padding:18px 20px; display:flex; align-items:center; gap:18px; margin-bottom:14px; transition:box-shadow .2s; }
      .crt-item:hover { box-shadow:0 2px 12px rgba(0,0,0,0.07); }
      .crt-item-img { width:80px; height:80px; background:#f5f5f5; border-radius:10px; overflow:hidden; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .crt-item-img img { width:100%; height:100%; object-fit:cover; }
      .crt-item-info { flex:1; min-width:0; }
      .crt-item-name   { font-size:16px; font-weight:700; color:#111; margin-bottom:3px; }
      .crt-item-seller { font-size:12px; color:#1f4d1f; font-weight:600; margin-bottom:5px; }
      .crt-item-price  { font-size:13px; color:#888; }
      .crt-item-actions { display:flex; flex-direction:column; align-items:flex-end; gap:10px; flex-shrink:0; }
      .crt-qty { display:flex; align-items:center; gap:10px; border:1.5px solid #ddd; border-radius:20px; padding:4px 14px; }
      .crt-qty-btn { background:none; border:none; font-size:20px; cursor:pointer; color:#1f4d1f; font-weight:700; line-height:1; padding:0; }
      .crt-qty-num { font-size:15px; font-weight:700; min-width:20px; text-align:center; }
      .crt-item-total  { font-size:18px; font-weight:900; color:#1f4d1f; }
      .crt-remove-btn  { background:none; border:none; color:#cc0000; font-size:12px; cursor:pointer; text-decoration:underline; font-family:inherit; }

      /* ── SUMMARY ── */
      .crt-summary { background:#fff; border-radius:12px; border:1px solid #e8e4dc; padding:24px; position:sticky; top:80px; }
      .crt-summary-title { font-size:20px; font-weight:700; color:#1f4d1f; margin:0 0 20px; }
      .crt-summary-row   { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
      .crt-summary-label { font-size:14px; color:#888; }
      .crt-summary-val   { font-size:14px; color:#333; font-weight:600; }
      .crt-divider       { height:1px; background:#eee; margin:18px 0; }
      .crt-total-row     { display:flex; justify-content:space-between; align-items:center; margin-bottom:22px; }
      .crt-total-label   { font-size:18px; font-weight:700; color:#111; }
      .crt-total-val     { font-size:26px; font-weight:900; color:#1f4d1f; }
      .crt-checkout-btn  { width:100%; padding:15px; background:#1f4d1f; color:#fff; border:none; border-radius:9px; font-size:16px; font-weight:700; cursor:pointer; font-family:inherit; margin-bottom:12px; }
      .crt-checkout-dis  { width:100%; padding:15px; background:#ccc; color:#fff; border:none; border-radius:9px; font-size:16px; cursor:not-allowed; font-family:inherit; margin-bottom:12px; }
      .crt-continue-btn  { width:100%; padding:13px; background:none; color:#1f4d1f; border:2px solid #1f4d1f; border-radius:9px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
      /* Keep Shopping below items — hidden on desktop (summary has its own), shown on mobile */
      .crt-keep-shopping { display:none; margin-top:4px; }
      .crt-security-note { display:flex; align-items:center; gap:6px; font-size:11px; color:#888; margin-top:14px; justify-content:center; }

      /* ── MOBILE SUMMARY STRIP (checkout bar at bottom) ── */
      .crt-mobile-checkout { display:none; }

      /* ── TABLET ── */
      @media (max-width:860px) {
        .crt-nav { padding:10px 20px; }
        .crt-nav-back { display:none; }
        .crt-banner { margin:14px 20px 0; }
        .crt-container { padding:24px 20px; }
        .crt-layout { grid-template-columns:1fr; }
        .crt-summary { position:static; }
      }

      /* ── MOBILE ── */
      @media (max-width:600px) {
        .crt-nav { padding:8px 14px; }
        .crt-nav-name { font-size:15px; }
        .crt-banner { margin:12px 12px 0; padding:14px 16px; }
        .crt-container { padding:16px 12px 100px; }
        .crt-title { font-size:20px; margin-bottom:18px; }

        .crt-item { padding:14px; gap:12px; }
        .crt-item-img { width:64px; height:64px; border-radius:8px; }
        .crt-item-name { font-size:14px; }
        .crt-item-total { font-size:16px; }
        .crt-qty { padding:3px 10px; gap:8px; }
        .crt-qty-btn { font-size:18px; }
        .crt-qty-num { font-size:14px; }

        /* Hide the right-column summary on mobile — replaced by bottom bar */
        .crt-summary-col { display:none; }
        /* Show the keep shopping button that lives below the items list */
        .crt-keep-shopping { display:block; }

        /* Sticky checkout bar at bottom */
        .crt-mobile-checkout {
          display:flex; position:fixed; bottom:0; left:0; right:0;
          background:#fff; border-top:2px solid #e8e4dc;
          padding:12px 16px; gap:12px; align-items:center;
          box-shadow:0 -4px 20px rgba(0,0,0,0.1); z-index:200;
        }
        .crt-mobile-total { flex:1; }
        .crt-mobile-total-label { font-size:11px; color:#888; margin-bottom:2px; }
        .crt-mobile-total-val   { font-size:22px; font-weight:900; color:#1f4d1f; line-height:1; }
        .crt-mobile-checkout-btn {
          padding:14px 24px; background:#1f4d1f; color:#fff; border:none;
          border-radius:9px; font-size:15px; font-weight:700; cursor:pointer;
          font-family:inherit; white-space:nowrap;
        }
      }

      @media (max-width:380px) {
        .crt-item-actions { gap:7px; }
        .crt-item-total { font-size:14px; }
      }
    `;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(saved);
    setCartCount(saved.reduce((acc, item) => acc + item.quantity, 0));
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'cancelled') {
      setCancelledNotice(true);
      window.history.replaceState({}, '', '/cart');
    }
  }, []);

  const showFeedback = (msg) => { setFeedback(msg); setTimeout(() => setFeedback(''), 2000); };

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return;
    const updated = cart.map(item => item.id === id ? { ...item, quantity: newQty } : item);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    setCartCount(updated.reduce((acc, item) => acc + item.quantity, 0));
    showFeedback('Quantity updated');
  };

  const removeItem = (id) => {
    if (!window.confirm('Remove this item from your cart?')) return;
    const updated = cart.filter(item => item.id !== id);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    setCartCount(updated.reduce((acc, item) => acc + item.quantity, 0));
    showFeedback('Item removed');
  };

  const clearCart = () => {
    if (!window.confirm('Clear all items from your cart?')) return;
    setCart([]); localStorage.removeItem('cart'); setCartCount(0);
    showFeedback('Cart cleared');
  };

  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  return (
    <div className="crt-wrap">

      {/* Nav */}
      <nav className="crt-nav">
        <div className="crt-nav-left" onClick={() => navigate('/products')}>
          <img src="/android-chrome-192x192.png" alt="Logo" className="crt-nav-logo" />
          <div>
            <div className="crt-nav-name">ACHOICE <span>MARKET</span></div>
            <div className="crt-nav-motto">Your needs our solutions</div>
          </div>
        </div>
        <span className="crt-nav-back" onClick={() => navigate('/products')}>← Back to Marketplace</span>
        <div className="crt-nav-right">
          <div className="crt-cart-icon" onClick={() => navigate('/cart')}>
            🛒
            {cartCount > 0 && <span className="crt-cart-badge">{cartCount}</span>}
          </div>
          <BuyerDropdown cartCount={cartCount} />
        </div>
      </nav>

      {feedback && <div className="crt-toast">{feedback}</div>}

      {/* Cancelled Banner */}
      {cancelledNotice && (
        <div className="crt-banner">
          <div style={{ flex:1 }}>
            <div className="crt-banner-title">⚠️ Payment Incomplete</div>
            <div className="crt-banner-text">
              Your payment was cancelled or not completed. Your cart items are still here — review them and try again.
            </div>
          </div>
          <button className="crt-banner-close" onClick={() => setCancelledNotice(false)}>✕</button>
        </div>
      )}

      <div className="crt-container">
        <h1 className="crt-title">🛒 Your Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="crt-empty">
            <div className="crt-empty-icon">🛒</div>
            <p className="crt-empty-text">Your cart is empty</p>
            <button className="crt-empty-btn" onClick={() => navigate('/products')}>Start Shopping</button>
          </div>
        ) : (
          <div className="crt-layout">

            {/* Items */}
            <div>
              <div className="crt-items-header">
                <span className="crt-items-count">{cart.length} item{cart.length > 1 ? 's' : ''} in your basket</span>
                <button className="crt-clear-btn" onClick={clearCart}>Clear All</button>
              </div>

              {cart.map(item => (
                <div key={item.id} className="crt-item">
                  <div className="crt-item-img">
                    {item.image
                      ? <img src={item.image} alt={item.name} />
                      : <span style={{ fontSize:36 }}>🌿</span>}
                  </div>
                  <div className="crt-item-info">
                    <div className="crt-item-name">{item.name}</div>
                    <div className="crt-item-seller">{item.seller?.business_name || 'Verified ACHOICE Seller'}</div>
                    <div className="crt-item-price">₦{Number(item.price).toLocaleString()} / unit</div>
                  </div>
                  <div className="crt-item-actions">
                    <div className="crt-qty">
                      <button className="crt-qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span className="crt-qty-num">{item.quantity}</span>
                      <button className="crt-qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <div className="crt-item-total">₦{(Number(item.price) * item.quantity).toLocaleString()}</div>
                    <button className="crt-remove-btn" onClick={() => removeItem(item.id)}>Remove</button>
                  </div>
                </div>
              ))}

              {/* ✅ Keep Shopping — always visible on ALL screen sizes */}
              <button className="crt-continue-btn crt-keep-shopping"
                onClick={() => navigate('/products')}>
                ← Keep Shopping
              </button>
            </div>

            {/* Summary — desktop/tablet */}
            <div className="crt-summary-col">
              <div className="crt-summary">
                <h2 className="crt-summary-title">Order Summary</h2>
                <div className="crt-summary-row">
                  <span className="crt-summary-label">Subtotal ({cart.length} item{cart.length > 1 ? 's' : ''})</span>
                  <span className="crt-summary-val">₦{total.toLocaleString()}</span>
                </div>
                <div className="crt-summary-row">
                  <span className="crt-summary-label">Delivery fee</span>
                  <span className="crt-summary-val" style={{ color:'#888', fontWeight:400 }}>At checkout</span>
                </div>
                <div className="crt-divider" />
                <div className="crt-total-row">
                  <span className="crt-total-label">Total</span>
                  <span className="crt-total-val">₦{total.toLocaleString()}</span>
                </div>
                <button
                  className={cart.length === 0 ? 'crt-checkout-dis' : 'crt-checkout-btn'}
                  onClick={() => cart.length > 0 && navigate('/checkout')}
                  disabled={cart.length === 0}>
                  Proceed to Checkout →
                </button>
                <button className="crt-continue-btn" onClick={() => navigate('/products')}>
                  ← Keep Shopping
                </button>
                <div className="crt-security-note">
                  <span>🔒</span> Secured by Paystack
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Mobile sticky checkout bar */}
      {cart.length > 0 && (
        <div className="crt-mobile-checkout">
          <div className="crt-mobile-total">
            <div className="crt-mobile-total-label">Total</div>
            <div className="crt-mobile-total-val">₦{total.toLocaleString()}</div>
          </div>
          <button className="crt-mobile-checkout-btn" onClick={() => navigate('/checkout')}>
            Checkout →
          </button>
        </div>
      )}
    </div>
  );
}