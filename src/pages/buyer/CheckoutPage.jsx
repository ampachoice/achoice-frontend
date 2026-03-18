import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../../services/orderService';

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

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cart') || '[]');
    if (saved.length === 0) navigate('/cart');
    setCart(saved);
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity, 0
  );

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
      };
      const res = await createOrder(orderData);
      // Paystack payment URL returned from backend
      if (res.data.payment_url) {
        localStorage.removeItem('cart');
        window.location.href = res.data.payment_url;
      } else {
        localStorage.removeItem('cart');
        navigate('/orders');
      }
    } catch (err) {
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nigerianStates = [
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
        <div style={s.navLogo} onClick={() => navigate('/')}>
          ACHOICE <span style={s.navAccent}>LIMITED</span>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => navigate('/cart')}>
            Back to Cart
          </span>
        </div>
      </nav>

      <div style={s.container}>
        <h1 style={s.pageTitle}>Checkout</h1>

        {error && <div style={s.error}>{error}</div>}

        <div style={s.layout}>

          {/* Delivery Form */}
          <div style={s.formCol}>
            <div style={s.card}>
              <h2 style={s.cardTitle}>Delivery Information</h2>
              <form onSubmit={handleSubmit}>

                <div style={s.field}>
                  <label style={s.label}>Delivery Address</label>
                  <input
                    style={s.input}
                    type="text"
                    name="delivery_address"
                    placeholder="Enter your delivery address"
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
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>LGA</label>
                    <input
                      style={s.input}
                      type="text"
                      name="delivery_lga"
                      placeholder="Enter your LGA"
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
                    placeholder="Any special instructions for your order?"
                    value={formData.note}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <button
                  style={loading ? s.btnDisabled : s.btn}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Place Order & Pay'}
                </button>

              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div style={s.summaryCol}>
            <div style={s.summaryCard}>
              <h2 style={s.cardTitle}>Order Summary</h2>

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

              <div style={s.divider}></div>

              <div style={s.totalRow}>
                <span style={s.totalLabel}>Total</span>
                <span style={s.totalValue}>₦{total.toLocaleString()}</span>
              </div>

              <div style={s.paystackNote}>
                Payment powered by Paystack
              </div>
            </div>
          </div>

        </div>
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
  container: { maxWidth: '1000px', margin: '0 auto', padding: '40px 16px' },
  pageTitle: { fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 32 },
  error: { background: '#fff0f0', color: '#cc0000', padding: '12px 16px', borderRadius: 7, marginBottom: 24, fontSize: 14 },
  layout: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 },
  formCol: {},
  card: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 28 },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 24 },
  field: { marginBottom: 18, flex: 1 },
  row: { display: 'flex', gap: 16 },
  label: { display: 'block', fontSize: 13, color: '#333', fontWeight: 500, marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 5, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 5, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' },
  btn: { width: '100%', padding: '14px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 7, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDisabled: { width: '100%', padding: '14px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 7, fontSize: 15, fontWeight: 500, cursor: 'not-allowed', fontFamily: 'inherit' },
  summaryCol: {},
  summaryCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 24, position: 'sticky', top: 20 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryItem: { display: 'flex', gap: 8, alignItems: 'center' },
  summaryName: { fontSize: 13, color: '#333' },
  summaryQty: { fontSize: 12, color: '#888' },
  summaryPrice: { fontSize: 13, fontWeight: 500, color: '#333' },
  divider: { height: 1, background: '#eee', margin: '16px 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 16, fontWeight: 700, color: '#111' },
  totalValue: { fontSize: 22, fontWeight: 700, color: '#1f4d1f' },
  paystackNote: { textAlign: 'center', fontSize: 12, color: '#888', padding: '12px 0', borderTop: '1px solid #eee' },
};