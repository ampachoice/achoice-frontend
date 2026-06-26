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

      {/* Top Bar */}
      <div style={s.topBar}>
        <div style={s.topBarLeft}>
          <span>📍 No 6 faith avenue off ekenwan Rd Benin City</span>
          <span>✉ support@achoice.ng</span>
        </div>
        <div style={s.topBarRight}>
          <span>📞 09067794991</span>
          <span>Mon - Sat: 07:00am to 06:00pm</span>
        </div>
      </div>

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navBrand} onClick={() => navigate('/')}>
          <img src={LOGO_PATH} alt="Achoice Logo" style={s.navLogoImg} />
          <div>
            <div style={s.navLogoName}>ACHOICE LIMITED</div>
            <div style={s.navLogoTag}>Your needs our solutions</div>
          </div>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => navigate('/')}>Home</span>
          <span style={s.navLink} onClick={() => navigate('/orders')}>My Orders</span>
          <span style={s.navLink} onClick={() => navigate('/cart')}>
            Cart {cartCount > 0 && <span style={s.cartBadge}>{cartCount}</span>}
          </span>
        </div>
        <NotificationBell />
        <BuyerDropdown cartCount={cartCount} />
      </nav>

      <div style={s.container}>
        {/* Profile Header */}
        <div style={s.profileHeader}>
          <div style={s.profileHeroCard}>
            <div style={s.avatarLarge}>{initial}</div>
            <div style={s.profileInfo}>
              <h1 style={s.profileName}>{user?.name}</h1>
              <div style={s.profileEmail}>{user?.email}</div>
              <div style={s.profileMeta}>
                <span style={s.profileMetaItem}>
                  📱 {user?.phone || 'No phone added'}
                </span>
                <span style={s.profileMetaItem}>
                  📅 Member since {new Date(user?.created_at || Date.now()).toLocaleDateString('en-NG', { year: 'numeric', month: 'long' })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={s.quickStats}>
            <div style={s.quickStat} onClick={() => navigate('/orders')}>
              <div style={s.quickStatIcon}>📦</div>
              <div style={s.quickStatLabel}>My Orders</div>
            </div>
            <div style={s.quickStat} onClick={() => navigate('/loans/repay')}>
              <div style={s.quickStatIcon}>💰</div>
              <div style={s.quickStatLabel}>My Loans</div>
            </div>
            <div style={s.quickStat} onClick={() => navigate('/cart')}>
              <div style={s.quickStatIcon}>🛒</div>
              <div style={s.quickStatLabel}>My Cart</div>
            </div>
            <div style={s.quickStat} onClick={() => navigate('/loans/apply')}>
              <div style={s.quickStatIcon}>📋</div>
              <div style={s.quickStatLabel}>Apply for Loan</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
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
          <div style={s.card}>
            <h2 style={s.cardTitle}>Personal Information</h2>
            <p style={s.cardSub}>Update your name, phone and address details.</p>
            <form onSubmit={handleProfileSave}>
              <div style={s.formGrid}>
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
          <div style={s.card}>
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
      <footer style={s.footer}>
        <div style={s.footerBottom}>
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
  topBar: { background: '#1f4d1f', color: '#fff', padding: '8px 60px', display: 'flex', justifyContent: 'space-between', fontSize: 12 },
  topBarLeft: { display: 'flex', gap: 24 },
  topBarRight: { display: 'flex', gap: 24 },
  nav: { background: '#1f4d1f', padding: '14px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100 },
  navBrand: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  navLogoImg: { width: 45, height: 45, objectFit: 'contain' },
  navLogoName: { fontSize: 15, fontWeight: 700, color: '#ffffff' },
  navLogoTag: { fontSize: 10, color: '#888' },
  navLinks: { display: 'flex', gap: 28, alignItems: 'center' },
  navLink: { color: '#ffffff', fontSize: 14, cursor: 'pointer' },
  cartBadge: { background: '#f0c050', color: '#1a1a1a', fontSize: 10, fontWeight: 700, borderRadius: '50%', padding: '1px 5px', marginLeft: 4 },
  container: { maxWidth: '900px', margin: '0 auto', padding: '32px 16px', flex: 1 },
  profileHeader: { marginBottom: 28 },
  profileHeroCard: { background: '#1a3d1a', borderRadius: 12, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 },
  avatarLarge: { width: 72, height: 72, background: '#f0c050', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a3d1a', fontWeight: 700, fontSize: 28, flexShrink: 0 },
  profileInfo: {},
  profileName: { fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#a8d5a8', marginBottom: 10 },
  profileMeta: { display: 'flex', gap: 20 },
  profileMetaItem: { fontSize: 13, color: '#a8d5a8' },
  quickStats: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 },
  quickStat: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: '16px', textAlign: 'center', cursor: 'pointer' },
  quickStatIcon: { fontSize: 24, marginBottom: 8 },
  quickStatLabel: { fontSize: 13, color: '#555', fontWeight: 500 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: { padding: '10px 24px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, color: '#555', cursor: 'pointer', background: '#fff', fontFamily: 'inherit' },
  tabActive: { padding: '10px 24px', border: '1px solid #1f4d1f', borderRadius: 6, fontSize: 14, color: '#fff', cursor: 'pointer', background: '#1f4d1f', fontFamily: 'inherit' },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc', padding: 32 },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 6 },
  cardSub: { fontSize: 13, color: '#888', marginBottom: 28 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  field: { marginBottom: 4 },
  label: { display: 'block', fontSize: 13, color: '#333', fontWeight: 500, marginBottom: 6 },
  input: { width: '100%', padding: '11px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  hint: { fontSize: 11, color: '#888', marginTop: 4 },
  passwordWrapper: { display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden', marginBottom: 16 },
  passwordInput: { flex: 1, padding: '11px 14px', border: 'none', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  eyeBtn: { background: '#f0c050', border: 'none', padding: '11px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', color: '#1a3d1a' },
  passwordMatch: { padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 20 },
  submitBtn: { padding: '12px 28px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 7, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtnDisabled: { padding: '12px 28px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 7, fontSize: 15, cursor: 'not-allowed', fontFamily: 'inherit' },
  footer: { background: '#1f4d1f', padding: '20px 60px', marginTop: 'auto' },
  footerBottom: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#a8d5a8' },
};
