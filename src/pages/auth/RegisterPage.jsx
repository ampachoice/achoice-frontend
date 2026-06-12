import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../services/authService';

const LOGO_PATH = '/achoice logo.png';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '',
    password_confirmation: '', address: '', state: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (document.getElementById('rp-style')) return;
    const el = document.createElement('style');
    el.id = 'rp-style';
    el.textContent = `
      body { margin:0; }
      .rp-wrap { min-height:100vh; background:#f7f5f0; font-family:Arial,sans-serif; display:flex; flex-direction:column; }

      /* ── Top Bar ── */
      .rp-topbar { background:#1f4d1f; color:#fff; padding:7px 48px; display:flex; justify-content:space-between; align-items:center; font-size:12px; flex-wrap:wrap; gap:4px; }
      .rp-topbar-right { display:flex; gap:16px; }

      /* ── Nav ── */
      .rp-nav { background:#fff; border-bottom:1px solid #e8e4dc; padding:12px 48px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; }
      .rp-brand { display:flex; align-items:center; gap:10px; cursor:pointer; }
      .rp-brand img { width:44px; height:44px; object-fit:contain; }
      .rp-brand-name { font-size:15px; font-weight:700; color:#1f4d1f; }
      .rp-brand-tag  { font-size:10px; color:#888; }
      .rp-nav-links  { display:flex; align-items:center; gap:24px; }
      .rp-nav-link   { text-decoration:none; color:#333; font-size:14px; }
      .rp-nav-btn    { padding:9px 20px; background:#1f4d1f; color:#fff; border:none; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }

      /* ── Body / two-col layout on desktop ── */
      .rp-body { flex:1; display:flex; align-items:flex-start; justify-content:center; padding:48px 16px 60px; }
      .rp-inner { display:grid; grid-template-columns:1fr 380px; gap:32px; width:100%; max-width:900px; align-items:start; }

      /* Left panel */
      .rp-left { background:#1f4d1f; border-radius:16px; padding:40px 32px; color:#fff; }
      .rp-left-badge { display:inline-block; background:#f0c050; color:#1a3d1a; font-size:11px; font-weight:700; padding:4px 14px; border-radius:99px; margin-bottom:20px; letter-spacing:.5px; }
      .rp-left-title { font-family:Georgia,serif; font-size:26px; font-weight:700; line-height:1.25; margin:0 0 14px; }
      .rp-left-sub   { font-size:13px; color:#a8d5a8; line-height:1.7; margin:0 0 28px; }
      .rp-left-feat  { display:flex; flex-direction:column; gap:14px; margin-bottom:32px; }
      .rp-left-feat-item { display:flex; align-items:flex-start; gap:12px; }
      .rp-left-feat-icon { width:36px; height:36px; background:rgba(255,255,255,0.1); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
      .rp-left-feat-text { font-size:13px; color:#c5ddb8; line-height:1.6; }
      .rp-left-feat-label { font-size:13px; font-weight:600; color:#fff; margin-bottom:3px; }
      .rp-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; border-top:1px solid rgba(255,255,255,0.15); padding-top:24px; }
      .rp-stat-val   { font-size:22px; font-weight:700; color:#f0c050; }
      .rp-stat-label { font-size:11px; color:#a8d5a8; margin-top:2px; }

      /* Card */
      .rp-card { background:#fff; border-radius:16px; border:1px solid #e8e4dc; padding:36px 32px; box-shadow:0 6px 28px rgba(0,0,0,0.07); }
      .rp-card-logo  { display:flex; justify-content:center; margin-bottom:4px; }
      .rp-card-logo img { width:48px; height:48px; object-fit:contain; }
      .rp-card-title { font-size:22px; font-weight:700; color:#111; text-align:center; margin:0 0 4px; }
      .rp-card-sub   { font-size:13px; color:#888; text-align:center; margin:0 0 24px; }

      .rp-success { background:#f0fff4; color:#1f4d1f; border:1px solid #a8d5a8; padding:12px 16px; border-radius:8px; font-size:14px; font-weight:600; margin-bottom:16px; text-align:center; }
      .rp-error   { background:#fff0f0; color:#cc0000; border:1px solid #ffb3b3; padding:12px 16px; border-radius:8px; font-size:13px; margin-bottom:16px; }

      .rp-field { margin-bottom:16px; }
      .rp-label { display:block; font-size:12px; font-weight:600; color:#444; margin-bottom:6px; letter-spacing:.2px; }
      .rp-input { width:100%; padding:13px 14px; border:1.5px solid #ddd; border-radius:10px; font-size:14px; outline:none; font-family:inherit; box-sizing:border-box; transition:border .2s; }
      .rp-input:focus { border-color:#1f4d1f; }
      .rp-pw-wrap { display:flex; align-items:center; border:1.5px solid #ddd; border-radius:10px; overflow:hidden; transition:border .2s; }
      .rp-pw-wrap:focus-within { border-color:#1f4d1f; }
      .rp-pw-input { flex:1; padding:13px 14px; border:none; font-size:14px; outline:none; font-family:inherit; min-width:0; background:#fff; }
      .rp-eye { background:#f7f5f0; border:none; border-left:1.5px solid #ddd; padding:13px 14px; cursor:pointer; font-size:17px; flex-shrink:0; }

      .rp-row2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

      .rp-pw-match { font-size:12px; margin-top:5px; font-weight:600; }

      .rp-btn     { width:100%; padding:15px; background:#1f4d1f; color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:700; cursor:pointer; font-family:inherit; margin-top:4px; }
      .rp-btn-dis { width:100%; padding:15px; background:#ccc; color:#fff; border:none; border-radius:10px; font-size:16px; cursor:not-allowed; font-family:inherit; margin-top:4px; }
      .rp-login-text { text-align:center; margin-top:18px; font-size:13px; color:#888; }
      .rp-login-text a { color:#1f4d1f; font-weight:700; text-decoration:none; }

      /* ── Footer ── */
      .rp-footer { background:#1f4d1f; color:#fff; padding:44px 48px 0; }
      .rp-footer-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:36px; margin-bottom:36px; }
      .rp-footer-brand { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
      .rp-footer-brand img { width:38px; height:38px; object-fit:contain; }
      .rp-footer-name { font-size:14px; font-weight:700; color:#fff; }
      .rp-footer-tag  { font-size:10px; color:#a8d5a8; }
      .rp-footer-desc { font-size:12px; color:#a8d5a8; line-height:1.7; margin:0; }
      .rp-footer-heading { font-size:11px; font-weight:700; color:#f0c050; margin-bottom:14px; letter-spacing:1.5px; text-transform:uppercase; }
      .rp-footer-link { font-size:13px; color:#a8d5a8; margin-bottom:9px; cursor:pointer; }
      .rp-footer-bottom { border-top:1px solid rgba(255,255,255,0.1); padding:16px 0; text-align:center; font-size:12px; color:#a8d5a8; }

      /* ── TABLET ── */
      @media (max-width:820px) {
        .rp-inner { grid-template-columns:1fr; max-width:480px; }
        .rp-left  { display:none; }
      }

      /* ── MOBILE ── */
      @media (max-width:640px) {
        .rp-topbar { padding:6px 16px; font-size:11px; }
        .rp-topbar-right { display:none; }
        .rp-topbar-left span:last-child { display:none; }
        .rp-nav { padding:10px 16px; }
        .rp-nav-links { display:none; }
        .rp-brand img { width:38px; height:38px; }
        .rp-brand-name { font-size:13px; }
        .rp-body { padding:20px 12px 48px; }
        .rp-card { padding:24px 16px; border-radius:14px; }
        .rp-card-title { font-size:20px; }
        .rp-input, .rp-pw-input { font-size:16px; padding:14px 12px; }
        .rp-eye { padding:14px 12px; }
        .rp-row2 { grid-template-columns:1fr; gap:0; }
        .rp-btn, .rp-btn-dis { font-size:16px; padding:16px; }
        .rp-footer { padding:32px 16px 0; }
        .rp-footer-grid { grid-template-columns:1fr 1fr; gap:22px; }
      }

      @media (max-width:400px) {
        .rp-footer-grid { grid-template-columns:1fr; }
      }
    `;
    document.head.appendChild(el);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) { setError('Passwords do not match.'); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      await register(formData);
      setSuccess('🎉 Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(Object.values(err.response.data.errors)[0][0]);
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally { setLoading(false); }
  };

  const pwMatch = formData.password && formData.password_confirmation;

  return (
    <div className="rp-wrap">

      {/* Top Bar */}
      <div className="rp-topbar">
        <div className="rp-topbar-left" style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          <span>📍 No 6 faith avenue off ekenwan Rd Benin City</span>
          <span>✉ support@achoice.ng</span>
        </div>
        <div className="rp-topbar-right">
          <span>📞 09067794991</span>
          <span>Mon-Sat: 07:00am-06:00pm</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="rp-nav">
        <div className="rp-brand" onClick={() => navigate('/')}>
          <img src={LOGO_PATH} alt="ACHOICE" />
          <div>
            <div className="rp-brand-name">ACHOICE LIMITED</div>
            <div className="rp-brand-tag">Your needs our solutions</div>
          </div>
        </div>
        <div className="rp-nav-links">
          <Link to="/" className="rp-nav-link">Home</Link>
          <Link to="/products" className="rp-nav-link">Shop</Link>
          <Link to="/loans/apply" className="rp-nav-link">Loans</Link>
          <button className="rp-nav-btn" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </nav>

      {/* Body */}
      <div className="rp-body">
        <div className="rp-inner">

          {/* Left Info Panel */}
          <div className="rp-left">
            <div className="rp-left-badge">Nigeria's #1 Agricultural Marketplace</div>
            <h2 className="rp-left-title">Join Thousands of Nigerians Shopping Fresh Farm Produce</h2>
            <p className="rp-left-sub">Create your free account and start buying directly from verified farmers across all 36 states.</p>
            <div className="rp-left-feat">
              {[
                { icon:'🌾', label:'Farm Fresh Quality', text:'Direct from verified farms — no middlemen, no markup.' },
                { icon:'💳', label:'Pay Securely', text:'Paystack-powered payments — card, transfer, USSD.' },
                { icon:'💰', label:'Access Farm Loans', text:'Apply for affordable loans with 24-hour decisions.' },
                { icon:'🚚', label:'Nationwide Delivery', text:'Fast delivery to your doorstep across Nigeria.' },
              ].map(f => (
                <div key={f.label} className="rp-left-feat-item">
                  <div className="rp-left-feat-icon">{f.icon}</div>
                  <div>
                    <div className="rp-left-feat-label">{f.label}</div>
                    <div className="rp-left-feat-text">{f.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rp-stats">
              {[['500+','Farmers'],['10K+','Buyers'],['36','States']].map(([v,l]) => (
                <div key={l}>
                  <div className="rp-stat-val">{v}</div>
                  <div className="rp-stat-label">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="rp-card">
            <div className="rp-card-logo"><img src={LOGO_PATH} alt="Logo" /></div>
            <h2 className="rp-card-title">Create Account</h2>
            <p className="rp-card-sub">Free forever, no hidden charges</p>

            {success && <div className="rp-success">{success}</div>}
            {error   && <div className="rp-error">⚠️ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="rp-field">
                <label className="rp-label">Full Name</label>
                <input className="rp-input" type="text" name="name" placeholder="e.g. Chukwuemeka Okafor"
                  value={formData.name} onChange={handleChange} required />
              </div>

              <div className="rp-field">
                <label className="rp-label">Email Address</label>
                <input className="rp-input" type="email" name="email" placeholder="you@example.com"
                  value={formData.email} onChange={handleChange} required autoComplete="email" />
              </div>

              <div className="rp-field">
                <label className="rp-label">Phone Number</label>
                <input className="rp-input" type="tel" name="phone" placeholder="e.g. 08012345678"
                  value={formData.phone} onChange={handleChange} required />
              </div>

              <div className="rp-row2">
                <div className="rp-field">
                  <label className="rp-label">State</label>
                  <select className="rp-input" name="state" value={formData.state} onChange={handleChange}>
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="rp-field">
                  <label className="rp-label">Home Address <span style={{ color:'#aaa', fontWeight:400 }}>(optional)</span></label>
                  <input className="rp-input" type="text" name="address" placeholder="Street address"
                    value={formData.address} onChange={handleChange} />
                </div>
              </div>

              <div className="rp-field">
                <label className="rp-label">Password</label>
                <div className="rp-pw-wrap">
                  <input className="rp-pw-input" type={showPassword ? 'text' : 'password'}
                    name="password" placeholder="Min 8 characters"
                    value={formData.password} onChange={handleChange} required autoComplete="new-password" />
                  <button type="button" className="rp-eye" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="rp-field">
                <label className="rp-label">Confirm Password</label>
                <div className="rp-pw-wrap">
                  <input className="rp-pw-input" type={showConfirm ? 'text' : 'password'}
                    name="password_confirmation" placeholder="Repeat your password"
                    value={formData.password_confirmation} onChange={handleChange} required autoComplete="new-password" />
                  <button type="button" className="rp-eye" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? '🙈' : '👁'}
                  </button>
                </div>
                {pwMatch && (
                  <div className="rp-pw-match" style={{ color: formData.password === formData.password_confirmation ? '#1a7a3a' : '#cc0000' }}>
                    {formData.password === formData.password_confirmation ? '✓ Passwords match' : '✕ Passwords do not match'}
                  </div>
                )}
              </div>

              <button type="submit" className={loading || !!success ? 'rp-btn-dis' : 'rp-btn'} disabled={loading || !!success}>
                {loading ? 'Creating Account...' : success ? 'Redirecting...' : 'Create Free Account →'}
              </button>
            </form>

            <p className="rp-login-text">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="rp-footer">
        <div className="rp-footer-grid">
          <div>
            <div className="rp-footer-brand">
              <img src={LOGO_PATH} alt="ACHOICE" />
              <div>
                <div className="rp-footer-name">ACHOICE LIMITED</div>
                <div className="rp-footer-tag">Your needs our solutions</div>
              </div>
            </div>
            <p className="rp-footer-desc">ACHOICE LIMITED bridges the gap between farmers and customers looking to buy fresh farm products cheap.</p>
          </div>
          <div>
            <div className="rp-footer-heading">Products</div>
            {['Grains & Cereals','Vegetables','Tubers & Roots','Palm Oil','Livestock'].map(i => (
              <div key={i} className="rp-footer-link">{i}</div>
            ))}
          </div>
          <div>
            <div className="rp-footer-heading">Explore</div>
            {['About Us','How It Works','Farm Loans','Privacy Policy','Contact Us'].map(i => (
              <div key={i} className="rp-footer-link">{i}</div>
            ))}
          </div>
          <div>
            <div className="rp-footer-heading">Contact</div>
            <div className="rp-footer-link">📍 No 6 faith avenue off ekenwan Rd Benin City</div>
            <div className="rp-footer-link">✉ support@achoice.ng</div>
            <div className="rp-footer-link">📞 09067794991</div>
            <div className="rp-footer-link">🕐 Mon-Sat: 07:00am-06:00pm</div>
          </div>
        </div>
        <div className="rp-footer-bottom">© 2026 ACHOICE LIMITED. All rights reserved.</div>
      </footer>
    </div>
  );
}
