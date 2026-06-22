import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const LOGO_PATH = '/achoice logo.png';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (document.getElementById('fp-style')) return;
    const el = document.createElement('style');
    el.id = 'fp-style';
    el.textContent = `
      body { margin:0; }
      .fp-wrap { min-height:100vh; background:#f7f5f0; font-family:Arial,sans-serif; display:flex; flex-direction:column; }

      /* Top bar */
      .fp-topbar { background:#1f4d1f; color:#fff; padding:7px 48px; display:flex; justify-content:space-between; align-items:center; font-size:12px; flex-wrap:wrap; gap:4px; }
      .fp-topbar-right { display:flex; gap:16px; }

      /* Nav */
      .fp-nav { background:#fff; border-bottom:1px solid #e8e4dc; padding:12px 48px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; }
      .fp-brand { display:flex; align-items:center; gap:10px; cursor:pointer; }
      .fp-brand img { width:44px; height:44px; object-fit:contain; }
      .fp-brand-name { font-size:15px; font-weight:700; color:#1f4d1f; }
      .fp-brand-tag { font-size:10px; color:#888; }
      .fp-nav-links { display:flex; align-items:center; gap:24px; }
      .fp-nav-link { text-decoration:none; color:#333; font-size:14px; }
      .fp-nav-btn { padding:9px 20px; background:#1f4d1f; color:#fff; border:none; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }

      /* Body */
      .fp-body { flex:1; display:flex; align-items:center; justify-content:center; padding:52px 16px; }
      .fp-card { background:#fff; border-radius:16px; border:1px solid #e8e4dc; padding:44px 40px; width:100%; max-width:460px; box-shadow:0 6px 28px rgba(0,0,0,0.07); }

      /* Form */
      .fp-icon { font-size:44px; text-align:center; margin-bottom:16px; }
      .fp-title { font-size:24px; font-weight:700; color:#111; text-align:center; margin:0 0 10px; }
      .fp-sub { font-size:13px; color:#888; text-align:center; margin:0 0 28px; line-height:1.7; }
      .fp-error { background:#fff0f0; color:#cc0000; padding:12px 16px; border-radius:8px; font-size:13px; margin-bottom:18px; border:1px solid #ffb3b3; }
      .fp-label { display:block; font-size:13px; font-weight:600; color:#444; margin-bottom:7px; }
      .fp-input { width:100%; padding:14px 16px; border:1.5px solid #ddd; border-radius:10px; font-size:15px; outline:none; font-family:inherit; box-sizing:border-box; transition:border .2s; }
      .fp-input:focus { border-color:#1f4d1f; }
      .fp-btn { width:100%; padding:15px; background:#1f4d1f; color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:700; cursor:pointer; font-family:inherit; margin-top:8px; }
      .fp-btn-dis { width:100%; padding:15px; background:#ccc; color:#fff; border:none; border-radius:10px; font-size:16px; cursor:not-allowed; font-family:inherit; margin-top:8px; }
      .fp-back-link { display:block; text-align:center; margin-top:20px; font-size:13px; color:#888; }
      .fp-back-link a { color:#1f4d1f; font-weight:600; text-decoration:none; }

      /* Success */
      .fp-success { text-align:center; padding:16px 0; }
      .fp-success-icon { font-size:56px; margin-bottom:16px; }
      .fp-success-title { font-size:22px; font-weight:700; color:#111; margin-bottom:12px; }
      .fp-success-text { font-size:14px; color:#666; line-height:1.7; margin-bottom:28px; }
      .fp-success-btn { padding:13px 32px; background:#1f4d1f; color:#fff; border:none; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; }

      /* Footer */
      .fp-footer { background:#1f4d1f; color:#fff; padding:44px 48px 0; }
      .fp-footer-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:36px; margin-bottom:36px; }
      .fp-footer-brand { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
      .fp-footer-brand img { width:38px; height:38px; object-fit:contain; }
      .fp-footer-name { font-size:14px; font-weight:700; color:#fff; }
      .fp-footer-tag { font-size:10px; color:#a8d5a8; }
      .fp-footer-desc { font-size:12px; color:#a8d5a8; line-height:1.7; margin:0; }
      .fp-footer-heading { font-size:11px; font-weight:700; color:#f0c050; margin-bottom:14px; letter-spacing:1.5px; text-transform:uppercase; }
      .fp-footer-link { font-size:13px; color:#a8d5a8; margin-bottom:9px; cursor:pointer; }
      .fp-footer-bottom { border-top:1px solid rgba(255,255,255,0.1); padding:16px 0; text-align:center; font-size:12px; color:#a8d5a8; }

      /* ── MOBILE ── */
      @media (max-width:640px) {
        .fp-topbar { padding:6px 16px; font-size:11px; }
        .fp-topbar-right { display:none; }
        .fp-topbar-left span:last-child { display:none; }
        .fp-nav { padding:10px 16px; }
        .fp-nav-links { display:none; }
        .fp-brand img { width:38px; height:38px; }
        .fp-brand-name { font-size:13px; }
        .fp-body { padding:28px 12px; align-items:flex-start; }
        .fp-card { padding:28px 18px; border-radius:14px; }
        .fp-icon { font-size:36px; }
        .fp-title { font-size:20px; }
        .fp-sub { font-size:13px; margin-bottom:20px; }
        .fp-input { font-size:16px; padding:14px; }
        .fp-btn, .fp-btn-dis { font-size:16px; padding:16px; }
        .fp-footer { padding:32px 16px 0; }
        .fp-footer-grid { grid-template-columns:1fr 1fr; gap:24px; }
        .fp-footer-bottom { font-size:11px; }
      }

      @media (max-width:400px) {
        .fp-footer-grid { grid-template-columns:1fr; }
      }
    `;
    document.head.appendChild(el);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await api.post('/forgot-password', { email });
      setSuccess(true);
    } catch {
      setError('Email not found. Please check and try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fp-wrap">

      {/* Top Bar */}
      <div className="fp-topbar">
        <div className="fp-topbar-left" style={{ display:'flex', gap:16, alignItems:'center' }}>
          <span>📍 No 6 faith avenue off ekenwan Rd Benin City</span>
          <span>✉ support@achoice.ng</span>
        </div>
        <div className="fp-topbar-right">
          <span>📞 09067794991</span>
          <span>Mon-Sat: 07:00am-06:00pm</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="fp-nav">
        <div className="fp-brand" onClick={() => navigate('/')}>
          <img src={LOGO_PATH} alt="ACHOICE" />
          <div>
            <div className="fp-brand-name">ACHOICE LIMITED</div>
            <div className="fp-brand-tag">Your needs our solutions</div>
          </div>
        </div>
        <div className="fp-nav-links">
          <Link to="/" className="fp-nav-link">Home</Link>
          <Link to="/products" className="fp-nav-link">Shop</Link>
          <Link to="/loans/apply" className="fp-nav-link">Loans</Link>
          <button className="fp-nav-btn" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </nav>

      {/* Body */}
      <div className="fp-body">
        <div className="fp-card">
          {success ? (
            <div className="fp-success">
              <div className="fp-success-icon">📧</div>
              <div className="fp-success-title">Check your email</div>
              <p className="fp-success-text">
                We sent a password reset link to <strong>{email}</strong>.
                Check your inbox and click the link to reset your password.
                If you don't see it, check your spam folder.
              </p>
              <button className="fp-success-btn" onClick={() => navigate('/login')}>
                ← Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="fp-icon">🔑</div>
              <h2 className="fp-title">Forgot Password?</h2>
              <p className="fp-sub">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              {error && <div className="fp-error">⚠️ {error}</div>}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom:20 }}>
                  <label className="fp-label">Email Address</label>
                  <input className="fp-input" type="email" placeholder="Enter your email address"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <button type="submit" className={loading ? 'fp-btn-dis' : 'fp-btn'} disabled={loading}>
                  {loading ? 'Sending Reset Link...' : 'Send Reset Link →'}
                </button>
              </form>
              <p className="fp-back-link">
                Remember your password? <Link to="/login">Sign In</Link>
              </p>
              <p className="fp-back-link" style={{ marginTop:8 }}>
                Don't have an account? <Link to="/register">Create one free</Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="fp-footer">
        <div className="fp-footer-grid">
          <div>
            <div className="fp-footer-brand">
              <img src={LOGO_PATH} alt="ACHOICE" />
              <div>
                <div className="fp-footer-name">ACHOICE LIMITED</div>
                <div className="fp-footer-tag">Your needs our solutions</div>
              </div>
            </div>
            <p className="fp-footer-desc">
              ACHOICE LIMITED bridges the gap between farmers and customers looking to buy fresh farm products cheap.
            </p>
          </div>
          <div>
            <div className="fp-footer-heading">Products</div>
            {['Grains & Cereals', 'Vegetables', 'Tubers & Roots', 'Palm Oil', 'Livestock'].map(item => (
              <div key={item} className="fp-footer-link">{item}</div>
            ))}
          </div>
          <div>
            <div className="fp-footer-heading">Explore</div>
            {['About Us', 'How It Works', 'Farm Loans', 'Privacy Policy', 'Contact Us'].map(item => (
              <div key={item} className="fp-footer-link">{item}</div>
            ))}
          </div>
          <div>
            <div className="fp-footer-heading">Contact</div>
            <div className="fp-footer-link">📍 No 6 faith avenue off ekenwan Rd Benin City</div>
            <div className="fp-footer-link">✉ support@achoice.ng</div>
            <div className="fp-footer-link">📞 09067794991</div>
            <div className="fp-footer-link">🕐 Mon-Sat: 07:00am-06:00pm</div>
          </div>
        </div>
        <div className="fp-footer-bottom">
          © 2026 ACHOICE LIMITED. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
