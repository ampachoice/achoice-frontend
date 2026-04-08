import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function LoanSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    interest_rate: '10.00',
    min_amount: '50000',
    max_amount: '5000000',
    duration_options: '3,6,9,12',
    allowed_purposes: 'Farm Expansion,Equipment Purchase,Seeds and Fertilizer,Irrigation Setup,Processing and Storage,Working Capital,Other',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('loan_settings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await api.post('/admin/loan-settings', settings);
      localStorage.setItem('loan_settings', JSON.stringify(settings));
      setMessage('Loan settings saved successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      localStorage.setItem('loan_settings', JSON.stringify(settings));
      setMessage('Settings saved locally. Backend sync pending.');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const durationOptions = settings.duration_options.split(',').map(d => d.trim()).filter(Boolean);
  const purposeList = settings.allowed_purposes.split(',').map(p => p.trim()).filter(Boolean);

  return (
    <div style={s.page}>
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
          <div style={s.sidebarItem} onClick={() => navigate('/admin/orders')}>
            <span style={s.sidebarIcon}>📦</span> Orders
          </div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/loans')}>
            <span style={s.sidebarIcon}>💰</span> Loans
          </div>
          <div style={{ ...s.sidebarItem, ...s.sidebarItemActive }}>
            <span style={s.sidebarIcon}>⚙️</span> Loan Settings
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
            <h1 style={s.headerTitle}>Loan Settings</h1>
            <p style={s.headerSub}>Configure default values for all loan applications</p>
          </div>
        </div>

        <div style={s.layout}>
          {/* Settings Form */}
          <div style={s.formCard}>
            <h2 style={s.formTitle}>Global Loan Configuration</h2>
            <p style={s.formSub}>These settings control what buyers see when applying for a loan.</p>

            {message && <div style={s.success}>{message}</div>}
            {error && <div style={s.errorMsg}>{error}</div>}

            <form onSubmit={handleSave}>
              <div style={s.field}>
                <label style={s.label}>Default Interest Rate (%)</label>
                <input
                  style={s.input}
                  type="number"
                  step="0.01"
                  name="interest_rate"
                  value={settings.interest_rate}
                  onChange={handleChange}
                  placeholder="e.g. 10.00"
                  required
                />
                <div style={s.hint}>This rate is applied to all approved loans (e.g. 10 = 10% flat)</div>
              </div>

              <div style={s.fieldRow}>
                <div style={s.field}>
                  <label style={s.label}>Minimum Loan Amount (₦)</label>
                  <input
                    style={s.input}
                    type="number"
                    name="min_amount"
                    value={settings.min_amount}
                    onChange={handleChange}
                    placeholder="e.g. 50000"
                    required
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Maximum Loan Amount (₦)</label>
                  <input
                    style={s.input}
                    type="number"
                    name="max_amount"
                    value={settings.max_amount}
                    onChange={handleChange}
                    placeholder="e.g. 5000000"
                    required
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Duration Options (months, comma separated)</label>
                <input
                  style={s.input}
                  type="text"
                  name="duration_options"
                  value={settings.duration_options}
                  onChange={handleChange}
                  placeholder="e.g. 3,6,9,12"
                  required
                />
                <div style={s.hint}>Buyers will see these as dropdown options when applying</div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Allowed Loan Purposes (comma separated)</label>
                <textarea
                  style={{ ...s.input, height: 100, resize: 'vertical' }}
                  name="allowed_purposes"
                  value={settings.allowed_purposes}
                  onChange={handleChange}
                  placeholder="e.g. Farm Expansion, Equipment Purchase"
                  required
                />
                <div style={s.hint}>These will appear in the Purpose dropdown on the loan application form</div>
              </div>

              <button
                style={loading ? s.submitBtnDisabled : s.submitBtn}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Loan Settings'}
              </button>
            </form>
          </div>

          {/* Preview Panel */}
          <div style={s.previewCol}>
            <div style={s.previewCard}>
              <div style={s.previewTitle}>Live Preview</div>
              <p style={s.previewSub}>This is what buyers will see</p>

              <div style={s.previewItem}>
                <div style={s.previewLabel}>Interest Rate</div>
                <div style={s.previewValue}>{settings.interest_rate}% flat</div>
              </div>

              <div style={s.previewItem}>
                <div style={s.previewLabel}>Loan Range</div>
                <div style={s.previewValue}>
                  ₦{Number(settings.min_amount).toLocaleString()} — ₦{Number(settings.max_amount).toLocaleString()}
                </div>
              </div>

              <div style={s.previewItem}>
                <div style={s.previewLabel}>Duration Options</div>
                <div style={s.durationTags}>
                  {durationOptions.map((d) => (
                    <div key={d} style={s.durationTag}>{d} months</div>
                  ))}
                </div>
              </div>

              <div style={s.previewItem}>
                <div style={s.previewLabel}>Allowed Purposes</div>
                <div style={s.purposeList}>
                  {purposeList.map((p) => (
                    <div key={p} style={s.purposeItem}>• {p}</div>
                  ))}
                </div>
              </div>
            </div>

            <div style={s.calcCard}>
              <div style={s.calcTitle}>Sample Calculation</div>
              <div style={s.calcDesc}>For a ₦500,000 loan at {settings.interest_rate}% for {durationOptions[1] || 6} months:</div>
              <div style={s.calcRow}>
                <span style={s.calcLabel}>Principal</span>
                <span style={s.calcValue}>₦500,000</span>
              </div>
              <div style={s.calcRow}>
                <span style={s.calcLabel}>Interest ({settings.interest_rate}%)</span>
                <span style={s.calcValue}>₦{(500000 * Number(settings.interest_rate) / 100).toLocaleString()}</span>
              </div>
              <div style={s.calcDivider}></div>
              <div style={s.calcRow}>
                <span style={s.calcLabel}>Total Repayable</span>
                <span style={s.calcTotal}>₦{(500000 * (1 + Number(settings.interest_rate) / 100)).toLocaleString()}</span>
              </div>
              <div style={s.calcRow}>
                <span style={s.calcLabel}>Monthly Instalment</span>
                <span style={s.calcTotal}>
                  ₦{Math.ceil((500000 * (1 + Number(settings.interest_rate) / 100)) / (Number(durationOptions[1]) || 6)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif' },
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
  header: { marginBottom: 28 },
  headerTitle: { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 4 },
  headerSub: { fontSize: 14, color: '#888' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 },
  formCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 28 },
  formTitle: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 6 },
  formSub: { fontSize: 13, color: '#888', marginBottom: 24 },
  success: { background: '#eafaf0', color: '#1a7a3a', padding: '12px 16px', borderRadius: 6, marginBottom: 20, fontSize: 13, border: '1px solid #c8e6c9' },
  errorMsg: { background: '#fff0f0', color: '#cc0000', padding: '12px 16px', borderRadius: 6, marginBottom: 20, fontSize: 13 },
  field: { marginBottom: 20, flex: 1 },
  fieldRow: { display: 'flex', gap: 16, marginBottom: 4 },
  label: { display: 'block', fontSize: 13, color: '#333', fontWeight: 500, marginBottom: 6 },
  input: { width: '100%', padding: '11px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  hint: { fontSize: 11, color: '#888', marginTop: 4 },
  submitBtn: { width: '100%', padding: '13px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtnDisabled: { width: '100%', padding: '13px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, cursor: 'not-allowed', fontFamily: 'inherit' },
  previewCol: { display: 'flex', flexDirection: 'column', gap: 16 },
  previewCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 20 },
  previewTitle: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 },
  previewSub: { fontSize: 12, color: '#888', marginBottom: 16 },
  previewItem: { marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f0f0f0' },
  previewLabel: { fontSize: 11, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  previewValue: { fontSize: 14, fontWeight: 600, color: '#111' },
  durationTags: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  durationTag: { background: '#f0f7ec', color: '#1f4d1f', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99 },
  purposeList: { display: 'flex', flexDirection: 'column', gap: 4 },
  purposeItem: { fontSize: 13, color: '#555' },
  calcCard: { background: '#1f4d1f', borderRadius: 10, padding: 20 },
  calcTitle: { fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 },
  calcDesc: { fontSize: 12, color: '#a8d5a8', marginBottom: 16 },
  calcRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  calcLabel: { fontSize: 13, color: '#a8d5a8' },
  calcValue: { fontSize: 13, color: '#fff', fontWeight: 500 },
  calcDivider: { height: 1, background: 'rgba(255,255,255,0.15)', margin: '10px 0' },
  calcTotal: { fontSize: 15, fontWeight: 700, color: '#f0c050' },
};