import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import BuyerNav from '../../components/buyer/BuyerNav';
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../services/addressService';
import AddressFormFields, { emptyAddressForm } from '../../components/buyer/AddressFormFields';

const LOGO_PATH = '/android-chrome-192x192.png';

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

  // Address Book — Phase 3
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddressForm());
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressActionId, setAddressActionId] = useState(null); // id currently being deleted/defaulted

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

  // Lazy-load addresses the first time the tab is opened, not on initial
  // page load — most visits to Profile are for the Profile Information
  // tab, no need to fetch addresses every time.
  useEffect(() => {
    if (activeTab === 'addresses' && !addressesLoaded) {
      fetchAddresses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchAddresses = () => {
    setAddressesLoading(true);
    getAddresses()
      .then((res) => {
        setAddresses(res.data?.data || res.data || []);
        setAddressesLoaded(true);
      })
      .catch(() => showToast('Failed to load saved addresses.'))
      .finally(() => setAddressesLoading(false));
  };

  const openAddAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm());
    setShowAddressForm(true);
  };

  const openEditAddressForm = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label || '',
      full_address: addr.full_address || '',
      state: addr.state || '',
      lga: addr.lga || '',
      phone: addr.phone || '',
    });
    setShowAddressForm(true);
  };

  const closeAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm());
  };

  const handleAddressFormSubmit = async (e) => {
    e.preventDefault();
    setAddressSaving(true);
    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, addressForm);
        showToast('Address updated!');
      } else {
        await createAddress(addressForm);
        showToast('Address added!');
      }
      closeAddressForm();
      fetchAddresses();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save address.');
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    setAddressActionId(id);
    try {
      await deleteAddress(id);
      showToast('Address deleted.');
      fetchAddresses();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete address.');
    } finally {
      setAddressActionId(null);
    }
  };

  const handleSetDefaultAddress = async (id) => {
    setAddressActionId(id);
    try {
      await setDefaultAddress(id);
      fetchAddresses();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to set default address.');
    } finally {
      setAddressActionId(null);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // TODO(backend): PUT /profile does not exist in routes/api.php.
      // Admin has PUT /admin/profile and sellers have PUT /seller/profile,
      // but there is no equivalent buyer-facing route or controller
      // method yet — this call will 404 until one is added server-side.
      // Needs something like:
      //   Route::put('/profile', [AuthController::class, 'updateProfile']);
      // registered in the auth:sanctum group, with a controller method
      // that updates the logged-in user's name/phone/address and
      // returns the updated user object.
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
      // PUT /profile/password doesn't exist on the backend — the actual
      // working endpoint is POST /auth/change-password (same one
      // ChangePasswordPage.jsx uses), which expects
      // current_password / new_password / new_password_confirmation.
      await api.post('/auth/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.password,
        new_password_confirmation: passwordForm.password_confirmation,
      });
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
        /* ── Navbar ── */
        .pf-nav { background:#1f4d1f; padding:14px 60px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; position:sticky; top:0; z-index:100; gap:12px; }
        .pf-nav-brand { display:flex; align-items:center; gap:10px; cursor:pointer; min-width:0; overflow:hidden; flex:1 1 auto; }
        .pf-nav-brand > div { min-width:0; overflow:hidden; }
        .pf-nav-logo-img { width:45px; height:45px; object-fit:contain; flex-shrink:0; }
        .pf-nav-logo-name { font-size:15px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .pf-nav-logo-tag { font-size:10px; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .pf-nav-links { display:flex; gap:28px; align-items:center; flex-shrink:0; }
        .pf-nav-link { color:#fff; font-size:14px; cursor:pointer; white-space:nowrap; }
        .pf-cart-badge { background:#f0c050; color:#1a1a1a; font-size:10px; font-weight:700; border-radius:50%; padding:1px 5px; margin-left:4px; }
        .pf-nav-right { display:flex; align-items:center; gap:14px; flex-shrink:0; }
        .pf-desktop-only { display:flex; align-items:center; gap:14px; }

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
          .pf-nav { padding:12px 24px; }
          .pf-container { padding:28px 20px; }
          .pf-footer { padding:18px 24px; }
        }

        /* ── MOBILE ── */
        @media (max-width:640px) {
          .pf-nav { padding:10px 16px; justify-content:space-between; }
          .pf-nav-links { display:none; }
          .pf-desktop-only { display:none; }
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

          .pf-address-card { flex-direction:column !important; align-items:stretch !important; }
          .pf-address-actions { flex-direction:row !important; justify-content:flex-end !important; flex-wrap:wrap; gap:14px !important; }

          .pf-footer { padding:16px 16px; }
          .pf-footer-bottom { flex-direction:column; text-align:center; gap:6px; }
        }

        @media (max-width:380px) {
          .pf-quick-stats { grid-template-columns:1fr 1fr; gap:8px; }
          .pf-quick-stat-icon { font-size:20px !important; }
        }
      `}</style>

      {/* Navbar */}
      <BuyerNav />

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
          <button
            style={activeTab === 'addresses' ? s.tabActive : s.tab}
            onClick={() => setActiveTab('addresses')}
          >
            Saved Addresses
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

        {/* Saved Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="pf-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
              <div>
                <h2 style={s.cardTitle}>Saved Addresses</h2>
                <p style={{ ...s.cardSub, marginBottom: 0 }}>
                  Save multiple delivery addresses and pick one at checkout instead of retyping every time.
                </p>
              </div>
              {!showAddressForm && (
                <button style={s.addAddressBtn} onClick={openAddAddressForm}>
                  + Add New Address
                </button>
              )}
            </div>

            {showAddressForm && (
              <form onSubmit={handleAddressFormSubmit} style={{ ...s.addressFormBox, marginTop: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1f4d1f', marginBottom: 16 }}>
                  {editingAddressId ? 'Edit Address' : 'Add New Address'}
                </h3>
                <AddressFormFields
                  form={addressForm}
                  onChange={setAddressForm}
                  rowClassName="pf-form-grid"
                  styles={{ row2: { marginBottom: 0 }, field: s.field, label: s.label, input: s.input }}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button
                    type="submit"
                    style={{ ...(addressSaving ? s.submitBtnDisabled : s.submitBtn), width: 'auto', padding: '11px 24px' }}
                    disabled={addressSaving}
                  >
                    {addressSaving ? 'Saving...' : editingAddressId ? 'Save Changes' : 'Add Address'}
                  </button>
                  <button
                    type="button"
                    style={s.cancelBtn}
                    onClick={closeAddressForm}
                    disabled={addressSaving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div style={{ marginTop: 24 }}>
              {addressesLoading && (
                <p style={{ color: '#888', fontSize: 14 }}>Loading addresses...</p>
              )}
              {!addressesLoading && addresses.length === 0 && (
                <div style={s.emptyAddressBox}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
                  <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
                    No saved addresses yet. Add one to speed up checkout.
                  </p>
                </div>
              )}
              {!addressesLoading &&
                addresses.map((addr) => (
                  <div key={addr.id} className="pf-address-card" style={s.addressCard}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={s.addressLabel}>{addr.label || 'Home'}</span>
                        {addr.is_default && <span style={s.defaultBadge}>Default</span>}
                      </div>
                      <div style={{ fontSize: 14, color: '#333', marginBottom: 3 }}>
                        {addr.full_address}
                      </div>
                      <div style={{ fontSize: 13, color: '#888' }}>
                        {[addr.lga, addr.state].filter(Boolean).join(', ')}
                        {addr.phone && ` · ${addr.phone}`}
                      </div>
                    </div>
                    <div className="pf-address-actions" style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      {!addr.is_default && (
                        <button
                          style={s.smallLinkBtn}
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          disabled={addressActionId === addr.id}
                        >
                          {addressActionId === addr.id ? 'Setting...' : 'Set as Default'}
                        </button>
                      )}
                      <button style={s.smallLinkBtn} onClick={() => openEditAddressForm(addr)}>
                        Edit
                      </button>
                      <button
                        style={{ ...s.smallLinkBtn, color: '#cc0000' }}
                        onClick={() => handleDeleteAddress(addr.id)}
                        disabled={addressActionId === addr.id}
                      >
                        {addressActionId === addr.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
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

  // Address Book
  addAddressBtn: { padding: '10px 20px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  cancelBtn: { padding: '11px 20px', background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: 7, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  addressFormBox: { background: '#f7f5f0', border: '1px solid #e8e4dc', borderRadius: 10, padding: 20 },
  emptyAddressBox: { textAlign: 'center', padding: '32px 16px', background: '#f7f5f0', borderRadius: 10, border: '1px dashed #ddd' },
  addressCard: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid #eee' },
  addressLabel: { fontSize: 14, fontWeight: 700, color: '#1f4d1f' },
  defaultBadge: { fontSize: 10, fontWeight: 700, color: '#1a7a3a', background: '#eafaf0', padding: '2px 9px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: 0.3 },
  smallLinkBtn: { background: 'none', border: 'none', color: '#1f4d1f', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0, textAlign: 'right' },
};
