import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../services/authService';

const LOGO_PATH = "/achoice logo.png";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    address: '',
    state: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // ✅ NEW: success state
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("Attempting registration with:", formData);
      const res = await register(formData);
      console.log("Registration Successful:", res.data);

      // ✅ DO NOT store token yet — user should log in manually
      // ✅ SMS: Your Laravel backend should fire a notification/SMS
      //    inside the register controller using Termii, Twilio, etc.
      //    If it needs a separate frontend call, add: await sendSmsOtp(formData.phone);

      // ✅ Show success message
      setSuccess('🎉 Account created successfully! Redirecting to login...');

      // ✅ Redirect to /login after 2 seconds so user sees the message
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error("Full Error Object:", err);

      if (err.response) {
        console.error("Server Error Data:", err.response.data);
        console.error("Server Status:", err.response.status);

        // Laravel validation errors come as err.response.data.errors (object)
        if (err.response.data.errors) {
          const firstError = Object.values(err.response.data.errors)[0][0];
          setError(firstError);
        } else {
          setError(err.response.data.message || "Registration failed. Please try again.");
        }
      } else if (err.request) {
        console.error("No response received from server.");
        setError("Cannot connect to server. Please check if your backend is running.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
    'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
    'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
    'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
    'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
  ];

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
          <div style={s.navLogo}>
            <img src={LOGO_PATH} alt="Achoice Logo" style={s.navLogoImg} />
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
          <button style={s.loginBtn} onClick={() => navigate('/login')}>
            Login
          </button>
        </div>
      </nav>

      {/* Register Form */}
      <div style={s.body}>
        <div style={s.formCard}>
          <h2 style={s.formTitle}>Create Account</h2>

          {/* ✅ Success Banner */}
          {success && <div style={s.successBox}>{success}</div>}

          {/* Error Banner */}
          {error && <div style={s.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={s.field}>
              <input
                style={s.input}
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

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
              <input
                style={s.input}
                type="tel"
                name="phone"
                placeholder="Phone Number e.g. 08012345678"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div style={s.field}>
              <input
                style={s.input}
                type="text"
                name="address"
                placeholder="Home Address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div style={s.field}>
              <select
                style={s.input}
                name="state"
                value={formData.state}
                onChange={handleChange}
              >
                <option value="">Select your state</option>
                {nigerianStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
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
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div style={s.field}>
              <div style={s.passwordWrapper}>
                <input
                  style={s.passwordInput}
                  type={showConfirm ? 'text' : 'password'}
                  name="password_confirmation"
                  placeholder="Confirm Password"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  style={s.eyeBtn}
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              style={loading || success ? s.submitBtnDisabled : s.submitBtn}
              type="submit"
              disabled={loading || !!success}
            >
              {loading ? 'Creating account...' : success ? 'Redirecting...' : 'Register'}
            </button>
          </form>

          <p style={s.loginText}>
            Already have an account?{' '}
            <Link to="/login" style={s.loginLink}>Login</Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerGrid}>
          <div>
            <div style={s.footerBrand}>
              <img src={LOGO_PATH} alt="Achoice Logo" style={s.footerLogoImg} />
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
            <div style={s.footerLink}>📍 No 6 faith avenue off ekenwan Rd Benin City</div>
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
  cartIcon: { position: 'relative', fontSize: 22, cursor: 'pointer' },
  cartBadge: { position: 'absolute', top: -6, right: -8, background: '#f0c050', color: '#1a1a1a', fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginBtn: { background: '#1f4d1f', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  body: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 16px' },
  formCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  formTitle: { fontSize: 26, fontWeight: 700, color: '#111', textAlign: 'center', marginBottom: 28 },

  // ✅ NEW: success box style
  successBox: { background: '#f0fff4', color: '#1f4d1f', border: '1px solid #a8d5a8', padding: '12px 14px', borderRadius: 6, fontSize: 14, fontWeight: 500, marginBottom: 16, textAlign: 'center' },

  error: { background: '#fff0f0', color: '#cc0000', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16 },
  field: { marginBottom: 16 },
  input: { width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  passwordWrapper: { display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden' },
  passwordInput: { flex: 1, padding: '12px 14px', border: 'none', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  eyeBtn: { background: '#f0c050', border: 'none', padding: '12px 14px', cursor: 'pointer', fontSize: 16 },
  submitBtn: { width: '100%', padding: '13px', background: '#145e05', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtnDisabled: { width: '100%', padding: '13px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 500, cursor: 'not-allowed', fontFamily: 'inherit' },
  loginText: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#666' },
  loginLink: { color: '#1f4d1f', fontWeight: 600, textDecoration: 'none' },
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
