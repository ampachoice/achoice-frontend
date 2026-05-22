import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../services/authService';

const LOGO_PATH = '/achoice logo.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(formData);
      const token = res.data?.token || res.data?.access_token;
      const user = res.data?.user;

      if (!token || !user) {
        setError('Invalid login response from server.');
        return;
      }

      const expiresAt = new Date().getTime() + (60 * 2 * 60 * 1000);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('session_expires_at', expiresAt);
      localStorage.setItem('isLoggedIn', 'true');

      // Redirect based on role
    const mustChange = res.data.must_change_password;

if (mustChange) {
  navigate('/change-password');
} else if (user.role === 'admin') {
  navigate('/admin/dashboard');
} else if (user.role === 'staff') {
  const profile = user.staffProfile || user.staff_profile;
  if (profile?.can_manage_loans) {
    navigate('/staff/loans');
  } else {
    navigate('/staff/agro');
  }
} else {
  navigate('/products');
}
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
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
          <img src={LOGO_PATH} alt="ACHOICE Logo" style={s.logoImg} />
          <div>
            <div style={s.logoName}>ACHOICE LIMITED</div>
            <div style={s.logoTagline}>Your needs our solutions</div>
          </div>
        </div>
        <div style={s.navRight}>
          <Link to="/" style={s.navLink}>Home</Link>
          <Link to="/products" style={s.navLink}>Marketplace</Link>
          <div style={s.cartIcon} onClick={() => navigate('/cart')}>🛒</div>
        </div>
      </nav>

      {/* Body */}
      <div style={s.body}>
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <img src={LOGO_PATH} alt="Logo" style={s.formLogo} />
            <h2 style={s.formTitle}>Welcome Back</h2>
            <p style={s.formSub}>Sign in to your ACHOICE account</p>
          </div>

          {error && <div style={s.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={s.field}>
              <label style={s.label}>Email Address</label>
              <input
                style={s.input}
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Password</label>
              <div style={s.passwordWrapper}>
                <input
                  style={s.passwordInput}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
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

            <div style={s.recoverRow}>
              <Link to="/forgot-password" style={s.recoverLink}>Forgot password?</Link>
            </div>

            <button
              style={loading ? s.submitBtnDisabled : s.submitBtn}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={s.registerText}>
            Don't have an account?{' '}
            <Link to="/register" style={s.registerLink}>Create one</Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerGrid}>
          <div>
            <div style={s.footerBrand}>
              <img src={LOGO_PATH} alt="Logo" style={s.logoImgSmall} />
              <div>
                <div style={s.footerName}>ACHOICE LIMITED</div>
                <div style={s.footerTagline}>Your needs our solutions</div>
              </div>
            </div>
            <p style={s.footerDesc}>
              ACHOICE LIMITED bridges the gap between farmers and customers
              looking to buy fresh farm products.
            </p>
          </div>
          <div>
            <div style={s.footerHeading}>Quick Links</div>
            <div style={s.footerLink} onClick={() => navigate('/products')}>Marketplace</div>
            <div style={s.footerLink} onClick={() => navigate('/loans/apply')}>Farm Loans</div>
            <div style={s.footerLink}>Terms & Conditions</div>
          </div>
          <div>
            <div style={s.footerHeading}>Support</div>
            <div style={s.footerLink}>About Us</div>
            <div style={s.footerLink}>Contact Us</div>
            <div style={s.footerLink}>Privacy Policy</div>
          </div>
          <div>
            <div style={s.footerHeading}>Contact</div>
            <div style={s.footerLink}>📍 No 6 faith avenue, Benin City</div>
            <div style={s.footerLink}>📞 09067794991</div>
            <div style={s.footerLink}>✉ support@achoice.ng</div>
          </div>
        </div>
        <div style={s.footerBottom}>© 2026 ACHOICE LIMITED. All rights reserved.</div>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f7f5f0', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' },
  topBar: { background: '#1f4d1f', color: '#fff', padding: '8px 60px', display: 'flex', justifyContent: 'space-between', fontSize: 12 },
  topBarLeft: { display: 'flex', gap: 24 },
  topBarRight: { display: 'flex', gap: 24 },
  nav: { background: '#fff', padding: '14px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e8e4dc', position: 'sticky', top: 0, zIndex: 100 },
  navBrand: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  logoImg: { width: 45, height: 45, objectFit: 'contain' },
  logoImgSmall: { width: 35, height: 35, objectFit: 'contain' },
  logoName: { fontSize: 15, fontWeight: 700, color: '#1f4d1f' },
  logoTagline: { fontSize: 10, color: '#888' },
  navRight: { display: 'flex', alignItems: 'center', gap: 24 },
  navLink: { textDecoration: 'none', color: '#333', fontSize: 14, fontWeight: 500 },
  cartIcon: { fontSize: 20, cursor: 'pointer', color: '#333' },
  body: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 16px' },
  formCard: { background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
  formHeader: { textAlign: 'center', marginBottom: 28 },
  formLogo: { width: 56, height: 56, objectFit: 'contain', marginBottom: 12 },
  formTitle: { fontSize: 24, fontWeight: 700, color: '#1f4d1f', marginBottom: 6 },
  formSub: { fontSize: 13, color: '#888' },
  error: { background: '#fff0f0', color: '#cc0000', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16, border: '1px solid #ffcccc' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 },
  input: { width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
  passwordWrapper: { display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' },
  passwordInput: { flex: 1, padding: '12px 14px', border: 'none', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  eyeBtn: { background: '#f0c050', border: 'none', padding: '12px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#1f4d1f', fontFamily: 'inherit' },
  recoverRow: { textAlign: 'right', marginBottom: 20 },
  recoverLink: { color: '#1f4d1f', fontSize: 13, textDecoration: 'none', fontWeight: 500 },
  submitBtn: { width: '100%', padding: '14px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtnDisabled: { width: '100%', padding: '14px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'not-allowed', fontFamily: 'inherit' },
  registerText: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#666' },
  registerLink: { color: '#1f4d1f', fontWeight: 700, textDecoration: 'none' },
  footer: { background: '#1f4d1f', color: '#fff', padding: '48px 60px 0' },
  footerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 },
  footerBrand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 },
  footerName: { fontSize: 15, fontWeight: 700, color: '#fff' },
  footerTagline: { fontSize: 10, color: '#a8d5a8' },
  footerDesc: { fontSize: 13, color: '#a8d5a8', lineHeight: 1.7 },
  footerHeading: { fontSize: 14, fontWeight: 700, color: '#f0c050', marginBottom: 16 },
  footerLink: { fontSize: 13, color: '#a8d5a8', marginBottom: 10, cursor: 'pointer' },
  footerBottom: { borderTop: '1px solid rgba(255,255,255,0.1)', padding: '20px 0', textAlign: 'center', fontSize: 12, color: '#a8d5a8' },
};