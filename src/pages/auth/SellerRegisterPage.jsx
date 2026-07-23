import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sendOtp, verifyOtp } from "../../services/authService";
import api from "../../services/api";
import "./SellerRegisterPage.css";

const LOGO_PATH = "/achoice logo.png";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

// Matches the backend exactly: cac_certificate is required|file|mimes:jpg,jpeg,png,pdf|max:10240 (KB)
const ALLOWED_CAC_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_CAC_SIZE_BYTES = 10240 * 1024; // 10240 KB = 10MB

export default function SellerRegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    business_name: "",
    state: "",
    password: "",
    password_confirmation: "",
  });
  const [cacFile, setCacFile] = useState(null);
  const [cacError, setCacError] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Email OTP verification state — identical pattern to RegisterPage ──
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [otpMessage, setOtpMessage] = useState(null);
  const [otpError, setOtpError] = useState(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleEmailChange = (e) => {
    setFormData({ ...formData, email: e.target.value });
    // Editing the email after verifying invalidates it — same as RegisterPage
    if (emailVerified) {
      setEmailVerified(false);
      setOtpSent(false);
      setOtpCode("");
      setOtpMessage(null);
    }
  };

  const handleSendOtp = async () => {
    if (!formData.email) return;
    setOtpSending(true);
    setOtpError(null);
    setOtpMessage(null);
    try {
      const res = await sendOtp({ email: formData.email, purpose: "seller_signup" });
      setOtpSent(true);
      setOtpMessage(res.data?.message || "Code sent — check your email.");
      setResendCountdown(60);
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 429 && err.response?.data?.retry_after_seconds) {
        setResendCountdown(err.response.data.retry_after_seconds);
      }
      setOtpError(message || "Failed to send code. Please try again.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) return;
    setOtpVerifying(true);
    setOtpError(null);
    try {
      await verifyOtp({ email: formData.email, code: otpCode });
      setEmailVerified(true);
      setVerifiedEmail(formData.email);
      setOtpMessage("Email verified!");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid or expired code.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleUseDifferentEmail = () => {
    setEmailVerified(false);
    setOtpSent(false);
    setOtpCode("");
    setOtpMessage(null);
    setOtpError(null);
  };

  const handleCacFileChange = (file) => {
    setCacError(null);
    if (!file) {
      setCacFile(null);
      return;
    }
    if (!ALLOWED_CAC_TYPES.includes(file.type)) {
      setCacError("Only JPG, PNG, or PDF files are accepted.");
      setCacFile(null);
      return;
    }
    if (file.size > MAX_CAC_SIZE_BYTES) {
      setCacError("File is too large — maximum size is 10MB.");
      setCacFile(null);
      return;
    }
    setCacFile(file);
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
    if (!cacFile) {
      setError("Please upload your CAC certificate (JPG, PNG, or PDF).");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    // multipart/form-data is required here — cac_certificate is a real
    // uploaded file, unlike the Cloudinary-URL-string pattern used
    // elsewhere (e.g. product images) where the frontend pre-uploads and
    // sends back just a URL. The backend does its own Cloudinary upload
    // for this specific field.
    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("email", formData.email);
    if (formData.phone) payload.append("phone", formData.phone);
    payload.append("password", formData.password);
    payload.append("password_confirmation", formData.password_confirmation);
    payload.append("business_name", formData.business_name);
    payload.append("state", formData.state);
    payload.append("cac_certificate", cacFile);

    try {
      const res = await api.post("/register-seller", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Unlike buyer registration, the seller endpoint logs the account in
      // immediately (returns token/user, status 201) rather than requiring
      // a separate login step — the account is created with
      // seller.status = 'pending_approval', and the dashboard already
      // handles displaying that pending state.
      const { token, user } = res.data;
      const expiresAt = new Date().getTime() + 60 * 2 * 60 * 1000;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("session_expires_at", expiresAt);
      localStorage.setItem("isLoggedIn", "true");

      setSuccess(res.data?.message || "🎉 Seller account created! Redirecting...");
      setTimeout(() => navigate("/seller/dashboard"), 2000);
    } catch (err) {
      const message = err.response?.data?.errors
        ? Object.values(err.response.data.errors)[0][0]
        : err.response?.data?.message;

      // Same OTP-expiry bounce-back as buyer registration
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

  return (
    <div className="sr-wrap">
      {/* Nav */}
      <nav className="sr-nav">
        <div className="sr-brand" onClick={() => navigate("/")}>
          <img src={LOGO_PATH} alt="ACHOICE Logo" />
          <div>
            <div className="sr-brand-name">ACHOICE LIMITED</div>
            <div className="sr-brand-tag">Your needs our solutions</div>
          </div>
        </div>
        <Link to="/login" className="sr-nav-btn">Sign In</Link>
      </nav>

      {/* Body */}
      <div className="sr-body">
        <div className="sr-inner">
          {/* Left panel */}
          <div className="sr-left">
            <span className="sr-left-badge">Sell on ACHOICE</span>
            <h1 className="sr-left-title">
              Grow Your Farm Business With Thousands of Buyers
            </h1>
            <p className="sr-left-sub">
              List your produce, reach verified buyers across Nigeria, and get
              paid securely — no upfront fees to join.
            </p>

            <div className="sr-left-feat">
              <div className="sr-left-feat-item">
                <div className="sr-left-feat-icon">🌾</div>
                <div>
                  <div className="sr-left-feat-label">List Your Products</div>
                  <div className="sr-left-feat-text">
                    Add what you grow or produce — reviewed and approved before going live.
                  </div>
                </div>
              </div>
              <div className="sr-left-feat-item">
                <div className="sr-left-feat-icon">💳</div>
                <div>
                  <div className="sr-left-feat-label">Get Paid Securely</div>
                  <div className="sr-left-feat-text">
                    Track your earnings and request payouts straight from your dashboard.
                  </div>
                </div>
              </div>
              <div className="sr-left-feat-item">
                <div className="sr-left-feat-icon">📈</div>
                <div>
                  <div className="sr-left-feat-label">Grow With Data</div>
                  <div className="sr-left-feat-text">
                    See what's selling, manage orders, and build your reputation with buyers.
                  </div>
                </div>
              </div>
            </div>

            <div className="sr-left-note">
              You'll need a valid CAC certificate to complete registration.
              Your application is reviewed by our team — you can sign in
              right away, and product listing unlocks once approved.
            </div>
          </div>

          {/* Card */}
          <div className="sr-card">
            <div className="sr-card-logo">
              <img src={LOGO_PATH} alt="Logo" />
            </div>
            <h2 className="sr-card-title">
              {emailVerified ? "Complete Your Seller Application" : "Verify Your Email"}
            </h2>
            <p className="sr-card-sub">
              {emailVerified
                ? `Almost there — just a few more details for ${verifiedEmail}`
                : "We'll send a code to confirm it's really you."}
            </p>

            {success && <div className="sr-success">{success}</div>}
            {error && <div className="sr-error">⚠️ {error}</div>}

            {!emailVerified ? (
              /* ── PHASE 1: email + verification only ── */
              <form onSubmit={(e) => { e.preventDefault(); if (!otpSent) handleSendOtp(); }}>
                <div className="sr-field">
                  <label className="sr-label">Email Address</label>
                  <input
                    className="sr-input"
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

                <div className="sr-field">
                  {!otpSent ? (
                    <button
                      type="button"
                      className="sr-eye"
                      style={{ width: "100%", borderRadius: 10, border: "1.5px solid #ddd", padding: "13px 14px", fontSize: 13, fontWeight: 700, color: "#1f4d1f", background: "#f7f5f0", cursor: otpSending ? "not-allowed" : "pointer" }}
                      onClick={handleSendOtp}
                      disabled={otpSending || !formData.email}
                    >
                      {otpSending ? "Sending code..." : "Verify Email — Send Code"}
                    </button>
                  ) : (
                    <div>
                      <label className="sr-label">Enter the 6-digit code sent to your email</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          className="sr-input"
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
                  {otpMessage && <div className="sr-pw-match" style={{ color: "#1a7a3a" }}>{otpMessage}</div>}
                  {otpError && <div className="sr-pw-match" style={{ color: "#cc0000" }}>{otpError}</div>}
                </div>
              </form>
            ) : (
              /* ── PHASE 2: seller application form ── */
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
                  <div className="sr-field">
                    <label className="sr-label">Full Name</label>
                    <input
                      className="sr-input"
                      type="text"
                      name="name"
                      placeholder="e.g. Chukwuemeka Okafor"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="sr-row2">
                    <div className="sr-field">
                      <label className="sr-label">
                        Phone Number{" "}
                        <span style={{ color: "#aaa", fontWeight: 400 }}>(optional)</span>
                      </label>
                      <input
                        className="sr-input"
                        type="tel"
                        name="phone"
                        placeholder="e.g. 08012345678"
                        maxLength={11}
                        value={formData.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                          setFormData((prev) => ({ ...prev, phone: val }));
                        }}
                      />
                    </div>
                    <div className="sr-field">
                      <label className="sr-label">State</label>
                      <select
                        className="sr-input"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select state</option>
                        {NIGERIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sr-field">
                    <label className="sr-label">Business Name</label>
                    <input
                      className="sr-input"
                      type="text"
                      name="business_name"
                      placeholder="e.g. Green Valley Farms"
                      value={formData.business_name}
                      onChange={handleChange}
                      required
                      maxLength={150}
                    />
                  </div>

                  <div className="sr-field">
                    <label className="sr-label">Password</label>
                    <div className="sr-pw-wrap">
                      <input
                        className="sr-pw-input"
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
                        className="sr-eye"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>

                  <div className="sr-field">
                    <label className="sr-label">Confirm Password</label>
                    <div className="sr-pw-wrap">
                      <input
                        className="sr-pw-input"
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
                        className="sr-eye"
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? "🙈" : "👁"}
                      </button>
                    </div>
                    {formData.password_confirmation && (
                      <div
                        className="sr-pw-match"
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

                  <div className="sr-field">
                    <label className="sr-label">CAC Certificate</label>
                    <label
                      className={"sr-file-drop" + (cacFile ? " sr-file-has" : "")}
                      htmlFor="cac-upload"
                    >
                      {cacFile
                        ? `✓ ${cacFile.name} (${(cacFile.size / 1024 / 1024).toFixed(1)}MB)`
                        : "📄 Click to upload — JPG, PNG, or PDF, max 10MB"}
                    </label>
                    <input
                      id="cac-upload"
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={(e) => handleCacFileChange(e.target.files?.[0] || null)}
                      style={{ display: "none" }}
                    />
                    {cacError && <span className="sr-hint" style={{ color: "#cc0000" }}>{cacError}</span>}
                  </div>

                  <button
                    type="submit"
                    className={loading || !!success ? "sr-btn-dis" : "sr-btn"}
                    disabled={loading || !!success}
                  >
                    {loading
                      ? "Submitting Application..."
                      : success
                        ? "Redirecting..."
                        : "Submit Seller Application →"}
                  </button>
                </form>
              </>
            )}

            <p className="sr-login-text">
              Already have a seller account? <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
