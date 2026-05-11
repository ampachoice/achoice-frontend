import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const LOGO_PATH = "/achoice logo.png";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError('Email not found. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <div style={s.topBarLeft}>
          <span>Port Harcourt, Lagos, Abuja</span>
          <span>support@achoice.ng</span>
        </div>
        <div style={s.topBarRight}>
          <span>009067794991</span>
          <span>Mon - Sat: 07:00am to 06:00pm</span>
        </div>
      </div>

      <nav style={s.nav}>
        <div style={s.navBrand} onClick={() => navigate('/')}>
          <div style={s.navLogo}>
            <img src={LOGO_PATH} alt="Logo" style={s.navLogoImg} />
            <div>
              <div style={s.logoName}>ACHOICE LIMITED</div>
              <div style={s.logoTagline}>Your needs our solutions, Explore the best online chopping and loan experience.</div>
            </div>
          </div>
        </div>
        <div style={s.navRight}>
          <a href="/" style={s.navLink}>Home</a>
          <a href="/" style={s.navLink}>About</a>
          <a href="/" style={s.navLink}>Product</a>
          <a href="/" style={s.navLink}>Contact</a>
          <button style={s.loginBtn} onClick={() => navigate('/login')}>Login</button>
        </div>
      </nav>

      <div style={s.body}>
        <div style={s.formCard}>
          {success ? (
            <div style={s.successBox}>
              <div style={s.successIcon}>&#10003;</div>
              <h2 style={s.successTitle}>Check your email</h2>
              <p style={s.successText}>
                We sent a password reset link to <strong>{email}</strong>.
                Check your inbox and click the link to reset your password.
              </p>
              <button style={s.backBtn} onClick={() => navigate('/login')}>
                Back to Login
              </button>
            </div>
          ) : (
            <>
              <h2 style={s.formTitle}>Forgot Password</h2>
              <p style={s.formSubtitle}>
                Enter your email address and we will send you a link to reset your password.
              </p>
              {error && <div style={s.error}>{error}</div>}
              <form onSubmit={handleSubmit}>
                <div style={s.field}>
                  <input
                    style={s.input}
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  style={loading ? s.submitBtnDisabled : s.submitBtn}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <p style={s.loginText}>
                Remember your password?{' '}
                <Link to="/login" style={s.loginLink}>Login</Link>
              </p>
            </>
          )}
        </div>
      </div>

        {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerGrid}>
          <div>
            <div style={s.footerBrand}>
              <img src={LOGO_PATH} alt="Logo" style={s.footerLogoImg} />
              <div>
                <div style={s.footerName}>ACHOICE LIMITED</div>
                <div style={s.footerTagline}>Your needs our solutions, Explore the best online chopping and loan experience.</div>
              </div>
            </div>
            <p style={s.footerDesc}>
              ACHOICE LIMITED is designed to bridge the gap between farmers
              in need of a secured platform to sell their produce and customers
              looking to buy fresh farm products cheap.
            </p>
          </div>
          <div>
            <div style={s.footerHeading}>Products</div>
            <div style={s.footerLink}>Tomatoes</div>
            <div style={s.footerLink}>Maize</div>
            <div style={s.footerLink}>Palm Oil</div>
            <div style={s.footerLink}>Yam Tubers</div>
          </div>
          <div>
            <div style={s.footerHeading}>Explore</div>
            <div style={s.footerLink}>About Us</div>
            <div style={s.footerLink}>Contact Us</div>
            <div style={s.footerLink}>FAQs</div>
            <div style={s.footerLink}>Blog</div>
          </div>
          <div>
            <div style={s.footerHeading}>Contact</div>
            <div style={s.footerLink}>📍No 6 faith avenue off ekenwan Rd Benin City, Nigeria</div>
            <div style={s.footerLink}>✉ support@achoice.ng</div>
            <div style={s.footerLink}>📞 09067794991</div>
          </div>
        </div>
        <div style={s.footerBottom}>
          © 2026 ACHOICE LIMITED. All rights reserved.
        </div>
      </footer>

    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f7f5f0', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' },
  topBar: { background: '#1f4d1f', color: '#fff', padding: '8px 60px', display: 'flex', justifyContent: 'space-between', fontSize: 12 },
  topBarLeft: { display: 'flex', gap: 24 },
  topBarRight: { display: 'flex', gap: 24 },
  nav: { background: '#fff', padding: '14px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e8e4dc' },
  navBrand: { cursor: 'pointer' },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10 },
  navLogoImg: { width: 45, height: 45, objectFit: 'contain' },
  logoName: { fontSize: 16, fontWeight: 700, color: '#1f4d1f' },
  logoTagline: { fontSize: 11, color: '#888' },
  navRight: { display: 'flex', alignItems: 'center', gap: 24 },
  navLink: { textDecoration: 'none', color: '#333', fontSize: 14 },
  loginBtn: { background: '#1f4d1f', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  body: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 16px' },
  formCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  formTitle: { fontSize: 26, fontWeight: 700, color: '#111', textAlign: 'center', marginBottom: 10 },
  formSubtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 },
  error: { background: '#fff0f0', color: '#cc0000', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16 },
  field: { marginBottom: 16 },
  input: { width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  submitBtn: { width: '100%', padding: '13px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtnDisabled: { width: '100%', padding: '13px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, cursor: 'not-allowed', fontFamily: 'inherit' },
  loginText: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#666' },
  loginLink: { color: '#1f4d1f', fontWeight: 600, textDecoration: 'none' },
  successBox: { textAlign: 'center', padding: '20px 0' },
  successIcon: { fontSize: 48, color: '#1f4d1f', marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 12 },
  successText: { fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 28 },
  backBtn: { background: '#1f4d1f', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 6, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  footer: { background: '#1f4d1f', color: '#fff', padding: '48px 60px 0' },
  footerGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 40, marginBottom: 40 },
  footerBrand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  footerLogoImg: { width: 40, height: 40, objectFit: 'contain' },
  footerName: { fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 },
  footerTagline: { fontSize: 11, color: '#a8d5a8', marginBottom: 12 },
  footerDesc: { fontSize: 13, color: '#a8d5a8', lineHeight: 1.7 },
  footerHeading: { fontSize: 14, fontWeight: 700, color: '#f0c050', marginBottom: 16 },
  footerLink: { fontSize: 13, color: '#a8d5a8', marginBottom: 10, cursor: 'pointer' },
  footerBottom: { borderTop: '1px solid rgba(255,255,255,0.1)', padding: '20px 0', textAlign: 'center', fontSize: 12, color: '#a8d5a8' },
};