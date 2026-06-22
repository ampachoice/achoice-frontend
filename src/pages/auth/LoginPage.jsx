import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../services/authService';

const LOGO_PATH = '/achoice logo.png';

const injectCSS = () => {
  if (document.getElementById('login-css')) return;
  const style = document.createElement('style');
  style.id = 'login-css';
  style.textContent = `
    * { box-sizing: border-box; }
    .lp-topbar { padding: 7px 40px !important; }
    .lp-topbar-hide { display: inline !important; }
    .lp-nav { padding: 12px 40px !important; }
    .lp-nav-right { display: flex !important; }
    .lp-footer { padding: 40px 40px 0 !important; }
    .lp-footer-grid { grid-template-columns: repeat(auto-fit, minmax(180px,1fr)) !important; }

    @media (max-width: 768px) {
      .lp-topbar { padding: 6px 16px !important; font-size: 11px !important; }
      .lp-topbar-hide { display: none !important; }
      .lp-nav { padding: 10px 16px !important; }
      .lp-nav-right { gap: 12px !important; }
      .lp-nav-link-hide { display: none !important; }
      .lp-body { padding: 28px 16px !important; }
      .lp-form-card { padding: 28px 20px !important; }
      .lp-footer { padding: 32px 16px 0 !important; }
      .lp-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
      .lp-footer-bottom { font-size: 11px !important; }
    }

    @media (max-width: 480px) {
      .lp-footer-grid { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(style);
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { injectCSS(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(formData);
      const token = res.data?.token || res.data?.access_token;
      const user = res.data?.user;

      if (!token || !user) { setError('Invalid login response from server.'); return; }

      const expiresAt = new Date().getTime() + (60 * 2 * 60 * 1000);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('session_expires_at', expiresAt);
      localStorage.setItem('isLoggedIn', 'true');

      const mustChange = res.data.must_change_password;
      if (mustChange) {
        navigate('/change-password');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'staff') {
        const profile = user.staffProfile || user.staff_profile;
        if (profile?.can_manage_loans) navigate('/staff/loans');
        else navigate('/staff/agro');
      } else if (user.role === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate('/products');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>

      {/* Top Bar */}
      <div className="lp-topbar" style={s.topBar}>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <span>📍 No 6 faith avenue off ekenwan Rd Benin City</span>
          <span className="lp-topbar-hide">✉ support@achoice.ng</span>
        </div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <span className="lp-topbar-hide">📞 09067794991</span>
          <span className="lp-topbar-hide">Mon-Sat: 07:00am-06:00pm</span>
        </div>
      </div>

      {/* Navbar */}
      <nav className="lp-nav" style={s.nav}>
        <div style={s.navBrand} onClick={() => navigate('/')}>
          <img src={LOGO_PATH} alt="ACHOICE Logo" style={s.logoImg} />
          <div>
            <div style={s.logoName}>ACHOICE LIMITED</div>
            <div style={s.logoTagline}>Your needs our solutions</div>
          </div>
        </div>
        <div className="lp-nav-right" style={s.navRight}>
          <Link className="lp-nav-link-hide" to="/" style={s.navLink}>Home</Link>
          <Link className="lp-nav-link-hide" to="/products" style={s.navLink}>Marketplace</Link>
          <div style={{ fontSize:20, cursor:'pointer', color:'#333' }} onClick={() => navigate('/cart')}>🛒</div>
          <Link to="/register" style={s.registerNavBtn}>Create Account</Link>
        </div>
      </nav>

      {/* Body */}
      <div className="lp-body" style={s.body}>
        <div className="lp-form-card" style={s.formCard}>
          <div style={s.formHeader}>
            <img src={LOGO_PATH} alt="Logo" style={s.formLogo} />
            <h2 style={s.formTitle}>Welcome Back</h2>
            <p style={s.formSub}>Sign in to your ACHOICE account</p>
          </div>

          {error && <div style={s.error}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={s.field}>
              <label style={s.label}>Email Address</label>
              <input style={s.input} type="email" name="email"
                placeholder="Enter your email" value={formData.email}
                onChange={handleChange} required autoComplete="email" />
            </div>

            <div style={s.field}>
              <label style={s.label}>Password</label>
              <div style={s.passwordWrapper}>
                <input style={s.passwordInput}
                  type={showPassword ? 'text' : 'password'}
                  name="password" placeholder="Enter your password"
                  value={formData.password} onChange={handleChange}
                  required autoComplete="current-password" />
                <button type="button" style={s.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div style={{ textAlign:'right', marginBottom:20 }}>
              <Link to="/forgot-password" style={s.recoverLink}>Forgot password?</Link>
            </div>

            <button style={loading ? s.submitBtnDisabled : s.submitBtn}
              type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>New to ACHOICE?</span>
            <div style={s.dividerLine} />
          </div>

          <Link to="/register" style={s.registerBtn}>Create a Free Account</Link>

          
        </div>
      </div>

      {/* Footer */}
      <footer className="lp-footer" style={s.footer}>
        <div className="lp-footer-grid" style={s.footerGrid}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <img src={LOGO_PATH} alt="Logo" style={{ width:34, height:34, objectFit:'contain' }} />
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>ACHOICE LIMITED</div>
                <div style={{ fontSize:10, color:'#a8d5a8' }}>Your needs our solutions</div>
              </div>
            </div>
            <p style={{ fontSize:12, color:'#a8d5a8', lineHeight:1.7 }}>
              ACHOICE LIMITED bridges the gap between farmers and customers looking to buy fresh farm products.
            </p>
          </div>
          <div>
            <div style={s.footerHeading}>Quick Links</div>
            {[
              { label:'Marketplace', action: () => navigate('/products') },
              { label:'Farm Loans',  action: () => navigate('/loans/apply') },
              { label:'Register',    action: () => navigate('/register') },
            ].map(item => (
              <div key={item.label} style={s.footerLink} onClick={item.action}>{item.label}</div>
            ))}
          </div>
          <div>
            <div style={s.footerHeading}>Support</div>
            {['About Us', 'Contact Us', 'Privacy Policy', 'Terms & Conditions'].map(item => (
              <div key={item} style={s.footerLink}>{item}</div>
            ))}
          </div>
          <div>
            <div style={s.footerHeading}>Contact</div>
            <div style={s.footerLink}>📍 No 6 faith avenue, Benin City</div>
            <div style={s.footerLink}>📞 09067794991</div>
            <div style={s.footerLink}>✉ support@achoice.ng</div>
            <div style={s.footerLink}>🕐 Mon-Sat: 07:00am-06:00pm</div>
          </div>
        </div>
        <div className="lp-footer-bottom" style={s.footerBottom}>
          © 2026 ACHOICE LIMITED. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight:'100vh', backgroundColor:'#f7f5f0', fontFamily:'Arial, sans-serif', display:'flex', flexDirection:'column' },

  // Top bar
  topBar: { background:'#1f4d1f', color:'#fff', padding:'7px 40px', display:'flex', justifyContent:'space-between', fontSize:12, flexWrap:'wrap', gap:4 },

  // Nav
  nav: { background:'#fff', padding:'12px 40px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #e8e4dc', position:'sticky', top:0, zIndex:100 },
  navBrand: { display:'flex', alignItems:'center', gap:10, cursor:'pointer', flexShrink:0 },
  logoImg: { width:42, height:42, objectFit:'contain' },
  logoName: { fontSize:14, fontWeight:700, color:'#1f4d1f' },
  logoTagline: { fontSize:10, color:'#888' },
  navRight: { display:'flex', alignItems:'center', gap:20 },
  navLink: { textDecoration:'none', color:'#333', fontSize:14 },
  registerNavBtn: { padding:'8px 16px', background:'#1f4d1f', color:'#fff', border:'none', borderRadius:6, fontSize:13, cursor:'pointer', fontFamily:'inherit', textDecoration:'none', fontWeight:600 },

  // Body
  body: { flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 16px' },
  formCard: { background:'#fff', borderRadius:14, border:'1px solid #e8e4dc', padding:'40px 36px', width:'100%', maxWidth:440, boxShadow:'0 4px 24px rgba(0,0,0,0.07)' },
  formHeader: { textAlign:'center', marginBottom:28 },
  formLogo: { width:56, height:56, objectFit:'contain', marginBottom:12 },
  formTitle: { fontSize:24, fontWeight:700, color:'#1f4d1f', marginBottom:6 },
  formSub: { fontSize:13, color:'#888' },
  error: { background:'#fff0f0', color:'#cc0000', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16, border:'1px solid #ffb3b3' },
  field: { marginBottom:18 },
  label: { display:'block', fontSize:13, fontWeight:600, color:'#444', marginBottom:6 },
  input: { width:'100%', padding:'12px 14px', border:'1px solid #ddd', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box' },
  passwordWrapper: { display:'flex', alignItems:'center', border:'1px solid #ddd', borderRadius:8, overflow:'hidden' },
  passwordInput: { flex:1, padding:'12px 14px', border:'none', fontSize:14, outline:'none', fontFamily:'inherit' },
  eyeBtn: { background:'#f7f5f0', border:'none', borderLeft:'1px solid #ddd', padding:'12px 14px', cursor:'pointer', fontSize:16, color:'#555', fontFamily:'inherit' },
  recoverLink: { color:'#1f4d1f', fontSize:13, textDecoration:'none', fontWeight:500 },
  submitBtn: { width:'100%', padding:14, background:'#1f4d1f', color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
  submitBtnDisabled: { width:'100%', padding:14, background:'#ccc', color:'#fff', border:'none', borderRadius:8, fontSize:15, cursor:'not-allowed', fontFamily:'inherit' },

  divider: { display:'flex', alignItems:'center', gap:12, margin:'24px 0 16px' },
  dividerLine: { flex:1, height:1, background:'#eee' },
  dividerText: { fontSize:12, color:'#aaa', whiteSpace:'nowrap' },

  registerBtn: { display:'block', width:'100%', padding:13, background:'#fff', color:'#1f4d1f', border:'2px solid #1f4d1f', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textAlign:'center', textDecoration:'none', boxSizing:'border-box' },

  roleHint: { marginTop:24, background:'#f7f5f0', borderRadius:10, padding:'14px 16px' },
  roleHintTitle: { fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:0.5, marginBottom:12 },
  roleHintGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 },
  roleHintItem: { display:'flex', alignItems:'center', gap:6, fontSize:12 },

  // Footer
  footer: { background:'#1f4d1f', padding:'40px 40px 0' },
  footerGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:32, marginBottom:32 },
  footerHeading: { fontSize:12, fontWeight:700, color:'#f0c050', marginBottom:14, letterSpacing:1, textTransform:'uppercase' },
  footerLink: { fontSize:12, color:'#a8d5a8', marginBottom:9, cursor:'pointer' },
  footerBottom: { borderTop:'1px solid rgba(255,255,255,0.1)', padding:'16px 0', textAlign:'center', fontSize:12, color:'#a8d5a8' },
};
