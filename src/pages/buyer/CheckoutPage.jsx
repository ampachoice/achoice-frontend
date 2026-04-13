import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../../services/orderService';
import api from '../../services/api';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    delivery_address: '',
    delivery_state: '',
    delivery_lga: '',
    note: '',
  });

  // ✅ Delivery fee state
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState([]); // all zones for state dropdown

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cart') || '[]');
    if (saved.length === 0) navigate('/products');
    setCart(saved);

    // ✅ Fetch all delivery zones to populate state dropdown with fee info
    api.get('/delivery-zones')
      .then((res) => {
        const zones = res.data?.data || res.data || [];
        setDeliveryZones(zones);
      })
      .catch(() => setDeliveryZones([]));
  }, [navigate]);

  // ✅ Fetch delivery fee whenever state changes
  useEffect(() => {
    if (!formData.delivery_state) {
      setDeliveryFee(0);
      setDeliveryDays(null);
      return;
    }
    setDeliveryLoading(true);
    api.get(`/delivery-zones/${encodeURIComponent(formData.delivery_state)}`)
      .then((res) => {
        const zone = res.data?.data || res.data;
        setDeliveryFee(Number(zone?.delivery_fee || zone?.fee || 0));
        setDeliveryDays(zone?.estimated_days || zone?.days || null);
      })
      .catch(() => {
        // Fallback: try to find fee from the already-loaded zones list
        const match = deliveryZones.find(
          (z) => z.state?.toLowerCase() === formData.delivery_state.toLowerCase()
        );
        setDeliveryFee(Number(match?.delivery_fee || match?.fee || 0));
        setDeliveryDays(match?.estimated_days || match?.days || null);
      })
      .finally(() => setDeliveryLoading(false));
  }, [formData.delivery_state]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity, 0
  );
  const grandTotal = subtotal + deliveryFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const orderData = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        delivery_address: formData.delivery_address,
        delivery_state: formData.delivery_state,
        delivery_lga: formData.delivery_lga,
        note: formData.note,
        delivery_fee: deliveryFee, // ✅ send fee to backend
      };

      const res = await createOrder(orderData);

      if (res.data.payment_url) {
        localStorage.removeItem('cart');
        window.location.href = res.data.payment_url;
      } else {
        localStorage.removeItem('cart');
        navigate('/orders');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Use zones from API if available, fallback to hardcoded list
  const nigerianStates = deliveryZones.length > 0
    ? deliveryZones.map((z) => z.state)
    : [
        'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
        'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
        'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
        'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
        'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
      ];

  return (
    <div style={s.page}>

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navLeft} onClick={() => navigate('/products')}>
          <img src="/android-chrome-192x192.png" alt="Logo" style={s.logoImg} />
          <div style={s.logoText}>ACHOICE <span style={{ color: '#f0c050' }}>MARKET</span></div>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => navigate('/cart')}>← Return to Cart</span>
        </div>
      </nav>

      <div style={s.container}>
        <h1 style={s.pageTitle}>Secure Checkout</h1>

        {error && <div style={s.error}>{error}</div>}

        <div style={s.layout}>

          {/* Delivery Form */}
          <div style={s.formCol}>
            <div style={s.card}>
              <h2 style={s.cardTitle}>Delivery Details</h2>
              <form onSubmit={handleSubmit}>

                <div style={s.field}>
                  <label style={s.label}>Full Delivery Address</label>
                  <input
                    style={s.input}
                    type="text"
                    name="delivery_address"
                    placeholder="House number, street name..."
                    value={formData.delivery_address}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div style={s.row}>
                  <div style={s.field}>
                    <label style={s.label}>State</label>
                    <select
                      style={s.input}
                      name="delivery_state"
                      value={formData.delivery_state}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select state</option>
                      {nigerianStates.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {/* ✅ Show delivery info below state dropdown */}
                    {deliveryLoading && (
                      <div style={s.deliveryHint}>Fetching delivery fee...</div>
                    )}
                    {!deliveryLoading && formData.delivery_state && deliveryFee > 0 && (
                      <div style={s.deliveryInfoBox}>
                        🚚 Delivery to <strong>{formData.delivery_state}</strong>:{' '}
                        <strong>₦{deliveryFee.toLocaleString()}</strong>
                        {deliveryDays && (
                          <span style={s.deliveryDays}> · Est. {deliveryDays} day{deliveryDays > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    )}
                    {!deliveryLoading && formData.delivery_state && deliveryFee === 0 && (
                      <div style={{ ...s.deliveryInfoBox, background: '#f0fff4', color: '#1f4d1f' }}>
                        🎉 Free delivery to <strong>{formData.delivery_state}</strong>!
                        {deliveryDays && (
                          <span style={s.deliveryDays}> · Est. {deliveryDays} day{deliveryDays > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>LGA</label>
                    <input
                      style={s.input}
                      type="text"
                      name="delivery_lga"
                      placeholder="Local Govt Area"
                      value={formData.delivery_lga}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div style={s.field}>
                  <label style={s.label}>Order Note (optional)</label>
                  <textarea
                    style={s.textarea}
                    name="note"
                    placeholder="Special instructions for the rider..."
                    value={formData.note}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <button
                  style={loading ? s.btnDisabled : s.btn}
                  type="submit"
                  disabled={loading || !formData.delivery_state}
                >
                  {loading ? 'Finalizing Order...' : 'Confirm and Pay Now'}
                </button>

              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div style={s.summaryCol}>
            <div style={s.summaryCard}>
              <h2 style={s.cardTitle}>Order Summary</h2>

              <div style={s.itemList}>
                {cart.map((item) => (
                  <div key={item.id} style={s.summaryRow}>
                    <div style={s.summaryItem}>
                      <span style={s.summaryName}>{item.name}</span>
                      <span style={s.summaryQty}>x{item.quantity}</span>
                    </div>
                    <span style={s.summaryPrice}>
                      ₦{(Number(item.price) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div style={s.divider}></div>

              {/* ✅ Subtotal row */}
              <div style={s.summaryRow}>
                <span style={s.subLabel}>Subtotal</span>
                <span style={s.subValue}>₦{subtotal.toLocaleString()}</span>
              </div>

              {/* ✅ Delivery fee row */}
              <div style={s.summaryRow}>
                <span style={s.subLabel}>
                  Delivery fee
                  {formData.delivery_state ? ` (${formData.delivery_state})` : ''}
                </span>
                <span style={s.subValue}>
                  {deliveryLoading
                    ? '...'
                    : formData.delivery_state
                      ? deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`
                      : '— select state'}
                </span>
              </div>

              <div style={s.divider}></div>

              {/* ✅ Grand total */}
              <div style={s.totalRow}>
                <span style={s.totalLabel}>Grand Total</span>
                <span style={s.totalValue}>₦{grandTotal.toLocaleString()}</span>
              </div>

              {deliveryDays && formData.delivery_state && (
                <div style={s.estimatedDelivery}>
                  📦 Estimated delivery: <strong>{deliveryDays} day{deliveryDays > 1 ? 's' : ''}</strong> to {formData.delivery_state}
                </div>
              )}

              <div style={s.paystackSection}>
                <img
                  src="https://checkout.paystack.com/static/media/paystack-badge.62899bc5.png"
                  alt="Secure by Paystack"
                  style={s.paystackLogo}
                />
                <p style={s.paystackNote}>Your transaction is encrypted and secure.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#fcfbf7', fontFamily: 'Arial, sans-serif' },
  nav: { background: '#1f4d1f', padding: '12px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', position: 'sticky', top: 0, zIndex: 100 },
  navLeft: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' },
  logoImg: { width: 35, height: 35, borderRadius: 4 },
  logoText: { fontWeight: 'bold', fontSize: 18 },
  navLinks: { display: 'flex', gap: 24, alignItems: 'center' },
  navLink: { color: '#f0c050', fontSize: 14, cursor: 'pointer', fontWeight: 'bold' },
  container: { maxWidth: 1100, margin: '0 auto', padding: '40px 16px' },
  pageTitle: { fontSize: 28, fontWeight: 700, color: '#1f4d1f', marginBottom: 32 },
  error: { background: '#fff0f0', color: '#cc0000', padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontSize: 14, border: '1px solid #ffcccc' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 30 },
  formCol: {},
  card: { background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 30 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f4d1f', marginBottom: 25 },
  field: { marginBottom: 20, flex: 1 },
  row: { display: 'flex', gap: 16 },
  label: { display: 'block', fontSize: 13, color: '#666', fontWeight: 600, marginBottom: 8 },
  input: { width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  textarea: { width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },

  // ✅ Delivery fee UI
  deliveryHint: { fontSize: 12, color: '#888', marginTop: 6 },
  deliveryInfoBox: { marginTop: 8, background: '#fff8e7', border: '1px solid #f0c050', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#7a5c00' },
  deliveryDays: { color: '#888', fontSize: 12 },
  estimatedDelivery: { fontSize: 13, color: '#555', background: '#f7f5f0', padding: '10px 14px', borderRadius: 6, marginBottom: 16 },

  btn: { width: '100%', padding: 16, background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer', marginTop: 10 },
  btnDisabled: { width: '100%', padding: 16, background: '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'not-allowed', marginTop: 10 },

  summaryCol: {},
  summaryCard: { background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 25, position: 'sticky', top: 100 },
  itemList: { maxHeight: 300, overflowY: 'auto', marginBottom: 15 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryItem: { display: 'flex', gap: 8, alignItems: 'center' },
  summaryName: { fontSize: 14, color: '#333', fontWeight: 500 },
  summaryQty: { fontSize: 12, color: '#1f4d1f', fontWeight: 'bold' },
  summaryPrice: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  subLabel: { fontSize: 14, color: '#666' },
  subValue: { fontSize: 14, fontWeight: 600, color: '#333' },
  divider: { height: 1, background: '#eee', margin: '16px 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  totalValue: { fontSize: 24, fontWeight: 900, color: '#1f4d1f' },
  paystackSection: { textAlign: 'center', background: '#f9f9f9', padding: 15, borderRadius: 8 },
  paystackLogo: { height: 20, marginBottom: 8 },
  paystackNote: { fontSize: 11, color: '#888', margin: 0 },
};
