import { useState } from 'react';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// CloseAccountModal — self-service account closure (buyer or seller).
//
// Usage:
//   {showCloseModal && (
//     <CloseAccountModal onClose={() => setShowCloseModal(false)} />
//   )}
//
// On success: all tokens are revoked server-side, so this clears local
// storage and hard-redirects to /login — there's nothing left to keep in
// the SPA's memory at that point.
//
// Backend returns 422 for: wrong password, account already closed, or an
// active/pending loan exists (message tells them to settle it first) —
// all three are just shown as the server's message text, no special
// per-case handling needed since the backend message is already specific.
// ─────────────────────────────────────────────────────────────────────────────
export default function CloseAccountModal({ onClose }) {
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // Two-step: confirm the intent first, then reveal the password field —
  // matches the "strong confirmation step" the spec asks for rather than
  // a single click straight into a password box.
  const [step, setStep] = useState(1);

  const handleClose = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/account/close', {
        password,
        ...(reason.trim() && { reason: reason.trim() }),
      });
      localStorage.clear();
      window.location.href = '/login?message=' + encodeURIComponent('Your account has been closed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close account. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.box} onClick={(e) => e.stopPropagation()}>
        {step === 1 ? (
          <>
            <div style={s.warnIcon}>⚠️</div>
            <h3 style={s.title}>Close Your Account?</h3>
            <p style={s.body}>
              This will permanently anonymize your personal information. Your order and loan history stays
              in our records, but this action <strong>cannot be undone</strong> — only our team can reverse it,
              and doing so requires manually re-entering your details since they won't be recoverable.
            </p>
            <p style={s.body}>
              If you have an active or pending loan, you'll need to settle it before you can close your account.
            </p>
            <div style={s.actions}>
              <button type="button" style={s.btnNeutral} onClick={onClose}>
                Cancel
              </button>
              <button type="button" style={s.btnDanger} onClick={() => setStep(2)}>
                Continue
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleClose}>
            <h3 style={s.title}>Confirm With Your Password</h3>
            <p style={{ ...s.body, marginBottom: 18 }}>
              Enter your password to permanently close your account.
            </p>

            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.field}>
              <label style={s.label}>Password</label>
              <div style={s.passwordWrap}>
                <input
                  style={s.passwordInput}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  autoFocus
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

            <div style={s.field}>
              <label style={s.label}>
                Reason <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                style={s.textarea}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Help us understand why you're leaving..."
              />
            </div>

            <div style={s.actions}>
              <button
                type="button"
                style={s.btnNeutral}
                onClick={() => setStep(1)}
                disabled={submitting}
              >
                Back
              </button>
              <button
                type="submit"
                style={submitting || !password ? s.btnDangerDisabled : s.btnDanger}
                disabled={submitting || !password}
              >
                {submitting ? 'Closing Account...' : 'Permanently Close Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 3000, padding: 16,
  },
  box: {
    background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 440,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', fontFamily: 'Arial, sans-serif',
  },
  warnIcon: { fontSize: 32, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 12px' },
  body: { fontSize: 13.5, color: '#555', lineHeight: 1.6, margin: '0 0 12px' },
  errorBox: {
    background: '#fff0f0', color: '#a81f1f', border: '1px solid #f3b3b3',
    borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16,
  },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, color: '#333', fontWeight: 500, marginBottom: 6 },
  passwordWrap: {
    display: 'flex', alignItems: 'center', border: '1px solid #ddd',
    borderRadius: 8, overflow: 'hidden',
  },
  passwordInput: {
    flex: 1, padding: '11px 14px', border: 'none', fontSize: 14,
    fontFamily: 'inherit', outline: 'none', minWidth: 0,
  },
  eyeBtn: {
    background: '#f7f5f0', border: 'none', padding: '11px 14px', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, fontFamily: 'inherit', color: '#555', flexShrink: 0,
  },
  textarea: {
    width: '100%', padding: '11px 14px', border: '1px solid #ddd', borderRadius: 8,
    fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 70, resize: 'vertical',
  },
  actions: { display: 'flex', gap: 10, marginTop: 8 },
  btnNeutral: {
    flex: 1, padding: '12px', background: '#fff', color: '#555', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDanger: {
    flex: 1, padding: '12px', background: '#a81f1f', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDangerDisabled: {
    flex: 1, padding: '12px', background: '#e0b3b3', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'not-allowed', fontFamily: 'inherit',
  },
};
