import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const LOGO_PATH = '/achoice logo.png';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false, new: false, confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  let user = null;
  try { user = JSON.parse(localStorage.getItem('user')); } catch {}

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.new_password_confirmation) {
      setError('New passwords do not match.');
      return;
    }
    if (form.new_password.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/change-password', form);
      setSuccess(true);
      setTimeout(() => {
        // Redirect based on role
        if (user?.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (user?.role === 'staff') {
          const profile = user?.staff_profile;
          if (profile?.can_manage_agro) navigate('/staff/agro');
          else navigate('/staff/loans');
        } else {
          navigate('/products');
        }
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (pwd) => {
    if (!pwd) return null;
    if (pwd.length < 6) return { label: 'Weak', color: '#cc0000', width: '25%' };
    if (pwd.length < 8) return { label: 'Fair', color: '#b36b00', width: '50%' };
    if (pwd.length < 12) return { label: 'Good', color: '#1a7a3a', width: '75%' };
    return { label: 'Strong', color: '#1f4d1f', width: '100%' };
  };

  const strength = passwordStrength(form.new_password);

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
        <div style={s.navBrand}>
          <img src={LOGO_PATH} alt="ACHOICE Logo" style={s.logoImg} />
          <div>
            <div style={s.logoName}>ACHOICE LIMITED</div>
            <div style={s.logoTagline}>Your needs our solutions</div>
          </div>
        </div>
      </nav>

      {/* Body */}
      <div style={s.body}>
        <div style={s.formCard}>
          {/* Icon */}
          <div style={s.iconBox}>🔐</div>

          <h2 style={s.formTitle}>Set New Password</h2>

          {user?.name && (
            <p style={s.welcomeText}>
              Welcome, <strong>{user.name}</strong>! For your security, please set a new password before continuing.
            </p>
          )}

          {success ? (
            <div style={s.successBox}>
              <div style={s.successIcon}>✅</div>
              <div style={s.successTitle}>Password Changed Successfully!</div>
              <div style={s.successSub}>Redirecting you to your dashboard...</div>
            </div>
          ) : (
            <>
              {error && <div style={s.error}>{error}</div>}

              <form onSubmit={handleSubmit}>
                <div style={s.field}>
                  <label style={s.label}>Temporary Password</label>
                  <div style={s.passwordWrapper}>
                    <input
                      style={s.passwordInput}
                      type={showPasswords.current ? 'text' : 'password'}
                      placeholder="Enter temporary password from email"
                      value={form.current_password}
                      onChange={e => setForm({ ...form, current_password: e.target.value })}
                      required
                    />
                    <button type="button" style={s.eyeBtn}
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}>
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
                      placeholder="Minimum 8 characters"
                      value={form.new_password}
                      onChange={e => setForm({ ...form, new_password: e.target.value })}
                      required
                    />
                    <button type="button" style={s.eyeBtn}
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}>
                      {showPasswords.new ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {strength && (
                    <div style={s.strengthBox}>
                      <div style={s.strengthBar}>
                        <div style={{ ...s.strengthFill, width: strength.width, background: strength.color }} />
                      </div>
                      <span style={{ ...s.strengthLabel, color: strength.color }}>{strength.label}</span>
                    </div>
                  )}
                </div>

                <div style={s.field}>
                  <label style={s.label}>Confirm New Password</label>
                  <div style={s.passwordWrapper}>
                    <input
                      style={s.passwordInput}
                      type={showPasswords.confirm ? 'text' : 'password'}
                      placeholder="Repeat new password"
                      value={form.new_password_confirmation}
                      onChange={e => setForm({ ...form, new_password_confirmation: e.target.value })}
                      required
                    />
                    <button type="button" style={s.eyeBtn}
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}>
                      {showPasswords.confirm ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {form.new_password && form.new_password_confirmation && (
                    <div style={{
                      ...s.matchNote,
                      color: form.new_password === form.new_password_confirmation ? '#1a7a3a' : '#cc0000',
                    }}>
                      {form.new_password === form.new_password_confirmation ? '✓ Passwords match' : '✕ Passwords do not match'}
                    </div>
                  )}
                </div>

                <div style={s.requirements}>
                  <div style={s.reqTitle}>Password requirements:</div>
                  {[
                    { text: 'At least 8 characters', met: form.new_password.length >= 8 },
                    { text: 'Different from temporary password', met: form.new_password !== form.current_password && form.new_password.length > 0 },
                  ].map(req => (
                    <div key={req.text} style={{ ...s.req, color: req.met ? '#1a7a3a' : '#888' }}>
                      {req.met ? '✓' : '○'} {req.text}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  style={loading ? s.submitBtnDisabled : s.submitBtn}
                  disabled={loading}
                >
                  {loading ? 'Changing Password...' : 'Set New Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f7f5f0', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' },
  topBar: { background: '#1f4d1f', color: '#fff', padding: '8px 60px', display: 'flex', justifyContent: 'space-between', fontSize: 12 },
  topBarLeft: { display: 'flex', gap: 24 },
  topBarRight: { display: 'flex', gap: 24 },
  nav: { background: '#fff', padding: '14px 60px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e8e4dc' },
  navBrand: { display: 'flex', alignItems: 'center', gap: 10 },
  logoImg: { width: 45, height: 45, objectFit: 'contain' },
  logoName: { fontSize: 15, fontWeight: 700, color: '#1f4d1f' },
  logoTagline: { fontSize: 10, color: '#888' },
  body: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' },
  formCard: { background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc', padding: '40px', width: '100%', maxWidth: '460px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
  iconBox: { fontSize: 40, textAlign: 'center', marginBottom: 16 },
  formTitle: { fontSize: 22, fontWeight: 700, color: '#1f4d1f', textAlign: 'center', marginBottom: 8 },
  welcomeText: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 },
  error: { background: '#fff0f0', color: '#cc0000', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16, border: '1px solid #ffcccc' },
  field: { marginBottom: 18 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 },
  passwordWrapper: { display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' },
  passwordInput: { flex: 1, padding: '12px 14px', border: 'none', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  eyeBtn: { background: '#f0c050', border: 'none', padding: '12px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#1f4d1f', fontFamily: 'inherit' },
  strengthBox: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 },
  strengthBar: { flex: 1, height: 4, background: '#eee', borderRadius: 99, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 99, transition: 'width 0.3s' },
  strengthLabel: { fontSize: 11, fontWeight: 600, minWidth: 40 },
  matchNote: { fontSize: 12, marginTop: 6, fontWeight: 500 },
  requirements: { background: '#f7f5f0', borderRadius: 8, padding: '12px 14px', marginBottom: 20 },
  reqTitle: { fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8 },
  req: { fontSize: 12, marginBottom: 4 },
  submitBtn: { width: '100%', padding: '14px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtnDisabled: { width: '100%', padding: '14px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'not-allowed', fontFamily: 'inherit' },
  successBox: { textAlign: 'center', padding: '20px 0' },
  successIcon: { fontSize: 48, marginBottom: 12 },
  successTitle: { fontSize: 18, fontWeight: 700, color: '#1f4d1f', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#888' },
};