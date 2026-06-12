import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const LOGO_PATH = '/achoice logo.png';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  let user = null;
  try { user = JSON.parse(localStorage.getItem('user')); } catch {}

  useEffect(() => {
    if (document.getElementById('cp-style')) return;
    const el = document.createElement('style');
    el.id = 'cp-style';
    el.textContent = `
      body { margin: 0; }
      .cp-wrap { min-height:100vh; background:#f7f5f0; font-family:Arial,sans-serif; display:flex; flex-direction:column; }

      /* Top bar */
      .cp-topbar { background:#1f4d1f; color:#fff; padding:7px 48px; display:flex; justify-content:space-between; align-items:center; font-size:12px; flex-wrap:wrap; gap:4px; }
      .cp-topbar-right span { margin-left:16px; }

      /* Nav */
      .cp-nav { background:#fff; border-bottom:1px solid #e8e4dc; padding:12px 48px; display:flex; align-items:center; position:sticky; top:0; z-index:100; }
      .cp-brand { display:flex; align-items:center; gap:10px; }
      .cp-brand img { width:44px; height:44px; object-fit:contain; }
      .cp-brand-name { font-size:15px; font-weight:700; color:#1f4d1f; }
      .cp-brand-tag { font-size:10px; color:#888; }

      /* Layout */
      .cp-body { flex:1; display:flex; align-items:center; justify-content:center; padding:52px 16px; }
      .cp-card { background:#fff; border-radius:16px; border:1px solid #e8e4dc; padding:44px 40px; width:100%; max-width:480px; box-shadow:0 6px 28px rgba(0,0,0,0.07); }

      /* Form elements */
      .cp-icon { font-size:44px; text-align:center; margin-bottom:16px; }
      .cp-title { font-size:24px; font-weight:700; color:#1f4d1f; text-align:center; margin:0 0 8px; }
      .cp-welcome { font-size:13px; color:#666; text-align:center; margin:0 0 28px; line-height:1.7; }
      .cp-error { background:#fff0f0; color:#cc0000; padding:12px 16px; border-radius:8px; font-size:13px; margin-bottom:18px; border:1px solid #ffb3b3; }
      .cp-field { margin-bottom:20px; }
      .cp-label { display:block; font-size:13px; font-weight:600; color:#444; margin-bottom:7px; }
      .cp-pw-wrap { display:flex; align-items:center; border:1.5px solid #ddd; border-radius:10px; overflow:hidden; transition:border .2s; }
      .cp-pw-wrap:focus-within { border-color:#1f4d1f; }
      .cp-pw-input { flex:1; padding:13px 14px; border:none; font-size:15px; outline:none; font-family:inherit; background:#fff; min-width:0; }
      .cp-eye { background:#f7f5f0; border:none; border-left:1.5px solid #ddd; padding:13px 16px; cursor:pointer; font-size:18px; color:#666; flex-shrink:0; }
      .cp-strength-wrap { display:flex; align-items:center; gap:8px; margin-top:7px; }
      .cp-strength-bar { flex:1; height:5px; background:#eee; border-radius:99px; overflow:hidden; }
      .cp-strength-fill { height:100%; border-radius:99px; transition:width .3s, background .3s; }
      .cp-match { font-size:12px; margin-top:7px; font-weight:600; }
      .cp-req-box { background:#f0f7ec; border:1px solid #c5ddb8; border-radius:10px; padding:14px 16px; margin-bottom:22px; }
      .cp-req-title { font-size:12px; font-weight:700; color:#1f4d1f; margin-bottom:8px; text-transform:uppercase; letter-spacing:.5px; }
      .cp-req { font-size:13px; margin-bottom:5px; display:flex; align-items:center; gap:7px; }
      .cp-btn { width:100%; padding:15px; background:#1f4d1f; color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:700; cursor:pointer; font-family:inherit; letter-spacing:.3px; }
      .cp-btn-dis { width:100%; padding:15px; background:#ccc; color:#fff; border:none; border-radius:10px; font-size:16px; cursor:not-allowed; font-family:inherit; }
      .cp-success { text-align:center; padding:32px 0; }
      .cp-success-icon { font-size:56px; margin-bottom:16px; }
      .cp-success-title { font-size:20px; font-weight:700; color:#1f4d1f; margin-bottom:10px; }
      .cp-success-sub { font-size:14px; color:#888; line-height:1.6; }

      /* ── MOBILE ── */
      @media (max-width:640px) {
        .cp-topbar { padding:6px 16px; font-size:11px; }
        .cp-topbar-right { display:none; }
        .cp-topbar-left span:last-child { display:none; }
        .cp-nav { padding:10px 16px; }
        .cp-brand img { width:38px; height:38px; }
        .cp-brand-name { font-size:13px; }
        .cp-body { padding:28px 12px; align-items:flex-start; }
        .cp-card { padding:28px 18px; border-radius:14px; box-shadow:0 2px 16px rgba(0,0,0,0.07); }
        .cp-icon { font-size:36px; margin-bottom:12px; }
        .cp-title { font-size:20px; }
        .cp-welcome { font-size:13px; margin-bottom:20px; }
        .cp-pw-input { font-size:16px; padding:14px 12px; }
        .cp-eye { padding:14px 13px; font-size:17px; }
        .cp-field { margin-bottom:16px; }
        .cp-btn, .cp-btn-dis { font-size:16px; padding:16px; border-radius:10px; }
        .cp-req { font-size:13px; }
      }
    `;
    document.head.appendChild(el);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.new_password_confirmation) { setError('New passwords do not match.'); return; }
    if (form.new_password.length < 8) { setError('New password must be at least 8 characters.'); return; }
    setLoading(true); setError(null);
    try {
      await api.post('/auth/change-password', form);
      setSuccess(true);
      setTimeout(() => {
        if (user?.role === 'admin') navigate('/admin/dashboard');
        else if (user?.role === 'staff') {
          const p = user?.staff_profile;
          navigate(p?.can_manage_agro ? '/staff/agro' : '/staff/loans');
        } else navigate('/products');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally { setLoading(false); }
  };

  const getStrength = (pwd) => {
    if (!pwd) return null;
    if (pwd.length < 6)  return { label: 'Weak',   color: '#cc0000', width: '25%' };
    if (pwd.length < 8)  return { label: 'Fair',   color: '#b36b00', width: '50%' };
    if (pwd.length < 12) return { label: 'Good',   color: '#1a7a3a', width: '75%' };
    return                      { label: 'Strong', color: '#1f4d1f', width: '100%' };
  };
  const str = getStrength(form.new_password);

  const fields = [
    { id: 'current', label: 'Temporary Password',   ph: 'Enter temporary password from email', key: 'current_password' },
    { id: 'new',     label: 'New Password',          ph: 'Minimum 8 characters',               key: 'new_password' },
    { id: 'confirm', label: 'Confirm New Password',  ph: 'Repeat new password',                key: 'new_password_confirmation' },
  ];

  const requirements = [
    { text: 'At least 8 characters',              met: form.new_password.length >= 8 },
    { text: 'Different from temporary password',  met: form.new_password !== form.current_password && form.new_password.length > 0 },
  ];

  return (
    <div className="cp-wrap">

      {/* Top Bar */}
      <div className="cp-topbar">
        <div className="cp-topbar-left" style={{ display:'flex', gap:16, alignItems:'center' }}>
          <span>📍 No 6 faith avenue off ekenwan Rd Benin City</span>
          <span>✉ support@achoice.ng</span>
        </div>
        <div className="cp-topbar-right" style={{ display:'flex', gap:16 }}>
          <span>📞 09067794991</span>
          <span>Mon-Sat: 07:00am-06:00pm</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="cp-nav">
        <div className="cp-brand">
          <img src={LOGO_PATH} alt="ACHOICE" />
          <div>
            <div className="cp-brand-name">ACHOICE LIMITED</div>
            <div className="cp-brand-tag">Your needs our solutions</div>
          </div>
        </div>
      </nav>

      {/* Body */}
      <div className="cp-body">
        <div className="cp-card">
          <div className="cp-icon">🔐</div>
          <h2 className="cp-title">Set New Password</h2>
          {user?.name && (
            <p className="cp-welcome">
              Welcome, <strong>{user.name}</strong>! For your security, please set a new password before continuing.
            </p>
          )}

          {success ? (
            <div className="cp-success">
              <div className="cp-success-icon">✅</div>
              <div className="cp-success-title">Password Changed Successfully!</div>
              <div className="cp-success-sub">Redirecting you to your dashboard...</div>
            </div>
          ) : (
            <>
              {error && <div className="cp-error">⚠️ {error}</div>}
              <form onSubmit={handleSubmit}>
                {fields.map(f => (
                  <div key={f.id} className="cp-field">
                    <label className="cp-label">{f.label}</label>
                    <div className="cp-pw-wrap">
                      <input className="cp-pw-input"
                        type={show[f.id] ? 'text' : 'password'}
                        placeholder={f.ph}
                        value={form[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        required />
                      <button type="button" className="cp-eye"
                        onClick={() => setShow(p => ({ ...p, [f.id]: !p[f.id] }))}>
                        {show[f.id] ? '🙈' : '👁'}
                      </button>
                    </div>
                    {f.id === 'new' && str && (
                      <div className="cp-strength-wrap">
                        <div className="cp-strength-bar">
                          <div className="cp-strength-fill" style={{ width: str.width, background: str.color }} />
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:str.color }}>{str.label}</span>
                      </div>
                    )}
                    {f.id === 'confirm' && form.new_password && form.new_password_confirmation && (
                      <div className="cp-match" style={{ color: form.new_password === form.new_password_confirmation ? '#1a7a3a' : '#cc0000' }}>
                        {form.new_password === form.new_password_confirmation ? '✓ Passwords match' : '✕ Passwords do not match'}
                      </div>
                    )}
                  </div>
                ))}

                <div className="cp-req-box">
                  <div className="cp-req-title">Password requirements</div>
                  {requirements.map(r => (
                    <div key={r.text} className="cp-req" style={{ color: r.met ? '#1a7a3a' : '#888' }}>
                      <span style={{ fontSize:16 }}>{r.met ? '✓' : '○'}</span>
                      {r.text}
                    </div>
                  ))}
                </div>

                <button type="submit" className={loading ? 'cp-btn-dis' : 'cp-btn'} disabled={loading}>
                  {loading ? 'Changing Password...' : 'Set New Password →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


