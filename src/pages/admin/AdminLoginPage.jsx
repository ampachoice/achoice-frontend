import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const LOGO_PATH = "/achoice logo.png";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/login', formData);
      if (res.data.user.role !== 'admin') {
        setError('Access denied. Admin accounts only.');
        return;
      }
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>

      {/* Top Bar */}
      <div style={s.topBar}>
        <div style={s.topBarLeft}>
          <span>Port Harcourt, Lagos, Abuja</span>
          <span>support@achoice.ng</span>
        </div>
        <div style={s.topBarRight}>
          <span>08143608577</span>
          <span>Mon - Sat: 07:00am to 06:00pm</span>
        </div>
      </div>

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navBrand} onClick={() => navigate('/')}>
          <div style={s.navLogo}>
            <img src={LOGO_PATH} alt="Logo" style={s.navLogoImg} />
            <div>
              <div style={s.logoName}>ACHOICE LIMITED</div>
              <div style={s.logoTagline}>Admin Portal</div>
            </div>
          </div>
        </div>
        <div style={s.navRight}>
          <a href="/" style={s.navLink}>Home</a>
          <a href="/" style={s.navLink}>About</a>
          <a href="/" style={s.navLink}>Product</a>
          <a href="/" style={s.navLink}>Contact</a>
          <button style={s.loginBtn} onClick={() => navigate('/login')}>
            Buyer Login
          </button>
        </div>
      </nav>

      {/* Form */}
      <div style={s.body}>
        <div style={s.formCard}>
          <div style={s.logoBox}>
            <img src={LOGO_PATH} alt="Logo" style={s.formLogoImg} />
            <div>
              <div style={s.logoName2}>ACHOICE LIMITED</div>
              <div style={s.logoBadge}>Admin Portal</div>
            </div>
          </div>

          <h2 style={s.formTitle}>Admin Login</h2>
          <p style={s.formSubtitle}>Sign in to access the admin dashboard</p>

          {error && <div style={s.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={s.field}>
              <input
                style={s.input}
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div style={s.field}>
              <div style={s.passwordWrapper}>
                <input
                  style={s.passwordInput}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  style={s.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button
              style={loading ? s.submitBtnDisabled : s.submitBtn}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={s.buyerText}>
            Not an admin?{' '}
            <span style={s.buyerLink} onClick={() => navigate('/login')}>
              Go to Buyer Login
            </span>
          </p>
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
                <div style={s.footerTagline}>Buy Fresh, Pay Less</div>
              </div>
            </div>
            <p style={s.footerDesc}>
              ACHOICE LIMITED is designed to bridge the gap between farmers
              and customers looking to buy fresh farm products cheap.
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
            <div style={s.footerLink}>Port Harcourt, Lagos, Abuja</div>
            <div style={s.footerLink}>support@achoice.ng</div>
            <div style={s.footerLink}>08143608577</div>
          </div>
        </div>
        <div style={s.footerBottom}>
          2026 ACHOICE LIMITED. All rights reserved.
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
  logoTagline: { fontSize: 11, color: '#c8860a', fontWeight: 600 },
  navRight: { display: 'flex', alignItems: 'center', gap: 24 },
  navLink: { textDecoration: 'none', color: '#333', fontSize: 14 },
  loginBtn: { background: '#1f4d1f', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  body: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 16px' },
  formCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  logoBox: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  formLogoImg: { width: 44, height: 44, objectFit: 'contain' },
  logoName2: { fontSize: 15, fontWeight: 700, color: '#1f4d1f' },
  logoBadge: { fontSize: 11, color: '#c8860a', fontWeight: 600, marginTop: 2 },
  formTitle: { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 6 },
  formSubtitle: { fontSize: 13, color: '#888', marginBottom: 24 },
  error: { background: '#fff0f0', color: '#cc0000', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16 },
  field: { marginBottom: 16 },
  input: { width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  passwordWrapper: { display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden' },
  passwordInput: { flex: 1, padding: '12px 14px', border: 'none', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  eyeBtn: { background: '#f0c050', border: 'none', padding: '12px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' },
  submitBtn: { width: '100%', padding: '13px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
  submitBtnDisabled: { width: '100%', padding: '13px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, cursor: 'not-allowed', fontFamily: 'inherit', marginTop: 4 },
  buyerText: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#666' },
  buyerLink: { color: '#1f4d1f', fontWeight: 600, cursor: 'pointer' },
  footer: { background: '#1f4d1f', color: '#fff', padding: '48px 60px 0' },
  footerGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 40, marginBottom: 40 },
  footerBrand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  footerLogoImg: { width: 40, height: 40, objectFit: 'contain' },
  footerName: { fontSize: 15, fontWeight: 700, color: '#fff' },
  footerTagline: { fontSize: 11, color: '#a8d5a8' },
  footerDesc: { fontSize: 13, color: '#a8d5a8', lineHeight: 1.7 },
  footerHeading: { fontSize: 14, fontWeight: 700, color: '#f0c050', marginBottom: 16 },
  footerLink: { fontSize: 13, color: '#a8d5a8', marginBottom: 10, cursor: 'pointer' },
  footerBottom: { borderTop: '1px solid rgba(255,255,255,0.1)', padding: '20px 0', textAlign: 'center', fontSize: 12, color: '#a8d5a8' },
};