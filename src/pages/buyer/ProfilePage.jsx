import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import BuyerDropdown from '../../components/buyer/BuyerDropdown';

const LOGO_PATH = '/achoice logo.png';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState({ msg:'', type:'success' });
  const [activeTab, setActiveTab]     = useState('profile');
  const [cartCount, setCartCount]     = useState(0);
  const [profileForm, setProfileForm] = useState({ name:'', email:'', phone:'', address:'' });
  const [passwordForm, setPasswordForm] = useState({ current_password:'', password:'', password_confirmation:'' });
  const [showPw, setShowPw]           = useState({ current:false, new:false, confirm:false });

  useEffect(() => {
    if (document.getElementById('prf-style')) return;
    const el = document.createElement('style');
    el.id = 'prf-style';
    el.textContent = `
      * { box-sizing:border-box; }
      body { margin:0; }
      .prf-wrap { min-height:100vh; background:#f7f5f0; font-family:Arial,sans-serif; display:flex; flex-direction:column; }

      /* ── TOP BAR ── */
      .prf-topbar { background:#1f4d1f; color:#fff; padding:7px 48px; display:flex; justify-content:space-between; align-items:center; font-size:12px; flex-wrap:wrap; gap:4px; }
      .prf-topbar-right { display:flex; gap:16px; }

      /* ── NAV ── */
      .prf-nav { background:#1f4d1f; padding:12px 48px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; gap:12px; }
      .prf-nav-brand { display:flex; align-items:center; gap:10px; cursor:pointer; flex-shrink:0; }
      .prf-nav-logo  { width:42px; height:42px; object-fit:contain; }
      .prf-nav-name  { font-size:14px; font-weight:700; color:#fff; line-height:1.2; }
      .prf-nav-tag   { font-size:10px; color:#a8d5a8; }
      .prf-nav-links { display:flex; gap:24px; align-items:center; }
      .prf-nav-link  { color:#fff; font-size:14px; cursor:pointer; }
      .prf-nav-link:hover { color:#f0c050; }
      .prf-cart-badge { background:#f0c050; color:#1a1a1a; font-size:10px; font-weight:700; border-radius:50%; padding:1px 5px; margin-left:4px; }

      /* ── TOAST ── */
      .prf-toast { position:fixed; top:20px; left:50%; transform:translateX(-50%); padding:13px 28px; border-radius:10px; font-size:14px; font-weight:600; z-index:9999; box-shadow:0 4px 20px rgba(0,0,0,0.15); white-space:nowrap; max-width:90vw; text-align:center; }
      .prf-toast-success { background:#1f4d1f; color:#fff; border:1px solid #f0c050; }
      .prf-toast-error   { background:#cc0000; color:#fff; }

      /* ── CONTAINER ── */
      .prf-container { max-width:860px; margin:0 auto; padding:28px 48px; flex:1; width:100%; }

      /* ── HERO CARD ── */
      .prf-hero { background:#1a3d1a; border-radius:16px; padding:28px 32px; display:flex; align-items:center; gap:24px; margin-bottom:20px; }
      .prf-avatar { width:76px; height:76px; background:#f0c050; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#1a3d1a; font-weight:700; font-size:30px; flex-shrink:0; }
      .prf-hero-name  { font-size:22px; font-weight:700; color:#fff; margin-bottom:4px; }
      .prf-hero-email { font-size:14px; color:#a8d5a8; margin-bottom:10px; }
      .prf-hero-meta  { display:flex; gap:20px; flex-wrap:wrap; }
      .prf-hero-meta-item { font-size:12px; color:#a8d5a8; }

      /* ── QUICK STATS ── */
      .prf-quick-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
      .prf-quick-card { background:#fff; border-radius:12px; border:1px solid #e8e4dc; padding:16px; text-align:center; cursor:pointer; transition:box-shadow .2s; }
      .prf-quick-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.08); transform:translateY(-1px); }
      .prf-quick-icon  { font-size:26px; margin-bottom:8px; }
      .prf-quick-label { font-size:13px; color:#555; font-weight:500; }

      /* ── TABS ── */
      .prf-tabs { display:flex; gap:8px; margin-bottom:20px; background:#fff; border:1px solid #e8e4dc; border-radius:10px; padding:6px; }
      .prf-tab { flex:1; padding:10px; border:none; border-radius:7px; font-size:14px; color:#555; cursor:pointer; background:none; font-family:inherit; font-weight:500; }
      .prf-tab-active { flex:1; padding:10px; border:none; border-radius:7px; font-size:14px; color:#fff; cursor:pointer; background:#1f4d1f; font-family:inherit; font-weight:700; }

      /* ── CARD ── */
      .prf-card { background:#fff; border-radius:14px; border:1px solid #e8e4dc; padding:28px 32px; }
      .prf-card-title { font-size:18px; font-weight:700; color:#111; margin:0 0 5px; }
      .prf-card-sub   { font-size:13px; color:#888; margin:0 0 24px; }

      /* ── FORM GRID ── */
      .prf-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px 22px; margin-bottom:22px; }
      .prf-field { }
      .prf-label { display:block; font-size:13px; font-weight:600; color:#333; margin-bottom:6px; }
      .prf-input { width:100%; padding:12px 14px; border:1.5px solid #ddd; border-radius:9px; font-size:14px; font-family:inherit; outline:none; transition:border .2s; }
      .prf-input:focus { border-color:#1f4d1f; }
      .prf-input-disabled { width:100%; padding:12px 14px; border:1.5px solid #eee; border-radius:9px; font-size:14px; background:#f7f5f0; color:#888; }
      .prf-hint { font-size:11px; color:#aaa; margin-top:4px; }

      /* ── PASSWORD FIELDS ── */
      .prf-pw-form { max-width:480px; }
      .prf-pw-wrap { display:flex; align-items:center; border:1.5px solid #ddd; border-radius:9px; overflow:hidden; transition:border .2s; margin-bottom:0; }
      .prf-pw-wrap:focus-within { border-color:#1f4d1f; }
      .prf-pw-input { flex:1; padding:12px 14px; border:none; font-size:14px; outline:none; font-family:inherit; min-width:0; }
      .prf-pw-eye   { background:#f7f5f0; border:none; border-left:1.5px solid #ddd; padding:12px 14px; cursor:pointer; font-size:17px; flex-shrink:0; }
      .prf-pw-match { padding:10px 14px; border-radius:8px; font-size:13px; font-weight:600; margin-bottom:18px; }

      /* ── BUTTONS ── */
      .prf-save-btn { padding:13px 32px; background:#1f4d1f; color:#fff; border:none; border-radius:9px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; }
      .prf-save-btn-dis { padding:13px 32px; background:#ccc; color:#fff; border:none; border-radius:9px; font-size:15px; cursor:not-allowed; font-family:inherit; }

      /* ── FOOTER ── */
      .prf-footer { background:#1f4d1f; padding:18px 48px; margin-top:auto; }
      .prf-footer-bottom { display:flex; justify-content:space-between; font-size:12px; color:#a8d5a8; flex-wrap:wrap; gap:6px; }

      /* ════════════ TABLET ════════════ */
      @media (max-width:768px) {
        .prf-topbar { padding:6px 16px; font-size:11px; }
        .prf-topbar-right { display:none; }
        .prf-nav { padding:10px 16px; }
        .prf-nav-links { display:none; }
        .prf-container { padding:20px 16px; }
        .prf-hero { padding:22px 20px; gap:16px; }
        .prf-avatar { width:60px; height:60px; font-size:24px; }
        .prf-hero-name { font-size:18px; }
        .prf-quick-grid { grid-template-columns:repeat(4,1fr); gap:8px; }
        .prf-quick-card { padding:12px 8px; }
        .prf-quick-icon  { font-size:22px; }
        .prf-quick-label { font-size:11px; }
        .prf-card { padding:22px 20px; }
        .prf-footer { padding:16px; }
        .prf-footer-bottom { flex-direction:column; text-align:center; }
      }

      /* ════════════ MOBILE ════════════ */
      @media (max-width:540px) {
        .prf-nav { padding:8px 12px; }
        .prf-nav-logo { width:36px; height:36px; }
        .prf-nav-name { font-size:13px; }
        .prf-container { padding:14px 12px; }

        /* Hero — stack on mobile */
        .prf-hero { flex-direction:column; text-align:center; padding:20px 16px; gap:14px; }
        .prf-hero-meta { justify-content:center; gap:12px; }
        .prf-avatar { width:72px; height:72px; font-size:28px; }
        .prf-hero-name { font-size:20px; }
        .prf-hero-email { font-size:13px; }

        /* Quick grid — 2x2 on mobile */
        .prf-quick-grid { grid-template-columns:1fr 1fr; gap:10px; }
        .prf-quick-card { padding:14px 10px; }
        .prf-quick-icon  { font-size:24px; margin-bottom:6px; }
        .prf-quick-label { font-size:12px; }

        /* Tabs */
        .prf-tab, .prf-tab-active { font-size:13px; padding:9px 6px; }

        /* Card */
        .prf-card { padding:18px 14px; border-radius:12px; }
        .prf-card-title { font-size:16px; }

        /* Form grid — 1 col on mobile */
        .prf-form-grid { grid-template-columns:1fr; gap:14px; }

        /* Inputs — larger on mobile for touch */
        .prf-input, .prf-pw-input, .prf-input-disabled { font-size:16px; padding:13px 12px; }
        .prf-pw-eye { padding:13px 12px; font-size:18px; }

        /* Save button — full width on mobile */
        .prf-save-btn, .prf-save-btn-dis { width:100%; font-size:16px; padding:15px; }

        .prf-pw-form { max-width:100%; }
      }
    `;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((acc, item) => acc + (item.quantity || 0), 0));
    api.get('/me')
      .then(res => {
        const u = res.data.user || res.data;
        setUser(u);
        setProfileForm({ name:u.name||'', email:u.email||'', phone:u.phone||'', address:u.address||'' });
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg:'', type:'success' }), 3500); };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/profile', profileForm);
      const updated = res.data.user || res.data;
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      showToast('✅ Profile updated successfully!');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update profile.', 'error');
    } finally { setSaving(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.password_confirmation) { showToast('New passwords do not match.', 'error'); return; }
    setSaving(true);
    try {
      await api.put('/profile/password', passwordForm);
      setPasswordForm({ current_password:'', password:'', password_confirmation:'' });
      showToast('✅ Password changed successfully!');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to change password.', 'error');
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontSize:16, color:'#666' }}>Loading profile...</div>;

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const pwsMatch = passwordForm.password && passwordForm.password_confirmation;

  return (
    <div className="prf-wrap">
      {toast.msg && (
        <div className={`prf-toast ${toast.type === 'error' ? 'prf-toast-error' : 'prf-toast-success'}`}>
          {toast.msg}
        </div>
      )}

      {/* Top Bar */}
      <div className="prf-topbar">
        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          <span>📍 No 6 faith avenue off ekenwan Rd Benin City</span>
          <span>✉ support@achoice.ng</span>
        </div>
        <div className="prf-topbar-right">
          <span>📞 09067794991</span>
          <span>Mon-Sat: 07:00am-06:00pm</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="prf-nav">
        <div className="prf-nav-brand" onClick={() => navigate('/')}>
          <img src={LOGO_PATH} alt="ACHOICE" className="prf-nav-logo" />
          <div>
            <div className="prf-nav-name">ACHOICE LIMITED</div>
            <div className="prf-nav-tag">Your needs our solutions</div>
          </div>
        </div>
        <div className="prf-nav-links">
          <span className="prf-nav-link" onClick={() => navigate('/')}>Home</span>
          <span className="prf-nav-link" onClick={() => navigate('/orders')}>My Orders</span>
          <span className="prf-nav-link" onClick={() => navigate('/cart')}>
            Cart {cartCount > 0 && <span className="prf-cart-badge">{cartCount}</span>}
          </span>
        </div>
        <BuyerDropdown cartCount={cartCount} />
      </nav>

      <div className="prf-container">

        {/* Hero */}
        <div className="prf-hero">
          <div className="prf-avatar">{initial}</div>
          <div style={{ flex:1 }}>
            <div className="prf-hero-name">{user?.name}</div>
            <div className="prf-hero-email">{user?.email}</div>
            <div className="prf-hero-meta">
              <span className="prf-hero-meta-item">📱 {user?.phone || 'No phone added'}</span>
              <span className="prf-hero-meta-item">📅 Member since {new Date(user?.created_at || Date.now()).toLocaleDateString('en-NG', { year:'numeric', month:'long' })}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="prf-quick-grid">
          {[
            { icon:'📦', label:'My Orders',      path:'/orders' },
            { icon:'💰', label:'My Loans',       path:'/loans/repay' },
            { icon:'🛒', label:'My Cart',        path:'/cart' },
            { icon:'📋', label:'Apply for Loan', path:'/loans/apply' },
          ].map(item => (
            <div key={item.label} className="prf-quick-card" onClick={() => navigate(item.path)}>
              <div className="prf-quick-icon">{item.icon}</div>
              <div className="prf-quick-label">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="prf-tabs">
          <button className={activeTab === 'profile' ? 'prf-tab-active' : 'prf-tab'}
            onClick={() => setActiveTab('profile')}>
            👤 Profile
          </button>
          <button className={activeTab === 'password' ? 'prf-tab-active' : 'prf-tab'}
            onClick={() => setActiveTab('password')}>
            🔒 Password
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="prf-card">
            <h2 className="prf-card-title">Personal Information</h2>
            <p className="prf-card-sub">Update your name, phone and address details.</p>
            <form onSubmit={handleProfileSave}>
              <div className="prf-form-grid">
                <div className="prf-field">
                  <label className="prf-label">Full Name</label>
                  <input className="prf-input" type="text" value={profileForm.name} required
                    placeholder="Your full name"
                    onChange={e => setProfileForm({ ...profileForm, name:e.target.value })} />
                </div>
                <div className="prf-field">
                  <label className="prf-label">Email Address</label>
                  <input className="prf-input-disabled" type="email" value={profileForm.email} disabled />
                  <div className="prf-hint">Email cannot be changed</div>
                </div>
                <div className="prf-field">
                  <label className="prf-label">Phone Number</label>
                  <input className="prf-input" type="tel" value={profileForm.phone}
                    placeholder="e.g. 08012345678"
                    onChange={e => setProfileForm({ ...profileForm, phone:e.target.value })} />
                </div>
                <div className="prf-field">
                  <label className="prf-label">Delivery Address</label>
                  <input className="prf-input" type="text" value={profileForm.address}
                    placeholder="Your default delivery address"
                    onChange={e => setProfileForm({ ...profileForm, address:e.target.value })} />
                </div>
              </div>
              <button type="submit" className={saving ? 'prf-save-btn-dis' : 'prf-save-btn'} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes →'}
              </button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="prf-card">
            <h2 className="prf-card-title">Change Password</h2>
            <p className="prf-card-sub">Choose a strong password to keep your account secure.</p>
            <form onSubmit={handlePasswordSave} className="prf-pw-form">
              {[
                { id:'current', label:'Current Password', placeholder:'Enter current password',  key:'current_password' },
                { id:'new',     label:'New Password',     placeholder:'Enter new password',       key:'password' },
                { id:'confirm', label:'Confirm Password', placeholder:'Confirm new password',     key:'password_confirmation' },
              ].map(f => (
                <div key={f.id} className="prf-field" style={{ marginBottom:18 }}>
                  <label className="prf-label">{f.label}</label>
                  <div className="prf-pw-wrap">
                    <input className="prf-pw-input"
                      type={showPw[f.id] ? 'text' : 'password'}
                      value={passwordForm[f.key]}
                      placeholder={f.placeholder}
                      onChange={e => setPasswordForm({ ...passwordForm, [f.key]:e.target.value })}
                      required />
                    <button type="button" className="prf-pw-eye"
                      onClick={() => setShowPw(p => ({ ...p, [f.id]:!p[f.id] }))}>
                      {showPw[f.id] ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
              ))}

              {pwsMatch && (
                <div className="prf-pw-match" style={{
                  color: passwordForm.password === passwordForm.password_confirmation ? '#1a7a3a' : '#cc0000',
                  background: passwordForm.password === passwordForm.password_confirmation ? '#eafaf0' : '#fff0f0',
                }}>
                  {passwordForm.password === passwordForm.password_confirmation ? '✓ Passwords match' : '✕ Passwords do not match'}
                </div>
              )}

              <button type="submit" className={saving ? 'prf-save-btn-dis' : 'prf-save-btn'} disabled={saving}>
                {saving ? 'Changing...' : '🔒 Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="prf-footer">
        <div className="prf-footer-bottom">
          <span>© 2026 ACHOICE LIMITED. All rights reserved.</span>
          <span>support@achoice.ng | 09067794991</span>
        </div>
      </footer>
    </div>
  );
}

