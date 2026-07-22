import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register, sendOtp, verifyOtp } from "../../services/authService";
import "./RegisterPage.css";

const DEFAULT_RESEND_COOLDOWN = 60; // seconds — matches the backend's default otp_resend_cooldown_seconds

const LOGO_PATH = "/achoice logo.png";

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    address: "",
    state: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Email OTP verification (required before the account can be created) ──
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState(""); // which email the verification belongs to
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [otpMessage, setOtpMessage] = useState(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Tick the resend countdown down once a second
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Editing the email after it's been verified invalidates that verification —
  // a code was issued for the old address, not the new one.
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, email: value }));
    if (emailVerified && value !== verifiedEmail) {
      setEmailVerified(false);
      setOtpSent(false);
      setOtpCode("");
      setOtpMessage(null);
      setOtpError(null);
      setResendCountdown(0);
    }
  };

  const handleUseDifferentEmail = () => {
    setFormData((prev) => ({ ...prev, email: "" }));
    setEmailVerified(false);
    setOtpSent(false);
    setOtpCode("");
    setOtpMessage(null);
    setOtpError(null);
    setResendCountdown(0);
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setOtpError("Enter your email address first.");
      return;
    }
    setOtpSending(true);
    setOtpError(null);
    setOtpMessage(null);
    try {
      const res = await sendOtp(formData.email, "buyer_signup");
      setOtpSent(true);
      setOtpMessage(res.data?.message || "Verification code sent — check your email.");
      setResendCountdown(DEFAULT_RESEND_COOLDOWN);
    } catch (err) {
      if (err.response?.status === 429) {
        // A code was already sent recently — let them enter it, and sync the
        // resend countdown to the server's actual cooldown.
        setOtpSent(true);
        setResendCountdown(err.response.data?.retry_after_seconds ?? DEFAULT_RESEND_COOLDOWN);
        setOtpError(err.response.data?.message || "Please wait before requesting another code.");
      } else {
        setOtpError(err.response?.data?.message || "Failed to send verification code. Please try again.");
      }
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 4) {
      setOtpError("Enter the code sent to your email.");
      return;
    }
    setOtpVerifying(true);
    setOtpError(null);
    try {
      await verifyOtp(formData.email, otpCode);
      setEmailVerified(true);
      setVerifiedEmail(formData.email);
      setOtpMessage("✓ Email verified.");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid or expired code. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailVerified) {
      setError("Please verify your email address before creating an account.");
      return;
    }
    if (formData.password !== formData.password_confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await register(formData);
      setSuccess("🎉 Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const message = err.response?.data?.errors
        ? Object.values(err.response.data.errors)[0][0]
        : err.response?.data?.message;

      // The server re-checks OTP verification with its own time window
      // (otp_expiry_minutes from the moment it was verified) — if someone
      // verifies but then spends too long on this step, /register rejects
      // them even though the UI still says "verified." Without this, they'd
      // be stuck resubmitting into the same error forever with no way out
      // except manually finding "Use a different email." Send them back to
      // Phase 1 to re-verify instead.
      if (message && message.toLowerCase().includes("verify your email")) {
        setEmailVerified(false);
        setOtpSent(false);
        setOtpCode("");
        setOtpMessage(null);
        setResendCountdown(0);
        setError("Your email verification expired while completing the form. Please verify again.");
      } else {
        setError(message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const pwMatch = formData.password && formData.password_confirmation;

  return (
    <div className="rp-wrap">
      {/* Top Bar */}
      <div className="rp-topbar">
        <div
          className="rp-topbar-left"
          style={{ display: "flex", gap: 14, flexWrap: "wrap" }}
        >
          <span>📍 No 6 faith avenue off ekenwan Rd Benin City</span>
          <span>✉ support@achoice.ng</span>
        </div>
        <div className="rp-topbar-right">
          <span>📞 09067794991</span>
          <span>Mon-Sat: 07:00am-06:00pm</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="rp-nav">
        <div className="rp-brand" onClick={() => navigate("/")}>
          <img src={LOGO_PATH} alt="ACHOICE" />
          <div>
            <div className="rp-brand-name">ACHOICE LIMITED</div>
            <div className="rp-brand-tag">Your needs our solutions</div>
          </div>
        </div>
        <div className="rp-nav-links">
          <Link to="/" className="rp-nav-link">
            Home
          </Link>
          <Link to="/products" className="rp-nav-link">
            Shop
          </Link>
          <Link to="/loans/apply" className="rp-nav-link">
            Loans
          </Link>
          <button className="rp-nav-btn" onClick={() => navigate("/login")}>
            Sign In
          </button>
        </div>
      </nav>

      {/* Body */}
      <div className="rp-body">
        <div className="rp-inner">
          {/* Left Info Panel */}
          <div className="rp-left">
            <div className="rp-left-badge">
              Nigeria's #1 Agricultural Marketplace
            </div>
            <h2 className="rp-left-title">
              Join Thousands of Nigerians Shopping Fresh Farm Produce
            </h2>
            <p className="rp-left-sub">
              Create your free account and start buying directly from verified
              farmers across all 36 states.
            </p>
            <div className="rp-left-feat">
              {[
                {
                  icon: "🌾",
                  label: "Farm Fresh Quality",
                  text: "Direct from verified farms — no middlemen, no markup.",
                },
                {
                  icon: "💳",
                  label: "Pay Securely",
                  text: "Paystack-powered payments — card, transfer, USSD.",
                },
                {
                  icon: "💰",
                  label: "Access Farm Loans",
                  text: "Apply for affordable loans with 24-hour decisions.",
                },
                {
                  icon: "🚚",
                  label: "Nationwide Delivery",
                  text: "Fast delivery to your doorstep across Nigeria.",
                },
              ].map((f) => (
                <div key={f.label} className="rp-left-feat-item">
                  <div className="rp-left-feat-icon">{f.icon}</div>
                  <div>
                    <div className="rp-left-feat-label">{f.label}</div>
                    <div className="rp-left-feat-text">{f.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rp-stats">
              {[
                ["500+", "Farmers"],
                ["10K+", "Buyers"],
                ["36", "States"],
              ].map(([v, l]) => (
                <div key={l}>
                  <div className="rp-stat-val">{v}</div>
                  <div className="rp-stat-label">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="rp-card">
            <div className="rp-card-logo">
              <img src={LOGO_PATH} alt="Logo" />
            </div>
            <h2 className="rp-card-title">
              {emailVerified ? "Complete Your Registration" : "Verify Your Email"}
            </h2>
            <p className="rp-card-sub">
              {emailVerified
                ? `Almost there — just a few more details for ${verifiedEmail}`
                : "Free forever, no hidden charges. We'll send a code to confirm it's really you."}
            </p>

            {success && <div className="rp-success">{success}</div>}
            {error && <div className="rp-error">⚠️ {error}</div>}

            {!emailVerified ? (
              /* ── PHASE 1: email + verification only ── */
              <form onSubmit={(e) => { e.preventDefault(); if (!otpSent) handleSendOtp(); }}>
                <div className="rp-field">
                  <label className="rp-label">Email Address</label>
                  <input
                    className="rp-input"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleEmailChange}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <div className="rp-field">
                  {!otpSent ? (
                    <button
                      type="button"
                      className="rp-eye"
                      style={{ width: "100%", borderRadius: 10, border: "1.5px solid #ddd", padding: "13px 14px", fontSize: 13, fontWeight: 700, color: "#1f4d1f", background: "#f7f5f0", cursor: otpSending ? "not-allowed" : "pointer" }}
                      onClick={handleSendOtp}
                      disabled={otpSending || !formData.email}
                    >
                      {otpSending ? "Sending code..." : "Verify Email — Send Code"}
                    </button>
                  ) : (
                    <div>
                      <label className="rp-label">Enter the 6-digit code sent to your email</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          className="rp-input"
                          type="text"
                          inputMode="numeric"
                          placeholder="123456"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          style={{ letterSpacing: 3, textAlign: "center", flex: 1 }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={otpVerifying || otpCode.length < 4}
                          style={{ padding: "0 20px", borderRadius: 10, border: "none", background: "#1f4d1f", color: "#fff", fontWeight: 700, fontSize: 13, cursor: otpVerifying ? "not-allowed" : "pointer" }}
                        >
                          {otpVerifying ? "Verifying..." : "Verify"}
                        </button>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={resendCountdown > 0 || otpSending}
                          style={{ background: "none", border: "none", padding: 0, fontSize: 12, fontWeight: 600, color: resendCountdown > 0 ? "#aaa" : "#1f4d1f", textDecoration: resendCountdown > 0 ? "none" : "underline", cursor: resendCountdown > 0 ? "default" : "pointer" }}
                        >
                          {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : "Resend code"}
                        </button>
                      </div>
                    </div>
                  )}
                  {otpMessage && <div className="rp-pw-match" style={{ color: "#1a7a3a" }}>{otpMessage}</div>}
                  {otpError && <div className="rp-pw-match" style={{ color: "#cc0000" }}>{otpError}</div>}
                </div>
              </form>
            ) : (
              /* ── PHASE 2: full registration form — only reachable once email is verified ── */
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#f0fff4",
                    border: "1px solid #a8d5a8",
                    color: "#1a7a3a",
                    borderRadius: 8,
                    padding: "9px 12px",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  ✓ {verifiedEmail}
                  <button
                    type="button"
                    onClick={handleUseDifferentEmail}
                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#1f4d1f", fontSize: 12, textDecoration: "underline", cursor: "pointer" }}
                  >
                    Use a different email
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="rp-field">
                    <label className="rp-label">Full Name</label>
                    <input
                      className="rp-input"
                      type="text"
                      name="name"
                      placeholder="e.g. Chukwuemeka Okafor"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="rp-field">
                    <label className="rp-label">Phone Number</label>
                    <input
                      className="rp-input"
                      type="tel"
                      name="phone"
                      placeholder="e.g. 08012345678"
                      maxLength={11}
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                        setFormData((prev) => ({ ...prev, phone: val }));
                      }}
                      required
                    />
                  </div>

                  <div className="rp-row2">
                    <div className="rp-field">
                      <label className="rp-label">State</label>
                      <select
                        className="rp-input"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                      >
                        <option value="">Select state</option>
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="rp-field">
                      <label className="rp-label">
                        Home Address{" "}
                        <span style={{ color: "#aaa", fontWeight: 400 }}>
                          (optional)
                        </span>
                      </label>
                      <input
                        className="rp-input"
                        type="text"
                        name="address"
                        placeholder="Street address"
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="rp-field">
                    <label className="rp-label">Password</label>
                    <div className="rp-pw-wrap">
                      <input
                        className="rp-pw-input"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Min 8 characters"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="rp-eye"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>

                  <div className="rp-field">
                    <label className="rp-label">Confirm Password</label>
                    <div className="rp-pw-wrap">
                      <input
                        className="rp-pw-input"
                        type={showConfirm ? "text" : "password"}
                        name="password_confirmation"
                        placeholder="Repeat your password"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="rp-eye"
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? "🙈" : "👁"}
                      </button>
                    </div>
                    {pwMatch && (
                      <div
                        className="rp-pw-match"
                        style={{
                          color:
                            formData.password === formData.password_confirmation
                              ? "#1a7a3a"
                              : "#cc0000",
                        }}
                      >
                        {formData.password === formData.password_confirmation
                          ? "✓ Passwords match"
                          : "✕ Passwords do not match"}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className={loading || !!success ? "rp-btn-dis" : "rp-btn"}
                    disabled={loading || !!success}
                  >
                    {loading
                      ? "Creating Account..."
                      : success
                        ? "Redirecting..."
                        : "Create Free Account →"}
                  </button>
                </form>
              </>
            )}

            <p className="rp-login-text">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="rp-footer">
        <div className="rp-footer-grid">
          <div>
            <div className="rp-footer-brand">
              <img src={LOGO_PATH} alt="ACHOICE" />
              <div>
                <div className="rp-footer-name">ACHOICE LIMITED</div>
                <div className="rp-footer-tag">Your needs our solutions</div>
              </div>
            </div>
            <p className="rp-footer-desc">
              ACHOICE LIMITED bridges the gap between farmers and customers
              looking to buy fresh farm products cheap.
            </p>
          </div>
          <div>
            <div className="rp-footer-heading">Products</div>
            {[
              "Grains & Cereals",
              "Vegetables",
              "Tubers & Roots",
              "Palm Oil",
              "Livestock",
            ].map((i) => (
              <div key={i} className="rp-footer-link">
                {i}
              </div>
            ))}
          </div>
          <div>
            <div className="rp-footer-heading">Explore</div>
            {[
              "About Us",
              "How It Works",
              "Farm Loans",
              "Privacy Policy",
              "Contact Us",
            ].map((i) => (
              <div key={i} className="rp-footer-link">
                {i}
              </div>
            ))}
          </div>
          <div>
            <div className="rp-footer-heading">Contact</div>
            <div className="rp-footer-link">
              📍 No 6 faith avenue off ekenwan Rd Benin City
            </div>
            <div className="rp-footer-link">✉ support@achoice.ng</div>
            <div className="rp-footer-link">📞 09067794991</div>
            <div className="rp-footer-link">🕐 Mon-Sat: 07:00am-06:00pm</div>
          </div>
        </div>
        <div className="rp-footer-bottom">
          © 2026 ACHOICE LIMITED. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
