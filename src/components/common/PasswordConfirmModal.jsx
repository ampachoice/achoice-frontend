import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// PasswordConfirmModal — reusable password-confirmation gate for
// irreversible/high-stakes admin actions (remit, approve payout, disburse
// loan, ban user). Collects the admin's current password and calls
// onConfirm(password) — the caller is responsible for making the actual
// API request with that password in the body and for closing the modal
// on success. This component only handles the prompt + local error display.
//
// Usage:
//   const [showConfirm, setShowConfirm] = useState(false);
//   <PasswordConfirmModal
//     open={showConfirm}
//     title="Confirm Remittance"
//     description="Enter your password to remit ₦45,000 to Jane's Farm."
//     confirmLabel="Remit Payment"
//     onConfirm={async (password) => { await doRemit(password); }}
//     onCancel={() => setShowConfirm(false)}
//   />
// ─────────────────────────────────────────────────────────────────────────────

export default function PasswordConfirmModal({
  open,
  title = "Confirm Action",
  description = "Please enter your password to continue.",
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    if (submitting) return;
    setPassword("");
    setError("");
    onCancel?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("Password is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onConfirm(password);
      setPassword("");
    } catch (err) {
      // Surfaces the backend's 403 "wrong password" or 422 "missing
      // password" message directly -- callers can also catch their own
      // errors upstream and just let this show whatever bubbles up.
      setError(
        err?.response?.data?.message ||
          "Incorrect password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={s.overlay} onClick={handleClose}>
      <div style={s.card} onClick={(e) => e.stopPropagation()}>
        <h3 style={s.title}>{title}</h3>
        <p style={s.desc}>{description}</p>

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Your Password</label>
          <input
            style={s.input}
            type="password"
            autoFocus
            placeholder="Enter your current password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />

          {error && <div style={s.error}>⚠️ {error}</div>}

          <div style={s.actions}>
            <button
              type="button"
              style={s.cancelBtn}
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...s.confirmBtn,
                ...(danger ? s.confirmBtnDanger : {}),
                ...(submitting ? s.confirmBtnDisabled : {}),
              }}
              disabled={submitting}
            >
              {submitting ? "Confirming..." : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 26,
    maxWidth: 400,
    width: "100%",
    boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
  },
  title: { fontSize: 17, fontWeight: 700, color: "#111", margin: "0 0 8px" },
  desc: { fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 18 },
  label: {
    display: "block",
    fontSize: 12.5,
    fontWeight: 600,
    color: "#444",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
    boxSizing: "border-box",
    outline: "none",
  },
  error: {
    background: "#fff0f0",
    color: "#cc0000",
    padding: "9px 12px",
    borderRadius: 6,
    fontSize: 12.5,
    marginTop: 12,
    border: "1px solid #ffb3b3",
  },
  actions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 20,
  },
  cancelBtn: {
    padding: "10px 18px",
    background: "#f0f0f0",
    color: "#333",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  confirmBtn: {
    padding: "10px 20px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  confirmBtnDanger: {
    background: "#cc0000",
  },
  confirmBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};