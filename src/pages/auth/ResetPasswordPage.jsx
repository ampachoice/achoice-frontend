import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const LOGO_PATH = '/achoice logo.png';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ password: '', password_confirmation: '' });
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (document.getElementById('rsp-style')) return;
    const el = document.createElement('style');
    el.id = 'rsp-style';
    el.textContent = `
      body { margin:0; }
      .rsp-wrap { min-height:100vh; background:#f7f5f0; font-family:Arial,sans-serif; display:flex; flex-direction:column; }

      /* Top Bar */
      .rsp-topbar { background:#1f4d1f; color:#fff; padding:7px 48px; display:flex; justify-content:space-between; align-items:center; font-size:12px; flex-wrap:wrap; gap:4px; }
      .rsp-topbar-right { display:flex; gap:16px; }

      /* Nav */
      .rsp-nav { background:#fff; border-bottom:1px solid #e8e4dc; padding:12px 48px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; }
      .rsp-brand { display:flex; align-items:center; gap:10px; cursor:pointer; }
      .rsp-brand img { width:44px; height:44px; object-fit:contain; }
      .rsp-brand-name { font-size:15px; font-weight:700; color:#1f4d1f; }
      .rsp-brand-tag  { font-size:10px; color:#888; }
      .rsp-nav-links  { display:flex; align-items:center; gap:24px; }
      .rsp-nav-link   { text-decoration:none; color:#333; font-size:14px; }
      .rsp-nav-btn    { padding:9px 20px; background:#1f4d1f; color:#fff; border:none; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }

      /* Body */
      .rsp-body { flex:1; display:flex; align-items:center; justify-content:center; padding:52px 16px; }
      .rsp-card { background:#fff; border-radius:16px; border:1px solid #e8e4dc; padding:44px 40px; width:100%; max-width:460px; box-shadow:0 6px 28px rgba(0,0,0,0.07); }

      /* Form elements */
      .rsp-icon  { font-size:44px; text-align:center; margin-bottom:16px; }
      .rsp-title { font-size:24px; font-weight:700; color:#111; text-align:center; margin:0 0 10px; }
      .rsp-sub   { font-size:13px; color:#888; text-align:center; margin:0 0 28px; line-height:1.7; }
      .rsp-error { background:#fff0f0; color:#cc0000; padding:12px 16px; border-radius:8px; font-size:13px; margin-bottom:18px; border:1px solid #ffb3b3; }
      .rsp-field { margin-bottom:20px; }
      .rsp-label { display:block; font-size:13px; font-weight:600; color:#444; margin-bottom:7px; }
      .rsp-pw-wrap { display:flex; align-items:center; border:1.5px solid #ddd; border-radius:10px; overflow:hidden; transition:border .2s; }
      .rsp-pw-wrap:focus-within { border-color:#1f4d1f; }
      .rsp-pw-input { flex:1; padding:13px 14px; border:none; font-size:15px; outline:none; font-family:inherit; background:#fff; min-width:0; }
      .rsp-eye { background:#f7f5f0; border:none; border-left:1.5px solid #ddd; padding:13px 16px; cursor:pointer; font-size:18px; color:#666; flex-shrink:0; }
      .rsp-match { font-size:12px; margin-top:7px; font-weight:600; }
      .rsp-strength-wrap { display:flex; align-items:center; gap:8px; margin-top:7px; }
      .rsp-strength-bar  { flex:1; height:5px; background:#eee; border-radius:99px; overflow:hidden; }
      .rsp-strength-fill { height:100%; border-radius:99px; transition:width .3s, background .3s; }
      .rsp-req-box   { background:#f0f7ec; border:1px solid #c5ddb8; border-radius:10px; padding:14px 16px; margin-bottom:22px; }
      .rsp-req-title { font-size:12px; font-weight:700; color:#1f4d1f; margin-bottom:8px; text-transform:uppercase; letter-spacing:.5px; }
      .rsp-req       { font-size:13px; margin-bottom:5px; display:flex; align-items:center; gap:7px; }
      .rsp-btn       { width:100%; padding:15px; background:#1f4d1f; color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:700; cursor:pointer; font-family:inherit; }
      .rsp-btn-dis   { width:100%; padding:15px; background:#ccc; color:#fff; border:none; border-radius:10px; font-size:16px; cursor:not-allowed; font-family:inherit; }
      .rsp-back-link { display:block; text-align:center; margin-top:20px; font-size:13px; color:#888; }
      .rsp-back-link a { color:#1f4d1f; font-weight:600; text-decoration:none; }

      /* Success */
      .rsp-success       { text-align:center; padding:20px 0; }
      .rsp-success-icon  { font-size:56px; margin-bottom:16px; }
      .rsp-success-title { font-size:22px; font-weight:700; color:#111; margin-bottom:12px; }
      .rsp-success-text  { font-size:14px; color:#666; line-height:1.7; margin-bottom:28px; }
      .rsp-success-btn   { padding:13px 32px; background:#1f4d1f; color:#fff; border:none; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; }

      /* Footer */
      .rsp-footer { background:#1f4d1f; color:#fff; padding:44px 48px 0; }
      .rsp-footer-grid    { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:36px; margin-bottom:36px; }
      .rsp-footer-brand   { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
      .rsp-footer-brand img { width:38px; height:38px; object-fit:contain; }
      .rsp-footer-name    { font-size:14px; font-weight:700; color:#fff; }
      .rsp-footer-tag     { font-size:10px; color:#a8d5a8; }
      .rsp-footer-desc    { font-size:12px; color:#a8d5a8; line-height:1.7; margin:0; }
      .rsp-footer-heading { font-size:11px; font-weight:700; color:#f0c050; margin-bottom:14px; letter-spacing:1.5px; text-transform:uppercase; }
      .rsp-footer-link    { font-size:13px; color:#a8d5a8; margin-bottom:9px; cursor:pointer; }
      .rsp-footer-bottom  { border-top:1px solid rgba(255,255,255,0.1); padding:16px 0; text-align:center; font-size:12px; color:#a8d5a8; }

      /* MOBILE */
      @media (max-width:640px) {
        .rsp-topbar { padding:6px 16px; font-size:11px; }
        .rsp-topbar-right { display:none; }
        .rsp-topbar-left span:last-child { display:none; }
        .rsp-nav { padding:10px 16px; }
        .rsp-nav-links { display:none; }
        .rsp-brand img { width:38px; height:38px; }
        .rsp-brand-name { font-size:13px; }
        .rsp-body { padding:28px 12px; align-items:flex-start; }
        .rsp-card { padding:28px 18px; border-radius:14px; }
        .rsp-icon  { font-size:36px; }
        .rsp-title { font-size:20px; }
        .rsp-sub   { font-size:13px; margin-bottom:20px; }
        .rsp-pw-input { font-size:16px; padding:14px 12px; }
        .rsp-eye { padding:14px 12px; font-size:17px; }
        .rsp-btn, .rsp-btn-dis { font-size:16px; padding:16px; }
        .rsp-footer { padding:32px 16px 0; }
        .rsp-footer-grid { grid-template-columns:1fr 1fr; gap:22px; }
      }

      @media (max-width:400px) {
        .rsp-footer-grid { grid-template-columns:1fr; }
      }
    `;
    document.head.appendChild(el);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) { setError('Passwords do not match.'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError(null);
    try {
      await api.post('/reset-password', {
        token:                 searchParams.get('token'),
        email:                 searchParams.get('email'),
        password:              formData.password,
        password_confirmation: formData.password_confirmation,
      });
      setSuccess(true);
    } catch {
      setError('Reset failed. The link may have expired. Please request a new one.');
    } finally { setLoading(false); }
  };

  const getStrength = (pwd) => {
    if (!pwd) return null;
    if (pwd.length < 6)  return { label:'Weak',   color:'#cc0000', width:'25%' };
    if (pwd.length < 8)  return { label:'Fair',   color:'#b36b00', width:'50%' };
    if (pwd.length < 12) return { label:'Good',   color:'#1a7a3a', width:'75%' };
    return                      { label:'Strong', color:'#1f4d1f', width:'100%' };
  };
  const str = getStrength(formData.password);
  const pwMatch = formData.password && formData.password_confirmation;

  return (
    <div className="rsp-wrap">

      {/* Top Bar */}
      <div className="rsp-topbar">
        <div className="rsp-topbar-left" style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          <span>📍 No 6 faith avenue off ekenwan Rd Benin City</span>
          <span>✉ support@achoice.ng</span>
        </div>
        <div className="rsp-topbar-right">
          <span>📞 09067794991</span>
          <span>Mon-Sat: 07:00am-06:00pm</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="rsp-nav">
        <div className="rsp-brand" onClick={() => navigate('/')}>
          <img src={LOGO_PATH} alt="ACHOICE" />
          <div>
            <div className="rsp-brand-name">ACHOICE LIMITED</div>
            <div className="rsp-brand-tag">Your needs our solutions</div>
          </div>
        </div>
        <div className="rsp-nav-links">
          <Link to="/" className="rsp-nav-link">Home</Link>
          <Link to="/products" className="rsp-nav-link">Shop</Link>
          <Link to="/loans/apply" className="rsp-nav-link">Loans</Link>
          <button className="rsp-nav-btn" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </nav>

      {/* Body */}
      <div className="rsp-body">
        <div className="rsp-card">
          {success ? (
            <div className="rsp-success">
              <div className="rsp-success-icon">✅</div>
              <div className="rsp-success-title">Password Reset!</div>
              <p className="rsp-success-text">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <button className="rsp-success-btn" onClick={() => navigate('/login')}>
                Go to Sign In →
              </button>
            </div>
          ) : (
            <>
              <div className="rsp-icon">🔑</div>
              <h2 className="rsp-title">Reset Password</h2>
              <p className="rsp-sub">Enter and confirm your new password below.</p>

              {error && <div className="rsp-error">⚠️ {error}</div>}

              <form onSubmit={handleSubmit}>
                {/* New Password */}
                <div className="rsp-field">
                  <label className="rsp-label">New Password</label>
                  <div className="rsp-pw-wrap">
                    <input className="rsp-pw-input"
                      type={showPw ? 'text' : 'password'}
                      name="password" placeholder="Minimum 8 characters"
                      value={formData.password} onChange={handleChange} required />
                    <button type="button" className="rsp-eye" onClick={() => setShowPw(!showPw)}>
                      {showPw ? '🙈' : '👁'}
                    </button>
                  </div>
                  {str && (
                    <div className="rsp-strength-wrap">
                      <div className="rsp-strength-bar">
                        <div className="rsp-strength-fill" style={{ width:str.width, background:str.color }} />
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color:str.color }}>{str.label}</span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="rsp-field">
                  <label className="rsp-label">Confirm New Password</label>
                  <div className="rsp-pw-wrap">
                    <input className="rsp-pw-input"
                      type={showConfirm ? 'text' : 'password'}
                      name="password_confirmation" placeholder="Repeat new password"
                      value={formData.password_confirmation} onChange={handleChange} required />
                    <button type="button" className="rsp-eye" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? '🙈' : '👁'}
                    </button>
                  </div>
                  {pwMatch && (
                    <div className="rsp-match"
                      style={{ color: formData.password === formData.password_confirmation ? '#1a7a3a' : '#cc0000' }}>
                      {formData.password === formData.password_confirmation ? '✓ Passwords match' : '✕ Passwords do not match'}
                    </div>
                  )}
                </div>

                {/* Requirements */}
                <div className="rsp-req-box">
                  <div className="rsp-req-title">Password requirements</div>
                  {[
                    { text:'At least 8 characters',       met: formData.password.length >= 8 },
                    { text:'Contains letters and numbers', met: /[a-zA-Z]/.test(formData.password) && /[0-9]/.test(formData.password) },
                  ].map(r => (
                    <div key={r.text} className="rsp-req" style={{ color: r.met ? '#1a7a3a' : '#888' }}>
                      <span style={{ fontSize:15 }}>{r.met ? '✓' : '○'}</span> {r.text}
                    </div>
                  ))}
                </div>

                <button type="submit" className={loading ? 'rsp-btn-dis' : 'rsp-btn'} disabled={loading}>
                  {loading ? 'Resetting Password...' : 'Reset Password →'}
                </button>
              </form>

              <p className="rsp-back-link">
                Remember your password? <Link to="/login">Sign In</Link>
              </p>
              <p className="rsp-back-link" style={{ marginTop:6 }}>
                Didn't get an email? <Link to="/forgot-password">Resend link</Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="rsp-footer">
        <div className="rsp-footer-grid">
          <div>
            <div className="rsp-footer-brand">
              <img src={LOGO_PATH} alt="ACHOICE" />
              <div>
                <div className="rsp-footer-name">ACHOICE LIMITED</div>
                <div className="rsp-footer-tag">Your needs our solutions</div>
              </div>
            </div>
            <p className="rsp-footer-desc">
              ACHOICE LIMITED bridges the gap between farmers and customers looking to buy fresh farm products cheap.
            </p>
          </div>
          <div>
            <div className="rsp-footer-heading">Products</div>
            {['Grains & Cereals','Vegetables','Tubers & Roots','Palm Oil','Livestock'].map(i => (
              <div key={i} className="rsp-footer-link">{i}</div>
            ))}
          </div>
          <div>
            <div className="rsp-footer-heading">Explore</div>
            {['About Us','How It Works','Farm Loans','Privacy Policy','Contact Us'].map(i => (
              <div key={i} className="rsp-footer-link">{i}</div>
            ))}
          </div>
          <div>
            <div className="rsp-footer-heading">Contact</div>
            <div className="rsp-footer-link">📍 No 6 faith avenue off ekenwan Rd Benin City</div>
            <div className="rsp-footer-link">✉ support@achoice.ng</div>
            <div className="rsp-footer-link">📞 09067794991</div>
            <div className="rsp-footer-link">🕐 Mon-Sat: 07:00am-06:00pm</div>
          </div>
        </div>
        <div className="rsp-footer-bottom">© 2026 ACHOICE LIMITED. All rights reserved.</div>
      </footer>
    </div>
  );
}
