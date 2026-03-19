import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSellers, createSeller } from '../../services/adminService';

export default function ManageSellersPage() {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '',
    business_name: '', business_address: '', state: '',
    lga: '', bank_name: '', account_number: '', account_name: '',
  });

  useEffect(() => {
    getSellers()
      .then((res) => setSellers(res.data.data || res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createSeller(formData);
      setSellers([...sellers, res.data.seller || res.data]);
      setShowForm(false);
      setFormData({
        name: '', email: '', phone: '', password: '',
        business_name: '', business_address: '', state: '',
        lga: '', bank_name: '', account_number: '', account_name: '',
      });
      showToast('Seller created successfully!');
    } catch (err) {
      showToast('Failed to create seller. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const nigerianStates = [
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue',
    'Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu',
    'FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi',
    'Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun',
    'Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara',
  ];

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
          <div style={{ ...s.sidebarItem, ...s.sidebarItemActive }}>
            <span style={s.sidebarIcon}>🏪</span> Sellers
          </div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/products')}>
            <span style={s.sidebarIcon}>🌾</span> Products
          </div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/orders')}>
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
          <div>
            <h1 style={s.headerTitle}>Manage Sellers</h1>
            <p style={s.headerSub}>{sellers.length} sellers registered on the platform</p>
          </div>
          <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add New Seller'}
          </button>
        </div>

        {/* Add Seller Form */}
        {showForm && (
          <div style={s.formCard}>
            <h2 style={s.formTitle}>Create New Seller Account</h2>
            <form onSubmit={handleSubmit}>
              <div style={s.formGrid}>
                <div style={s.field}>
                  <label style={s.label}>Full Name</label>
                  <input style={s.input} type="text" name="name"
                    placeholder="Seller full name" value={formData.name}
                    onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Email</label>
                  <input style={s.input} type="email" name="email"
                    placeholder="seller@email.com" value={formData.email}
                    onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Phone</label>
                  <input style={s.input} type="tel" name="phone"
                    placeholder="08012345678" value={formData.phone}
                    onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Password</label>
                  <input style={s.input} type="password" name="password"
                    placeholder="Set a password" value={formData.password}
                    onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Business Name</label>
                  <input style={s.input} type="text" name="business_name"
                    placeholder="Business name" value={formData.business_name}
                    onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Business Address</label>
                  <input style={s.input} type="text" name="business_address"
                    placeholder="Business address" value={formData.business_address}
                    onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>State</label>
                  <select style={s.input} name="state" value={formData.state}
                    onChange={handleChange} required>
                    <option value="">Select state</option>
                    {nigerianStates.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>LGA</label>
                  <input style={s.input} type="text" name="lga"
                    placeholder="Local Government Area" value={formData.lga}
                    onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Bank Name</label>
                  <input style={s.input} type="text" name="bank_name"
                    placeholder="Bank name" value={formData.bank_name}
                    onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Account Number</label>
                  <input style={s.input} type="text" name="account_number"
                    placeholder="10-digit account number" value={formData.account_number}
                    onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Account Name</label>
                  <input style={s.input} type="text" name="account_name"
                    placeholder="Account name" value={formData.account_name}
                    onChange={handleChange} required />
                </div>
              </div>
              <button style={submitting ? s.submitBtnDisabled : s.submitBtn}
                type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Seller Account'}
              </button>
            </form>
          </div>
        )}

        {loading && <p style={s.message}>Loading sellers...</p>}

        {!loading && sellers.length === 0 && (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>🏪</div>
            <p style={s.emptyText}>No sellers yet. Add your first seller above.</p>
          </div>
        )}

        {/* Sellers Table */}
        {sellers.length > 0 && (
          <div style={s.tableCard}>
            <table style={s.table}>
              <thead>
                <tr style={s.tableHead}>
                  <th style={s.th}>Business</th>
                  <th style={s.th}>Contact</th>
                  <th style={s.th}>Location</th>
                  <th style={s.th}>Bank</th>
                  <th style={s.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller.id} style={s.tableRow}>
                    <td style={s.td}>
                      <div style={s.sellerName}>{seller.business_name}</div>
                      <div style={s.sellerMeta}>{seller.user ? seller.user.name : ''}</div>
                    </td>
                    <td style={s.td}>
                      <div style={s.sellerMeta}>{seller.user ? seller.user.email : ''}</div>
                      <div style={s.sellerMeta}>{seller.user ? seller.user.phone : ''}</div>
                    </td>
                    <td style={s.td}>
                      <div style={s.sellerMeta}>{seller.state}</div>
                      <div style={s.sellerMeta}>{seller.lga}</div>
                    </td>
                    <td style={s.td}>
                      <div style={s.sellerMeta}>{seller.bank_name}</div>
                      <div style={s.sellerMeta}>{seller.account_number}</div>
                    </td>
                    <td style={s.td}>
                      <div style={{
                        ...s.statusBadge,
                        background: seller.status === 'active' ? '#eafaf0' : '#fff0f0',
                        color: seller.status === 'active' ? '#1a7a3a' : '#cc0000',
                      }}>
                        {seller.status}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 4 },
  headerSub: { fontSize: 14, color: '#888' },
  addBtn: { padding: '10px 20px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  formCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 28, marginBottom: 24 },
  formTitle: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 20 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  field: { marginBottom: 4 },
  label: { display: 'block', fontSize: 13, color: '#333', fontWeight: 500, marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  submitBtn: { padding: '11px 28px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtnDisabled: { padding: '11px 28px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'not-allowed', fontFamily: 'inherit' },
  message: { textAlign: 'center', color: '#666', padding: 40 },
  emptyBox: { textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#888' },
  tableCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { background: '#f7f5f0' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { borderTop: '1px solid #f0f0f0' },
  td: { padding: '14px 16px', verticalAlign: 'top' },
  sellerName: { fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 2 },
  sellerMeta: { fontSize: 12, color: '#888', marginBottom: 2 },
  statusBadge: { display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, textTransform: 'capitalize' },
};