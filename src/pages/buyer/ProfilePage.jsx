import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import BuyerDropdown from '../../components/buyer/BuyerDropdown';
import NotificationBell from '../../components/buyer/NotificationBell';

const LOGO_PATH = '/achoice logo.png';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [cartCount, setCartCount] = useState(0);
  const [profileForm, setProfileForm] = useState({
    name: '', email: '', phone: '', address: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '', password: '', password_confirmation: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false, new: false, confirm: false,
  });

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((acc, item) => acc + (item.quantity || 0), 0));
    api.get('/me')
      .then((res) => {
        const u = res.data.user || res.data;
        setUser(u);
        setProfileForm({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          address: u.address || '',
        });
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/profile', profileForm);
      const updated = res.data.user || res.data;
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.password_confirmation) {
      showToast('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/profile/password', passwordForm);
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      showToast('Password changed successfully!');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={s.center}>Loading profile...</div>;

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      <style>{`
        /* ── Top Bar ── */
        .pf-topbar { background:#1f4d1f; color:#fff; padding:8px 60px; display:flex; justify-content:space-between; font-size:12px; flex-wrap:wrap; gap:6px; }
        .pf-topbar-left, .pf-topbar-right { display:flex; gap:24px; flex-wrap:wrap; }

        /* ── Navbar ── */
        .pf-nav { background:#1f4d1f; padding:14px 60px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; position:sticky; top:0; z-index:100; gap:12px; flex-wrap:wrap; }
        .pf-nav-brand { display:flex; align-items:center; gap:10px; cursor:pointer; flex-shrink:0; }
        .pf-nav-logo-img { width:45px; height:45px; object-fit:contain; }
        .pf-nav-logo-name { font-size:15px; font-weight:700; color:#fff; }
        .pf-nav-logo-tag { font-size:10px; color:#888; }
        .pf-nav-links { display:flex; gap:28px; align-items:center; flex-wrap:wrap; }
        .pf-nav-link { color:#fff; font-size:14px; cursor:pointer; white-space:nowrap; }
        .pf-cart-badge { background:#f0c050; color:#1a1a1a; font-size:10px; font-weight:700; border-radius:50%; padding:1px 5px; margin-left:4px; }
        .pf-nav-right { display:flex; align-items:center; gap:14px; flex-shrink:0; margin-left:auto; }

        /* ── Container ── */
        .pf-container { max-width:900px; margin:0 auto; padding:32px 16px; flex:1; }

        /* ── Hero ── */
        .pf-hero-card { background:#1a3d1a; border-radius:12px; padding:28px 32px; display:flex; align-items:center; gap:24px; margin-bottom:16px; }
        .pf-profile-meta { display:flex; gap:20px; flex-wrap:wrap; }

        /* ── Quick stats ── */
        .pf-quick-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }

        /* ── Form grid ── */
        .pf-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px; }

        /* ── Footer ── */
        .pf-footer { background:#1f4d1f; padding:20px 60px; margin-top:auto; }
        .pf-footer-bottom { display:flex; justify-content:space-between; font-size:12px; color:#a8d5a8; flex-wrap:wrap; gap:8px; }

        /* ── Card ── */
        .pf-card { background:#fff; border-radius:12px; border:1px solid #e8e4dc; padding:32px; }

        /* ── TABLET ── */
        @media (max-width:900px) {
          .pf-topbar { padding:8px 24px; }
          .pf-nav { padding:12px 24px; }
          .pf-container { padding:28px 20px; }
          .pf-footer { padding:18px 24px; }
        }

        /* ── MOBILE ── */
        @media (max-width:640px) {
          .pf-topbar { display:none; }
          .pf-nav { padding:10px 16px; justify-content:space-between; }
          .pf-nav-links { display:none; }
          .pf-nav-logo-img { width:36px; height:36px; }
          .pf-nav-logo-name { font-size:13px; }
          .pf-nav-logo-tag { display:none; }

          .pf-container { padding:18px 12px; }

          .pf-hero-card { flex-direction:column; text-align:center; padding:24px 20px; gap:16px; }
          .pf-profile-meta { flex-direction:column; gap:8px; align-items:center; }

          .pf-quick-stats { grid-template-columns:repeat(2,1fr); }

          .pf-card { padding:20px 16px; }
          .pf-form-grid { grid-template-columns:1fr; gap:14px; }

          .pf-tabs { flex-direction:column; }
          .pf-tabs button { width:100%; box-sizing:border-box; }

          .pf-footer { padding:16px 16px; }
          .pf-footer-bottom { flex-direction:column; text-align:center; gap:6px; }
        }

        @media (max-width:380px) {
          .pf-quick-stats { grid-template-columns:1fr 1fr; gap:8px; }
          .pf-quick-stat-icon { font-size:20px !important; }
        }
      `}</style>

      {/* Top Bar */}
      <div className="pf-topbar">
        <div className="pf-topbar-left">
          <span>📍 No 6 faith avenue off ekenwan Rd Benin City</span>
          <span>✉️ support@achoice.ng</span>
        </div>
        <div className="pf-topbar-right">
          <span>📞 09067794991</span>
          <span>Mon - Sat: 07:00am to 06:00pm</span>
        </div>
      </div>

      {/* Navbar */}
      <nav className="pf-nav">
        <div className="pf-nav-brand" onClick={() => navigate('/')}>
          <img src={LOGO_PATH} alt="Achoice Logo" className="pf-nav-logo-img" />
          <div>
            <div className="pf-nav-logo-name">ACHOICE LIMITED</div>
            <div className="pf-nav-logo-tag">Your needs our solutions</div>
          </div>
        </div>
        <div className="pf-nav-links">
          <span className="pf-nav-link" onClick={() => navigate('/')}>Home</span>
          <span className="pf-nav-link" onClick={() => navigate('/orders')}>My Orders</span>
          <span className="pf-nav-link" onClick={() => navigate('/cart')}>
            Cart {cartCount > 0 && <span className="pf-cart-badge">{cartCount}</span>}
          </span>
        </div>
        <div className="pf-nav-right">
          <NotificationBell />
          <BuyerDropdown cartCount={cartCount} />
        </div>
      </nav>

      <div className="pf-container">
        {/* Profile Header */}
        <div style={s.profileHeader}>
          <div className="pf-hero-card">
            <div style={s.avatarLarge}>{initial}</div>
            <div style={s.profileInfo}>
              <h1 style={s.profileName}>{user?.name}</h1>
              <div style={s.profileEmail}>{user?.email}</div>
              <div className="pf-profile-meta">
                <span style={s.profileMetaItem}>
                  📱 {user?.phone || 'No phone added'}
                </span>
                <span style={s.profileMetaItem}>
                  📅 Member since {new Date(user?.created_at || Date.now()).toLocaleDateString('en-NG', { year:'numeric', month: 'long' })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="pf-quick-stats">
            <div style={s.quickStat} onClick={() => navigate('/orders')}>
              <div className="pf-quick-stat-icon" style={s.quickStatIcon}>📦</div>
              <div style={s.quickStatLabel}>My Orders</div>
            </div>
            <div style={s.quickStat} onClick={() => navigate('/loans/repay')}>
              <div className="pf-quick-stat-icon" style={s.quickStatIcon}>💰</div>
              <div style={s.quickStatLabel}>My Loans</div>
            </div>
            <div style={s.quickStat} onClick={() => navigate('/cart')}>
              <div className="pf-quick-stat-icon" style={s.quickStatIcon}>🛒</div>
              <div style={s.quickStatLabel}>My Cart</div>
            </div>
            <div style={s.quickStat} onClick={() => navigate('/loans/apply')}>
              <div className="pf-quick-stat-icon" style={s.quickStatIcon}>📋</div>
              <div style={s.quickStatLabel}>Apply for Loan</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="pf-tabs" style={s.tabs}>
          <button
            style={activeTab === 'profile' ? s.tabActive : s.tab}
            onClick={() => setActiveTab('profile')}
          >
            Profile Information
          </button>
          <button
            style={activeTab === 'password' ? s.tabActive : s.tab}
            onClick={() => setActiveTab('password')}
          >
            Change Password
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="pf-card">
            <h2 style={s.cardTitle}>Personal Information</h2>
            <p style={s.cardSub}>Update your name, phone and address details.</p>
            <form onSubmit={handleProfileSave}>
              <div className="pf-form-grid">
                <div style={s.field}>
                  <label style={s.label}>Full Name</label>
                  <input
                    style={s.input}
                    type="text"
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Email Address</label>
                  <input
                    style={{ ...s.input, background: '#f7f5f0', color: '#888' }}
                    type="email"
                    value={profileForm.email}
                    disabled
                  />
                  <div style={s.hint}>Email cannot be changed</div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Phone Number</label>
                  <input
                    style={s.input}
                    type="tel"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="e.g. 08012345678"
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Delivery Address</label>
                  <input
                    style={s.input}
                    type="text"
                    value={profileForm.address}
                    onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                    placeholder="Your default delivery address"
                  />
                </div>
              </div>
              <button
                type="submit"
                style={saving ? s.submitBtnDisabled : s.submitBtn}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="pf-card">
            <h2 style={s.cardTitle}>Change Password</h2>
            <p style={s.cardSub}>Choose a strong password to keep your account secure.</p>
            <form onSubmit={handlePasswordSave} style={{ maxWidth: 480 }}>
              <div style={s.field}>
                <label style={s.label}>Current Password</label>
                <div style={s.passwordWrapper}>
                  <input
                    style={s.passwordInput}
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.current_password}
                    onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    style={s.eyeBtn}
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  >
                    {showPasswords.current ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>New Password</label>
                <div style={s.passwordWrapper}>
                  <input
                    style={s.passwordInput}
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.password}
                    onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    style={s.eyeBtn}
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  >
                    {showPasswords.new ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Confirm New Password</label>
                <div style={s.passwordWrapper}>
                  <input
                    style={s.passwordInput}
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.password_confirmation}
                    onChange={e => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    style={s.eyeBtn}
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  >
                    {showPasswords.confirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              {passwordForm.password && passwordForm.password_confirmation && (
                <div style={{
                  ...s.passwordMatch,
                  color: passwordForm.password === passwordForm.password_confirmation ? '#1a7a3a' : '#cc0000',
                  background: passwordForm.password === passwordForm.password_confirmation ? '#eafaf0' : '#fff0f0',
                }}>
                  {passwordForm.password === passwordForm.password_confirmation
                    ? '✓ Passwords match'
                    : '✕ Passwords do not match'}
                </div>
              )}
              <button
                type="submit"
                style={saving ? s.submitBtnDisabled : s.submitBtn}
                disabled={saving}
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="pf-footer">
        <div className="pf-footer-bottom">
          <span>© 2026 ACHOICE LIMITED. All rights reserved.</span>
          <span>support@achoice.ng | 09067794991</span>
        </div>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f7f5f0', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 16, color: '#666' },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999 },
  profileHeader: { marginBottom: 28 },
  avatarLarge: { width: 72, height: 72, background: '#f0c050', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a3d1a', fontWeight: 700, fontSize: 28, flexShrink: 0 },
  profileInfo: {},
  profileName: { fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#a8d5a8', marginBottom: 10 },
  profileMetaItem: { fontSize: 13, color: '#a8d5a8' },
  quickStat: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: '16px', textAlign: 'center', cursor: 'pointer' },
  quickStatIcon: { fontSize: 24, marginBottom: 8 },
  quickStatLabel: { fontSize: 13, color: '#555', fontWeight: 500 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: { padding: '10px 24px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, color: '#555', cursor: 'pointer', background: '#fff', fontFamily: 'inherit' },
  tabActive: { padding: '10px 24px', border: '1px solid #1f4d1f', borderRadius: 6, fontSize: 14, color: '#fff', cursor: 'pointer', background: '#1f4d1f', fontFamily: 'inherit' },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 6 },
  cardSub: { fontSize: 13, color: '#888', marginBottom: 28 },
  field: { marginBottom: 4 },
  label: { display: 'block', fontSize: 13, color: '#333', fontWeight: 500, marginBottom: 6 },
  input: { width: '100%', padding: '11px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  hint: { fontSize: 11, color: '#888', marginTop: 4 },
  passwordWrapper: { display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden', marginBottom: 16 },
  passwordInput: { flex: 1, padding: '11px 14px', border: 'none', fontSize: 14, fontFamily: 'inherit', outline: 'none', minWidth: 0 },
  eyeBtn: { background: '#f0c050', border: 'none', padding: '11px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', color: '#1a3d1a', flexShrink: 0 },
  passwordMatch: { padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 20 },
  submitBtn: { padding: '12px 28px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 7, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
  submitBtnDisabled: { padding: '12px 28px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 7, fontSize: 15, cursor: 'not-allowed', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
};
