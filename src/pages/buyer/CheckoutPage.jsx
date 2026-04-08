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
    if (saved.length === 0) navigate('/products');
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
        localStorage.removeItem('cart'); // Clear cart before redirecting
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

      {/* Branded Navbar */}
      <nav style={s.nav}>
        <div style={s.navLeft} onClick={() => navigate('/products')}>
          <img src="/android-chrome-192x192.png" alt="Logo" style={s.logoImg} />
          <div style={s.logoText}>ACHOICE <span style={{color: '#f0c050'}}>MARKET</span></div>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => navigate('/cart')}>
            ← Return to Cart
          </span>
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
                  disabled={loading}
                >
                  {loading ? 'Finalizing Order...' : 'Confirm and Pay Now'}
                </button>

              </form>
            </div>
          </div>

          {/* Order Summary Sideboard */}
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

              <div style={s.totalRow}>
                <span style={s.totalLabel}>Grand Total</span>
                <span style={s.totalValue}>₦{total.toLocaleString()}</span>
              </div>

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
  navLeft: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' },
  logoImg: { width: '35px', height: '35px', borderRadius: '4px' },
  logoText: { fontWeight: 'bold', fontSize: '18px' },
  navLinks: { display: 'flex', gap: 24, alignItems: 'center' },
  navLink: { color: '#f0c050', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '40px 16px' },
  pageTitle: { fontSize: 28, fontWeight: 700, color: '#1f4d1f', marginBottom: 32 },
  error: { background: '#fff0f0', color: '#cc0000', padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontSize: 14, border: '1px solid #cc0000' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 30 },
  formCol: {},
  card: { background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 30 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f4d1f', marginBottom: 25 },
  field: { marginBottom: 20, flex: 1 },
  row: { display: 'flex', gap: 16 },
  label: { display: 'block', fontSize: 13, color: '#666', fontWeight: '600', marginBottom: 8 },
  input: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' },
  btn: { width: '100%', padding: '16px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  btnDisabled: { width: '100%', padding: '16px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'not-allowed' },
  summaryCol: {},
  summaryCard: { background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 25, position: 'sticky', top: 100 },
  itemList: { maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  summaryItem: { display: 'flex', gap: 8, alignItems: 'center' },
  summaryName: { fontSize: 14, color: '#333', fontWeight: '500' },
  summaryQty: { fontSize: 12, color: '#1f4d1f', fontWeight: 'bold' },
  summaryPrice: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  divider: { height: 1, background: '#eee', margin: '20px 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  totalValue: { fontSize: 24, fontWeight: '900', color: '#1f4d1f' },
  paystackSection: { textAlign: 'center', background: '#f9f9f9', padding: '15px', borderRadius: '8px' },
  paystackLogo: { height: '20px', marginBottom: '8px' },
  paystackNote: { fontSize: 11, color: '#888', margin: 0 },
};