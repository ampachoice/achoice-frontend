import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import BuyerDropdown from "../../components/buyer/BuyerDropdown";
import NotificationBell from "../../components/buyer/NotificationBell";

const LOGO_PATH = "/achoice logo.png";

export default function LoanApplyPage() {
  const navigate = useNavigate();

  // Settings
  const [loanConfig, setLoanConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form
  const [step, setStep] = useState(1); // 1=loan details, 2=identity, 3=documents, 4=review
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedLoan, setSubmittedLoan] = useState(null);
  const [ninBvnLocked, setNinBvnLocked] = useState(false);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  // Step 1 — Loan Details
  const [loanForm, setLoanForm] = useState({
    amount: "",
    purpose: "",
    duration_months: "",
    repayment_preference: "monthly",
  });

  // Step 2 — Identity
  const [identityForm, setIdentityForm] = useState({
    nin_number: "",
    bvn_number: "",
    bank_name: "",
    account_number: "",
    account_name: "",
  });

  // Step 3 — Documents
  const [documents, setDocuments] = useState({
    nin_document: null,
    bvn_document: null,
    bank_statement: null,
    collateral_document: null,
    other: null,
  });
  const [uploadProgress, setUploadProgress] = useState({}); // track per-doc upload status

  // Step 4 — Terms
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Live calculator
  const [tiers, setTiers] = useState([]);
  const [calcBreakdown, setCalcBreakdown] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState(null);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(cart.reduce((acc, item) => acc + (item.quantity || 1), 0));

    api
      .get("/settings/loan")
      .then((res) => setLoanConfig(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    api
      .get("/settings/loan-tiers")
      .then((res) => setTiers(res.data?.tiers || []))
      .catch(() => {});

    // Prefill identity/bank details from the buyer's most recent loan, if any.
    // NIN/BVN are locked (read-only) once set — one person only ever has one
    // of each — but bank details stay editable since buyers can switch banks.
    api
      .get("/loans/prefill")
      .then((res) => {
        const p = res.data || {};
        if (p.has_previous_data) {
          setIdentityForm((prev) => ({
            ...prev,
            nin_number: p.nin_number || prev.nin_number,
            bvn_number: p.bvn_number || prev.bvn_number,
            bank_name: p.bank_name || prev.bank_name,
            account_number: p.account_number || prev.account_number,
            account_name: p.account_name || prev.account_name,
          }));
        }
        setNinBvnLocked(!!p.nin_bvn_locked);
      })
      .catch(() => {});
  }, []);

  // Live, debounced call to the real backend calculator — fires on every
  // amount/duration change, matching how the buyer sees the actual quote
  // they'll get (tier + duration adjustment + loyalty discounts applied).
  useEffect(() => {
    const amt = Number(loanForm.amount);
    const dur = Number(loanForm.duration_months);

    if (!amt || amt < 1000 || !dur) {
      setCalcBreakdown(null);
      setCalcError(null);
      setCalcLoading(false);
      return;
    }

    setCalcLoading(true);
    const handle = setTimeout(() => {
      api
        .get("/loans/calculate", {
          params: { amount: amt, duration_months: dur },
        })
        .then((res) => {
          setCalcBreakdown(res.data.breakdown);
          setCalcError(null);
        })
        .catch((err) => {
          setCalcBreakdown(null);
          setCalcError(
            err.response?.data?.message || "Could not calculate loan cost.",
          );
        })
        .finally(() => setCalcLoading(false));
    }, 400);

    return () => clearTimeout(handle);
  }, [loanForm.amount, loanForm.duration_months]);

  const minAmount = parseInt(loanConfig?.min_amount || 50000);
  const maxAmount = parseInt(loanConfig?.max_amount || 5000000);
  const purposes = loanConfig?.purposes || [];
  const durations = loanConfig?.durations || [];

  const minTierRate = tiers.length
    ? Math.min(...tiers.map((t) => t.rate))
    : null;
  const maxTierRate = tiers.length
    ? Math.max(...tiers.map((t) => t.rate))
    : null;

  // Derived from the real backend breakdown — 0 / empty until it resolves
  const calcInterest = calcBreakdown?.total_interest ?? 0;
  const calcTotal = calcBreakdown?.total_repayable ?? 0;
  const calcMonthly = calcBreakdown?.monthly_instalment ?? 0;
  const calcWeekly =
    calcBreakdown && loanForm.duration_months
      ? Math.ceil(
          calcBreakdown.total_repayable / (Number(loanForm.duration_months) * 4),
        )
      : 0;

  // ── Step validation ───────────────────────────────────────────────────────
  const validateStep1 = () => {
    const amt = Number(loanForm.amount);
    if (!amt || amt < minAmount || amt > maxAmount) {
      setError(
        `Amount must be between ₦${minAmount.toLocaleString()} and ₦${maxAmount.toLocaleString()}`,
      );
      return false;
    }
    if (!loanForm.purpose) {
      setError("Please select a loan purpose.");
      return false;
    }
    if (!loanForm.duration_months) {
      setError("Please select a loan duration.");
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!identityForm.nin_number || identityForm.nin_number.length !== 11) {
      setError("Please enter a valid 11-digit NIN number.");
      return false;
    }
    if (!identityForm.bvn_number || identityForm.bvn_number.length !== 11) {
      setError("Please enter a valid 11-digit BVN number.");
      return false;
    }
    if (!identityForm.bank_name.trim()) {
      setError("Please enter your bank name.");
      return false;
    }
    if (!identityForm.account_number || identityForm.account_number.length !== 10) {
      setError("Please enter a valid 10-digit account number.");
      return false;
    }
    if (!identityForm.account_name.trim()) {
      setError("Please enter the account name.");
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep3 = () => {
    if (!documents.nin_document) {
      setError("Please upload your NIN document.");
      return false;
    }
    if (!documents.bvn_document) {
      setError("Please upload your BVN document.");
      return false;
    }
    if (!documents.bank_statement) {
      setError("Please upload your bank statement.");
      return false;
    }
    setError(null);
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep((s) => s - 1);
    setError(null);
    window.scrollTo(0, 0);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!agreedToTerms) {
      setError("Please agree to the Terms and Conditions before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // Step 1 — Submit loan application as JSON
      const res = await api.post("/loans/apply", {
        amount: Number(loanForm.amount),
        purpose: loanForm.purpose,
        duration_months: Number(loanForm.duration_months),
        repayment_preference: loanForm.repayment_preference,
        nin_number: identityForm.nin_number,
        bvn_number: identityForm.bvn_number,
        bank_name: identityForm.bank_name,
        account_number: identityForm.account_number,
        account_name: identityForm.account_name,
      });

      const loanId = res.data?.loan?.id || res.data?.data?.id || res.data?.id;

      // Step 2 — Upload documents one by one
      if (loanId) {
        const docDefs = [
          { key: "nin_document", type: "nin_document", label: "NIN Document" },
          { key: "bvn_document", type: "bvn_document", label: "BVN Document" },
          {
            key: "bank_statement",
            type: "statement_of_account",
            label: "Bank Statement",
          },
          {
            key: "collateral_document",
            type: "collateral_document",
            label: "Collateral",
          },
          { key: "other", type: "other", label: "Other" },
        ];

        for (const def of docDefs) {
          if (!documents[def.key]) continue;
          setUploadProgress((p) => ({ ...p, [def.key]: "uploading" }));
          const form = new FormData();
          form.append("document", documents[def.key]);
          form.append("type", def.type);
          form.append("description", def.label);
          try {
            await api.post(`/loans/${loanId}/documents`, form, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            setUploadProgress((p) => ({ ...p, [def.key]: "done" }));
          } catch (uploadErr) {
            setUploadProgress((p) => ({ ...p, [def.key]: "failed" }));
            console.error(
              "Upload failed for " + def.key + ":",
              uploadErr?.response?.data || uploadErr?.message,
            );
          }
        }
      }

      setSubmittedLoan(res.data?.loan || null);
      setSuccess(true);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) setError(Object.values(errors)[0][0]);
      else
        setError(
          err.response?.data?.message ||
            "Failed to submit application. Please try again.",
        );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={s.center}>Loading loan settings...</div>;

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={s.page}>
        <nav className="la-nav">
          <div className="la-nav-brand" onClick={() => navigate("/")}>
            <img src={LOGO_PATH} alt="Achoice" className="la-nav-logo" />
            <div>
              <div className="la-nav-name">ACHOICE LIMITED</div>
              <div className="la-nav-tag">Your needs our solutions</div>
            </div>
          </div>
        </nav>
        <style>{`
          .la-nav { background:#fff; padding:14px 60px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e8e4dc; position:sticky; top:0; z-index:100; gap:16px; }
          .la-nav-brand { display:flex; align-items:center; gap:10px; cursor:pointer; min-width:0; overflow:hidden; }
          .la-nav-brand > div { min-width:0; overflow:hidden; }
          .la-nav-logo { width:40px; height:40px; object-fit:contain; flex-shrink:0; }
          .la-nav-name { font-size:15px; font-weight:700; color:#1f4d1f; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .la-nav-tag { font-size:10px; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          @media (max-width:420px) {
            .la-nav { padding:10px 14px; }
            .la-nav-tag { display:none; }
          }
        `}</style>
        <div style={s.successContainer}>
          <div style={s.successCard}>
            <div
              style={
                submittedLoan?.status === "approved"
                  ? { ...s.successIconCircle, ...s.successIconCircleApproved }
                  : s.successIconCircle
              }
            >
              {submittedLoan?.status === "approved" ? "⚡" : "✓"}
            </div>
            <h2 style={s.successTitle}>
              {submittedLoan?.status === "approved"
                ? "Loan Approved Instantly!"
                : "Application Submitted!"}
            </h2>
            <p style={s.successText}>
              {submittedLoan?.status === "approved"
                ? "Great news — your loan qualified for automatic approval and has been approved right away. Funds will be disbursed shortly."
                : "Your loan application has been submitted successfully along with your documents. Our loan team will review everything and get back to you within 24 hours."}
            </p>

            {/* Doc upload status */}
            <div style={s.uploadStatusBox}>
              <div style={s.uploadStatusTitle}>Document Upload Status</div>
              {Object.entries(uploadProgress).map(([key, status]) => (
                <div key={key} style={s.uploadStatusRow}>
                  <span style={s.uploadStatusLabel}>
                    {key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  <span
                    style={{
                      ...s.uploadStatusBadge,
                      background:
                        status === "done"
                          ? "#eafaf0"
                          : status === "failed"
                            ? "#fff0f0"
                            : "#fff8e7",
                      color:
                        status === "done"
                          ? "#1a7a3a"
                          : status === "failed"
                            ? "#cc0000"
                            : "#b36b00",
                    }}
                  >
                    {status === "done"
                      ? "✓ Uploaded"
                      : status === "failed"
                        ? "✕ Failed"
                        : "⏳ Uploading"}
                  </span>
                </div>
              ))}
            </div>

            <button
              style={s.successBtn}
              onClick={() => navigate("/loans/repay")}
            >
              View My Loan Status
            </button>
            <button style={s.outlineBtn} onClick={() => navigate("/")}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Terms Modal ───────────────────────────────────────────────────────────
  const TermsModal = () => (
    <div style={s.modalOverlay} onClick={() => setShowTerms(false)}>
      <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h3 style={s.modalTitle}>Terms and Conditions</h3>
          <button style={s.modalClose} onClick={() => setShowTerms(false)}>
            ✕
          </button>
        </div>
        <div style={s.modalBody}>
          {[
            {
              title: "1. Loan Agreement",
              text: "By submitting this application, you agree to repay the full loan amount plus interest within the agreed duration. ACHOICE LIMITED reserves the right to approve or reject any application.",
            },
            {
              title: "2. Interest Rate",
              text: `Interest is calculated dynamically based on your loan amount, duration, and repayment history — currently ranging from ${minTierRate ?? "2.0"}% to ${maxTierRate ?? "5.0"}% per month. Your exact rate is shown before you submit. Rates are set by ACHOICE LIMITED and may be subject to change for future applications.`,
            },
            {
              title: "3. Repayment Obligation",
              text: "You are legally obligated to make repayments as scheduled. Late or missed payments may attract penalties and affect your eligibility for future loans.",
            },
            {
              title: "4. Document Authenticity",
              text: "All documents submitted (NIN, BVN, bank statement, collateral) must be authentic and belong to you. Submission of false documents is a criminal offence and will result in immediate cancellation of the loan and potential legal action.",
            },
            {
              title: "5. NIN & BVN Verification",
              text: "Your National Identification Number (NIN) and Bank Verification Number (BVN) will be verified with the relevant government agencies. By applying, you consent to this verification.",
            },
            {
              title: "6. Collateral",
              text: "Where collateral is provided, ACHOICE LIMITED reserves the right to claim the collateral in the event of loan default after due notice has been given.",
            },
            {
              title: "7. Privacy",
              text: "Your personal information and documents will be stored securely and used only for loan processing purposes. We will not share your data with third parties without your consent, except where required by law.",
            },
            {
              title: "8. Communication",
              text: "By applying, you agree to receive SMS, email and phone call communications from ACHOICE LIMITED regarding your loan application and repayment schedule.",
            },
            {
              title: "9. Governing Law",
              text: "This agreement is governed by the laws of the Federal Republic of Nigeria. Any disputes will be resolved in accordance with Nigerian law.",
            },
          ].map((item) => (
            <div key={item.title} style={s.termItem}>
              <div style={s.termTitle}>{item.title}</div>
              <div style={s.termText}>{item.text}</div>
            </div>
          ))}
        </div>
        <div style={s.modalFooter}>
          <button
            style={s.modalAgreeBtn}
            onClick={() => {
              setAgreedToTerms(true);
              setShowTerms(false);
            }}
          >
            ✓ I Agree to These Terms
          </button>
          <button style={s.modalCloseBtn} onClick={() => setShowTerms(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      {showTerms && <TermsModal />}

      {/* Navbar */}
      <nav className="la-nav">
        <div className="la-nav-brand" onClick={() => navigate("/")}>
          <img src={LOGO_PATH} alt="Achoice" className="la-nav-logo" />
          <div>
            <div className="la-nav-name">ACHOICE LIMITED</div>
            <div className="la-nav-tag">Your needs our solutions</div>
          </div>
        </div>
        <div className="la-nav-links">
          <span className="la-nav-link" onClick={() => navigate("/")}>
            Home
          </span>
          <span className="la-nav-link" onClick={() => navigate("/products")}>
            Shop
          </span>
          <span className="la-nav-link" onClick={() => navigate("/loans/repay")}>
            My Loans
          </span>
        </div>
        <div className="la-nav-actions">
          <div style={s.cartIcon} onClick={() => navigate("/cart")}>
            🛒 {cartCount > 0 && <span style={s.cartBadge}>{cartCount}</span>}
          </div>
          <NotificationBell />
          <BuyerDropdown cartCount={cartCount} />
        </div>
      </nav>

      <style>{`
        .la-nav { background:#fff; padding:14px 60px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e8e4dc; position:sticky; top:0; z-index:100; gap:16px; }
        .la-nav-brand { display:flex; align-items:center; gap:10px; cursor:pointer; min-width:0; overflow:hidden; flex:1 1 auto; }
        .la-nav-brand > div { min-width:0; overflow:hidden; }
        .la-nav-logo { width:40px; height:40px; object-fit:contain; flex-shrink:0; }
        .la-nav-name { font-size:15px; font-weight:700; color:#1f4d1f; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .la-nav-tag { font-size:10px; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .la-nav-links { display:flex; gap:24px; flex-shrink:0; }
        .la-nav-link { color:#555; font-size:14px; cursor:pointer; white-space:nowrap; }
        .la-nav-actions { display:flex; align-items:center; gap:16px; flex-shrink:0; }

        @media (max-width:900px) {
          .la-nav { padding:12px 20px; }
          .la-nav-links { gap:14px; }
        }
        @media (max-width:700px) {
          .la-nav-links { display:none; }
        }
        @media (max-width:420px) {
          .la-nav { padding:10px 14px; }
          .la-nav-tag { display:none; }
        }
      `}</style>

      {/* Hero */}
      <div className="la-hero">
        <div style={s.heroContent}>
          <div style={s.heroBadge}>ACHOICE Farm Finance</div>
          <h1 className="la-hero-title">Apply for an Agricultural Loan</h1>
          <p className="la-hero-subtitle">
            Quick, affordable loans for farmers and agro-businesses. Apply in
            minutes.
          </p>
          <div className="la-hero-stats">
            {[
              {
                val: `₦${Number(maxAmount).toLocaleString()}`,
                label: "Max Loan",
              },
              { val: "24hrs", label: "Decision Time" },
              {
                val: minTierRate ? `${minTierRate}%–${maxTierRate}%` : "—",
                label: "Monthly Rate",
              },
              { val: "Paystack", label: "Repay Method" },
            ].map((stat, i, arr) => (
              <div key={stat.label} className="la-hero-stat-group">
                <div style={s.heroStatVal}>{stat.val}</div>
                <div style={s.heroStatLabel}>{stat.label}</div>
                {i < arr.length - 1 && (
                  <div className="la-hero-stat-divider" />
                )}
              </div>
            ))}
          </div>
      <style>{`
        .la-hero { background:#1a3d1a; padding:48px 60px; }
        .la-hero-title { font-size:32px; font-weight:700; color:#fff; margin:0 0 10px; line-height:1.2; }
        .la-hero-subtitle { font-size:15px; color:#a8d5a8; margin:0 0 28px; }
        .la-hero-stats { display:flex; flex-wrap:wrap; gap:32px 24px; align-items:center; }
        .la-hero-stat-group { position:relative; }
        .la-hero-stat-divider { position:absolute; right:-16px; top:0; bottom:0; width:1px; background:rgba(255,255,255,0.2); }
        @media (max-width:900px) {
          .la-hero { padding:36px 24px; }
          .la-hero-title { font-size:26px; }
        }
        @media (max-width:600px) {
          .la-hero { padding:24px 18px; }
          .la-hero-title { font-size:21px; }
          .la-hero-subtitle { font-size:13px; margin-bottom:20px; }
          .la-hero-stats { gap:16px 24px; }
          .la-hero-stat-divider { display:none; }
        }
        @media (max-width:380px) {
          .la-hero-title { font-size:19px; }
        }
      `}</style>
        </div>
      </div>

      <div style={s.container}>
        {/* Step indicator */}
        <div style={s.stepBar}>
          {[
            { num: 1, label: "Loan Details" },
            { num: 2, label: "Identity" },
            { num: 3, label: "Documents" },
            { num: 4, label: "Review & Submit" },
          ].map((st, i) => (
            <div key={st.num} style={s.stepBarItem}>
              <div
                style={{
                  ...s.stepCircle,
                  background: step >= st.num ? "#1f4d1f" : "#e8e4dc",
                  color: step >= st.num ? "#fff" : "#999",
                }}
              >
                {step > st.num ? "✓" : st.num}
              </div>
              <div
                style={{
                  ...s.stepLabel,
                  color: step >= st.num ? "#1f4d1f" : "#aaa",
                  fontWeight: step === st.num ? 700 : 400,
                }}
              >
                {st.label}
              </div>
              {i < 3 && (
                <div
                  style={{
                    ...s.stepLine,
                    background: step > st.num ? "#1f4d1f" : "#e8e4dc",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div style={s.layout}>
          <div style={s.formCol}>
            {error && <div style={s.errorBanner}>⚠️ {error}</div>}

            {/* ══ STEP 1 — Loan Details ══ */}
            {step === 1 && (
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <div style={s.cardStep}>Step 1 of 4</div>
                  <h2 style={s.cardTitle}>Loan Details</h2>
                  <p style={s.cardSub}>
                    Tell us how much you need and what for.
                  </p>
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    Loan Amount (₦) <span style={s.req}>*</span>
                  </label>
                  <input
                    style={s.input}
                    type="number"
                    value={loanForm.amount}
                    onChange={(e) =>
                      setLoanForm((p) => ({ ...p, amount: e.target.value }))
                    }
                    placeholder={`₦${minAmount.toLocaleString()} — ₦${maxAmount.toLocaleString()}`}
                    min={minAmount}
                    max={maxAmount}
                  />
                  <div style={s.hint}>
                    Min: ₦{minAmount.toLocaleString()} · Max: ₦
                    {maxAmount.toLocaleString()}
                  </div>
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    Purpose of Loan <span style={s.req}>*</span>
                  </label>
                  <select
                    style={s.input}
                    value={loanForm.purpose}
                    onChange={(e) =>
                      setLoanForm((p) => ({ ...p, purpose: e.target.value }))
                    }
                  >
                    <option value="">Select purpose</option>
                    {purposes.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    Loan Duration <span style={s.req}>*</span>
                  </label>
                  <div style={s.durationGrid}>
                    {durations.length > 0 ? (
                      durations.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          style={{
                            ...s.durationBtn,
                            ...(String(loanForm.duration_months) ===
                            String(d.months)
                              ? s.durationBtnActive
                              : {}),
                          }}
                          onClick={() =>
                            setLoanForm((p) => ({
                              ...p,
                              duration_months: String(d.months),
                            }))
                          }
                        >
                          {d.label}
                        </button>
                      ))
                    ) : (
                      <div style={{ fontSize: 13, color: "#888" }}>
                        Loading durations from loan settings...
                      </div>
                    )}
                  </div>
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    Repayment Preference <span style={s.req}>*</span>
                  </label>
                  <div style={s.radioGroup}>
                    {[
                      {
                        val: "monthly",
                        label: "📅 Monthly",
                        sub: `₦${calcMonthly.toLocaleString()}/month`,
                      },
                      {
                        val: "weekly",
                        label: "📆 Weekly",
                        sub: `₦${calcWeekly.toLocaleString()}/week`,
                      },
                    ].map((opt) => (
                      <label
                        key={opt.val}
                        style={{
                          ...s.radioCard,
                          ...(loanForm.repayment_preference === opt.val
                            ? s.radioCardActive
                            : {}),
                        }}
                      >
                        <input
                          type="radio"
                          name="repayment_preference"
                          value={opt.val}
                          checked={loanForm.repayment_preference === opt.val}
                          onChange={(e) =>
                            setLoanForm((p) => ({
                              ...p,
                              repayment_preference: e.target.value,
                            }))
                          }
                          style={{ display: "none" }}
                        />
                        <div style={s.radioCardLabel}>{opt.label}</div>
                        {loanForm.amount > 0 && loanForm.duration_months && (
                          <div style={s.radioCardSub}>{opt.sub}</div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Summary box */}
                {loanForm.amount > 0 && (
                  <div style={s.summaryBox}>
                    <div style={s.summaryTitle}>📊 Loan Summary Preview</div>

                    {calcLoading && !calcBreakdown && (
                      <div style={{ fontSize: 13, color: "#888", padding: "8px 0" }}>
                        Calculating your rate...
                      </div>
                    )}

                    {calcError && (
                      <div style={{ fontSize: 13, color: "#cc0000", padding: "8px 0" }}>
                        ⚠️ {calcError}
                      </div>
                    )}

                    {calcBreakdown && (
                      <>
                        <div style={s.tierBadgeRow}>
                          <span style={s.tierBadge}>
                            {calcBreakdown.tier} Tier
                          </span>
                          {calcLoading && (
                            <span style={{ fontSize: 11, color: "#aaa" }}>
                              updating...
                            </span>
                          )}
                        </div>

                        {calcBreakdown.loyalty_reasons?.length > 0 && (
                          <div style={s.loyaltyBox}>
                            {calcBreakdown.loyalty_reasons.map((r) => (
                              <div key={r} style={s.loyaltyItem}>
                                🎉 {r}
                              </div>
                            ))}
                          </div>
                        )}

                        {[
                          [
                            "Principal",
                            `₦${Number(loanForm.amount).toLocaleString()}`,
                          ],
                          [
                            "Monthly Rate",
                            `${calcBreakdown.final_monthly_rate}% per month`,
                          ],
                          [
                            "Total Interest",
                            `₦${Number(calcInterest).toLocaleString()}`,
                          ],
                          [
                            "Total Repayable",
                            `₦${Number(calcTotal).toLocaleString()}`,
                          ],
                          [
                            "Monthly Instalment",
                            `₦${Number(calcMonthly).toLocaleString()}`,
                          ],
                          [
                            "Weekly Instalment",
                            `₦${Number(calcWeekly).toLocaleString()}`,
                          ],
                          [
                            "Cost per ₦1,000",
                            `₦${calcBreakdown.cost_per_1000}`,
                          ],
                        ].map(([label, val]) => (
                          <div key={label} style={s.summaryRow}>
                            <span style={s.summaryLabel}>{label}</span>
                            <span style={s.summaryVal}>{val}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {!calcBreakdown && !calcLoading && !calcError && (
                      <div style={{ fontSize: 13, color: "#888", padding: "8px 0" }}>
                        Select a duration to see your rate and repayment plan.
                      </div>
                    )}
                  </div>
                )}

                <button style={s.nextBtn} onClick={nextStep}>
                  Continue → Identity Verification
                </button>
              </div>
            )}

            {/* ══ STEP 2 — Identity ══ */}
            {step === 2 && (
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <div style={s.cardStep}>Step 2 of 4</div>
                  <h2 style={s.cardTitle}>Identity Verification</h2>
                  <p style={s.cardSub}>
                    Your NIN and BVN are required to verify your identity.
                  </p>
                </div>

                <div style={s.infoNotice}>
                  🔒 Your NIN and BVN will be verified with government
                  databases. This information is kept strictly confidential.
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    National Identification Number (NIN){" "}
                    <span style={s.req}>*</span>
                  </label>
                  <input
                    style={ninBvnLocked ? { ...s.input, ...s.inputLocked } : s.input}
                    type="text"
                    value={identityForm.nin_number}
                    onChange={(e) =>
                      setIdentityForm((p) => ({
                        ...p,
                        nin_number: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    placeholder="Enter your 11-digit NIN"
                    maxLength={11}
                    disabled={ninBvnLocked}
                  />
                  {ninBvnLocked && (
                    <div style={s.hint}>
                      🔒 Locked to your verified identity from a previous
                      application — NIN cannot be changed.
                    </div>
                  )}
                  <div style={s.hint}>
                    {identityForm.nin_number.length}/11 digits
                    {identityForm.nin_number.length === 11 && (
                      <span style={{ color: "#1a7a3a", marginLeft: 8 }}>
                        ✓ Valid length
                      </span>
                    )}
                  </div>
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    Bank Verification Number (BVN) <span style={s.req}>*</span>
                  </label>
                  <input
                    style={ninBvnLocked ? { ...s.input, ...s.inputLocked } : s.input}
                    type="text"
                    value={identityForm.bvn_number}
                    onChange={(e) =>
                      setIdentityForm((p) => ({
                        ...p,
                        bvn_number: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    placeholder="Enter your 11-digit BVN"
                    maxLength={11}
                    disabled={ninBvnLocked}
                  />
                  {ninBvnLocked && (
                    <div style={s.hint}>
                      🔒 Locked to your verified identity from a previous
                      application — BVN cannot be changed.
                    </div>
                  )}
                  <div style={s.hint}>
                    {identityForm.bvn_number.length}/11 digits
                    {identityForm.bvn_number.length === 11 && (
                      <span style={{ color: "#1a7a3a", marginLeft: 8 }}>
                        ✓ Valid length
                      </span>
                    )}
                  </div>
                  <div style={s.hint}>
                    To get your BVN, dial <strong>*565*0#</strong> on any bank's
                    line.
                  </div>
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    Bank Name <span style={s.req}>*</span>
                  </label>
                  <input
                    style={s.input}
                    type="text"
                    value={identityForm.bank_name}
                    onChange={(e) =>
                      setIdentityForm((p) => ({
                        ...p,
                        bank_name: e.target.value,
                      }))
                    }
                    placeholder="e.g. First Bank"
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    Account Number <span style={s.req}>*</span>
                  </label>
                  <input
                    style={s.input}
                    type="text"
                    value={identityForm.account_number}
                    onChange={(e) =>
                      setIdentityForm((p) => ({
                        ...p,
                        account_number: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    placeholder="10-digit account number"
                    maxLength={10}
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    Account Name <span style={s.req}>*</span>
                  </label>
                  <input
                    style={s.input}
                    type="text"
                    value={identityForm.account_name}
                    onChange={(e) =>
                      setIdentityForm((p) => ({
                        ...p,
                        account_name: e.target.value,
                      }))
                    }
                    placeholder="Name on the account — should match your ID"
                  />
                  <div style={s.hint}>
                    Loan disbursement will be sent to this account once
                    approved.
                  </div>
                </div>

                <div style={s.btnRow}>
                  <button style={s.backBtn} onClick={prevStep}>
                    ← Back
                  </button>
                  <button style={s.nextBtn} onClick={nextStep}>
                    Continue → Documents
                  </button>
                </div>
              </div>
            )}

            {/* ══ STEP 3 — Documents ══ */}
            {step === 3 && (
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <div style={s.cardStep}>Step 3 of 4</div>
                  <h2 style={s.cardTitle}>Supporting Documents</h2>
                  <p style={s.cardSub}>
                    Upload clear scans or photos. Accepted: JPG, PNG, PDF. Max
                    5MB each.
                  </p>
                </div>

                <div style={s.infoNotice}>
                  📎 NIN document, BVN document and bank statement are required.
                  Collateral is optional but increases your chances of approval.
                </div>

                {[
                  {
                    key: "nin_document",
                    label: "NIN Document",
                    req: true,
                    desc: "Upload a clear photo or scan of your National ID card, NIMC slip or NIN slip",
                    icon: "🪪",
                  },
                  {
                    key: "bvn_document",
                    label: "BVN Document",
                    req: true,
                    desc: "Bank verification letter or statement header showing your BVN",
                    icon: "🏦",
                  },
                  {
                    key: "bank_statement",
                    label: "Bank Statement",
                    req: true,
                    desc: "3-6 months bank statement from your primary bank account",
                    icon: "📊",
                  },
                  {
                    key: "collateral_document",
                    label: "Collateral Document",
                    req: false,
                    desc: "Property deed, vehicle papers, or any asset document (optional)",
                    icon: "🏠",
                  },
                  {
                    key: "other",
                    label: "Other Supporting Document",
                    req: false,
                    desc: "Any other document that supports your application (optional)",
                    icon: "📄",
                  },
                ].map((doc) => (
                  <div key={doc.key} style={s.docField}>
                    <div style={s.docFieldHeader}>
                      <span style={s.docFieldIcon}>{doc.icon}</span>
                      <div style={s.docFieldInfo}>
                        <div style={s.docFieldLabel}>
                          {doc.label}
                          {doc.req && <span style={s.req}> *</span>}
                          {!doc.req && (
                            <span style={s.optional}> (optional)</span>
                          )}
                        </div>
                        <div style={s.docFieldDesc}>{doc.desc}</div>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      style={s.fileInput}
                      onChange={(e) =>
                        setDocuments((p) => ({
                          ...p,
                          [doc.key]: e.target.files[0],
                        }))
                      }
                    />
                    {documents[doc.key] && (
                      <div style={s.fileSelected}>
                        ✅ {documents[doc.key].name}
                        <span style={s.fileSize}>
                          {" "}
                          ({(documents[doc.key].size / 1024).toFixed(1)} KB)
                        </span>
                        <button
                          style={s.fileRemove}
                          onClick={() =>
                            setDocuments((p) => ({ ...p, [doc.key]: null }))
                          }
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                <div style={s.btnRow}>
                  <button style={s.backBtn} onClick={prevStep}>
                    ← Back
                  </button>
                  <button style={s.nextBtn} onClick={nextStep}>
                    Continue → Review
                  </button>
                </div>
              </div>
            )}

            {/* ══ STEP 4 — Review & Submit ══ */}
            {step === 4 && (
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <div style={s.cardStep}>Step 4 of 4</div>
                  <h2 style={s.cardTitle}>Review & Submit</h2>
                  <p style={s.cardSub}>
                    Review your application details before submitting.
                  </p>
                </div>

                {/* Loan Details Review */}
                <div style={s.reviewSection}>
                  <div style={s.reviewSectionTitle}>💰 Loan Details</div>
                  <div style={s.reviewGrid}>
                    {[
                      [
                        "Amount",
                        `₦${Number(loanForm.amount).toLocaleString()}`,
                      ],
                      ["Purpose", loanForm.purpose],
                      ["Duration", `${loanForm.duration_months} months`],
                      [
                        "Interest",
                        calcBreakdown
                          ? `${calcBreakdown.final_monthly_rate}% per month (${calcBreakdown.tier} tier)`
                          : "—",
                      ],
                      ["Total", `₦${Number(calcTotal).toLocaleString()}`],
                      ["Monthly", `₦${Number(calcMonthly).toLocaleString()}`],
                      ["Repayment", loanForm.repayment_preference],
                    ].map(([label, val]) => (
                      <div key={label} style={s.reviewItem}>
                        <div style={s.reviewLabel}>{label}</div>
                        <div style={s.reviewVal}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <button style={s.editBtn} onClick={() => setStep(1)}>
                    ✏ Edit
                  </button>
                </div>

                {/* Identity Review */}
                <div style={s.reviewSection}>
                  <div style={s.reviewSectionTitle}>🪪 Identity</div>
                  <div style={s.reviewGrid}>
                    <div style={s.reviewItem}>
                      <div style={s.reviewLabel}>NIN</div>
                      <div style={s.reviewVal}>
                        {"•".repeat(7) + identityForm.nin_number.slice(-4)}
                      </div>
                    </div>
                    <div style={s.reviewItem}>
                      <div style={s.reviewLabel}>BVN</div>
                      <div style={s.reviewVal}>
                        {"•".repeat(7) + identityForm.bvn_number.slice(-4)}
                      </div>
                    </div>
                  </div>
                  <button style={s.editBtn} onClick={() => setStep(2)}>
                    ✏ Edit
                  </button>
                </div>

                {/* Documents Review */}
                <div style={s.reviewSection}>
                  <div style={s.reviewSectionTitle}>📎 Documents</div>
                  {[
                    { key: "nin_document", label: "NIN Document" },
                    { key: "bvn_document", label: "BVN Document" },
                    { key: "bank_statement", label: "Bank Statement" },
                    { key: "collateral_document", label: "Collateral" },
                    { key: "other", label: "Other" },
                  ].map((doc) => (
                    <div key={doc.key} style={s.docReviewRow}>
                      <span style={s.docReviewLabel}>{doc.label}</span>
                      {documents[doc.key] ? (
                        <span style={s.docReviewDone}>
                          ✅ {documents[doc.key].name}
                        </span>
                      ) : (
                        <span style={s.docReviewNone}>Not uploaded</span>
                      )}
                    </div>
                  ))}
                  <button style={s.editBtn} onClick={() => setStep(3)}>
                    ✏ Edit
                  </button>
                </div>

                {/* ✅ Terms and Conditions */}
                <div style={s.termsSection}>
                  <label style={s.termsLabel}>
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      style={s.termsCheckbox}
                    />
                    <div style={s.termsText}>
                      I have read and agree to the{" "}
                      <button
                        style={s.termsLink}
                        type="button"
                        onClick={() => setShowTerms(true)}
                      >
                        Terms and Conditions
                      </button>{" "}
                      of ACHOICE LIMITED loan services. I confirm that all
                      information provided is accurate and the documents
                      submitted are genuine.
                    </div>
                  </label>
                </div>

                {error && <div style={s.errorBanner}>⚠️ {error}</div>}

                <div style={s.btnRow}>
                  <button style={s.backBtn} onClick={prevStep}>
                    ← Back
                  </button>
                  <button
                    style={
                      submitting || !agreedToTerms
                        ? s.submitBtnDisabled
                        : s.submitBtn
                    }
                    onClick={handleSubmit}
                    disabled={submitting || !agreedToTerms}
                  >
                    {submitting
                      ? "⏳ Submitting..."
                      : "📋 Submit Loan Application"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right panel — info */}
          <div style={s.infoCol}>
            <div style={s.infoCard}>
              <div style={s.infoCardTitle}>Why ACHOICE Loans?</div>
              {[
                `Loans up to ₦${Number(maxAmount).toLocaleString()}`,
                "Decision within 24 hours",
                "Flexible weekly or monthly repayment",
                minTierRate
                  ? `From ${minTierRate}% monthly — better rates for bigger, longer loans`
                  : "Competitive tiered rates — no hidden charges",
                "Repay securely via Paystack",
                "Dedicated loan officer support",
              ].map((item) => (
                <div key={item} style={s.infoItem}>
                  <span style={s.infoIcon}>✓</span>
                  <span style={s.infoText}>{item}</span>
                </div>
              ))}
            </div>

            <div style={s.termsCard}>
              <div style={s.termsCardTitle}>Current Loan Terms</div>
              {[
                [
                  "Interest Rate",
                  minTierRate ? `${minTierRate}% – ${maxTierRate}% /month` : "—",
                ],
                ["Min Amount", `₦${minAmount.toLocaleString()}`],
                ["Max Amount", `₦${maxAmount.toLocaleString()}`],
                ["Durations", durations.map((d) => d.label).join(", ")],
              ].map(([label, val]) => (
                <div key={label} style={s.termsRow}>
                  <span style={s.termsRowLabel}>{label}</span>
                  <span style={s.termsRowVal}>{val}</span>
                </div>
              ))}
            </div>

            {/* Step guide */}
            <div style={s.stepGuide}>
              <div style={s.stepGuideTitle}>Application Steps</div>
              {[
                { n: 1, label: "Fill loan details", done: step > 1 },
                { n: 2, label: "Verify identity (NIN & BVN)", done: step > 2 },
                { n: 3, label: "Upload documents", done: step > 3 },
                { n: 4, label: "Review & submit", done: false },
              ].map((st) => (
                <div key={st.n} style={s.stepGuideItem}>
                  <div
                    style={{
                      ...s.stepGuideNum,
                      background: step >= st.n ? "#1f4d1f" : "#e8e4dc",
                      color: step >= st.n ? "#fff" : "#aaa",
                    }}
                  >
                    {st.done ? "✓" : st.n}
                  </div>
                  <div
                    style={{
                      ...s.stepGuideLabel,
                      color: step >= st.n ? "#111" : "#aaa",
                      fontWeight: step === st.n ? 700 : 400,
                    }}
                  >
                    {st.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f7f5f0",
    fontFamily: "Arial, sans-serif",
  },
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    fontSize: 16,
    color: "#666",
  },

  // Nav
  nav: {
    background: "#fff",
    padding: "14px 60px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e8e4dc",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  },
  navLogo: { width: 40, height: 40, objectFit: "contain" },
  navName: { fontSize: 15, fontWeight: 700, color: "#1f4d1f" },
  navTag: { fontSize: 10, color: "#888" },
  navLinks: { display: "flex", gap: 24 },
  navLink: { color: "#555", fontSize: 14, cursor: "pointer" },
  navRight: { display: "flex", alignItems: "center", gap: 16 },
  cartIcon: { fontSize: 22, cursor: "pointer", position: "relative" },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    background: "#f0c050",
    color: "#1f4d1f",
    fontSize: 10,
    fontWeight: 700,
    borderRadius: "50%",
    width: 16,
    height: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // Hero
  heroBanner: { background: "#1a3d1a", padding: "48px 60px" },
  heroContent: { maxWidth: 900, margin: "0 auto" },
  heroBadge: {
    display: "inline-block",
    background: "#f0c050",
    color: "#1a3d1a",
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 14px",
    borderRadius: 99,
    marginBottom: 16,
  },
  heroTitle: { fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 10 },
  heroSubtitle: { fontSize: 15, color: "#a8d5a8", marginBottom: 28 },
  heroStats: { display: "flex", gap: 32, alignItems: "center" },
  heroStatGroup: { position: "relative" },
  heroStatVal: { fontSize: 22, fontWeight: 700, color: "#f0c050" },
  heroStatLabel: { fontSize: 11, color: "#a8d5a8", marginTop: 2 },
  heroStatDivider: {
    position: "absolute",
    right: -16,
    top: 0,
    bottom: 0,
    width: 1,
    background: "rgba(255,255,255,0.2)",
  },

  // Step bar
  stepBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "28px 16px",
    gap: 0,
    overflowX: "auto",
  },
  stepBarItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    position: "relative",
    flexShrink: 0,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  stepLabel: { fontSize: 12, whiteSpace: "nowrap" },
  stepLine: { width: 48, height: 2, margin: "0 8px", flexShrink: 0 },

  // Layout
  container: { maxWidth: 1060, margin: "0 auto", padding: "0 16px 60px" },
  layout: {
    display: "flex",
    flexWrap: "wrap",
    gap: 24,
    alignItems: "flex-start",
  },
  formCol: { flex: "3 1 320px", minWidth: 280 },

  // Card
  card: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8e4dc",
    padding: 32,
    marginBottom: 16,
  },
  cardHeader: { marginBottom: 24 },
  cardStep: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1f4d1f",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  cardTitle: { fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 6 },
  cardSub: { fontSize: 13, color: "#888" },

  // Fields
  field: { marginBottom: 22 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#333",
    marginBottom: 7,
  },
  req: { color: "#cc0000" },
  optional: { fontSize: 11, color: "#aaa", fontWeight: 400 },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  },
  inputLocked: {
    background: "#f5f5f0",
    color: "#888",
    cursor: "not-allowed",
  },
  hint: { fontSize: 12, color: "#888", marginTop: 5 },

  // Duration grid
  durationGrid: { display: "flex", flexWrap: "wrap", gap: 10 },
  durationBtn: {
    padding: "10px 18px",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fff",
    color: "#333",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "inherit",
  },
  durationBtnActive: {
    border: "2px solid #1f4d1f",
    background: "#f0f7ec",
    color: "#1f4d1f",
    fontWeight: 700,
  },

  // Radio cards
  radioGroup: { display: "flex", gap: 12 },
  radioCard: {
    flex: 1,
    padding: "14px 16px",
    border: "1px solid #ddd",
    borderRadius: 8,
    cursor: "pointer",
    textAlign: "center",
  },
  radioCardActive: { border: "2px solid #1f4d1f", background: "#f0f7ec" },
  radioCardLabel: { fontSize: 14, fontWeight: 600, color: "#1f4d1f" },
  radioCardSub: { fontSize: 12, color: "#888", marginTop: 4 },

  // Summary
  summaryBox: {
    background: "#f0f7ec",
    border: "1px solid #c5ddb8",
    borderRadius: 10,
    padding: 18,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#1f4d1f",
    marginBottom: 12,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 14,
  },
  summaryLabel: { color: "#555" },
  summaryVal: { fontWeight: 600, color: "#111" },
  tierBadgeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  tierBadge: {
    display: "inline-block",
    background: "#1f4d1f",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: 99,
  },
  loyaltyBox: {
    background: "#eafaf0",
    border: "1px solid #b8ddc5",
    borderRadius: 8,
    padding: "10px 12px",
    marginBottom: 12,
  },
  loyaltyItem: {
    fontSize: 12,
    color: "#1a7a3a",
    fontWeight: 600,
    padding: "2px 0",
  },

  // Info notice
  infoNotice: {
    background: "#fff8e7",
    border: "1px solid #f0c050",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 13,
    color: "#7a5c00",
    marginBottom: 20,
  },

  // Document fields
  docField: {
    background: "#f7f5f0",
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
  },
  docFieldHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  docFieldIcon: { fontSize: 24, flexShrink: 0 },
  docFieldInfo: { flex: 1 },
  docFieldLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111",
    marginBottom: 3,
  },
  docFieldDesc: { fontSize: 12, color: "#888", lineHeight: 1.5 },
  fileInput: {
    width: "100%",
    padding: "8px",
    border: "1px dashed #ccc",
    borderRadius: 7,
    fontSize: 13,
    background: "#fff",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  fileSelected: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    fontSize: 12,
    color: "#1a7a3a",
    background: "#eafaf0",
    padding: "6px 10px",
    borderRadius: 6,
  },
  fileSize: { color: "#888" },
  fileRemove: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#cc0000",
    fontSize: 14,
    marginLeft: "auto",
  },

  // Review
  reviewSection: {
    background: "#f7f5f0",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    position: "relative",
  },
  reviewSectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#1f4d1f",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 10,
    marginBottom: 8,
  },
  reviewItem: {},
  reviewLabel: { fontSize: 11, color: "#888", marginBottom: 2 },
  reviewVal: {
    fontSize: 13,
    fontWeight: 600,
    color: "#111",
    textTransform: "capitalize",
  },
  editBtn: {
    background: "none",
    border: "1px solid #ddd",
    borderRadius: 5,
    padding: "4px 12px",
    fontSize: 11,
    color: "#555",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  docReviewRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "7px 0",
    borderBottom: "1px solid #eee",
    fontSize: 13,
  },
  docReviewLabel: { color: "#555" },
  docReviewDone: { color: "#1a7a3a", fontSize: 12 },
  docReviewNone: { color: "#aaa", fontSize: 12 },

  // Terms
  termsSection: {
    background: "#f0f7ec",
    border: "1px solid #c5ddb8",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  termsLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    cursor: "pointer",
  },
  termsCheckbox: {
    marginTop: 2,
    width: 18,
    height: 18,
    flexShrink: 0,
    cursor: "pointer",
  },
  termsText: { fontSize: 13, color: "#333", lineHeight: 1.6 },
  termsLink: {
    background: "none",
    border: "none",
    color: "#1f4d1f",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0,
    fontFamily: "inherit",
  },

  // Errors
  errorBanner: {
    background: "#fff0f0",
    border: "1px solid #ffb3b3",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 13,
    color: "#cc0000",
    marginBottom: 16,
  },

  // Buttons
  btnRow: { display: "flex", gap: 12 },
  nextBtn: {
    flex: 1,
    padding: "13px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  backBtn: {
    padding: "13px 20px",
    background: "#fff",
    color: "#555",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  submitBtn: {
    flex: 1,
    padding: "13px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  submitBtnDisabled: {
    flex: 1,
    padding: "13px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },

  // Right panel
  infoCol: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    position: "sticky",
    top: 80,
    flex: "1 1 260px",
    minWidth: 240,
  },
  infoCard: { background: "#1f4d1f", borderRadius: 12, padding: 22 },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 16,
  },
  infoItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  infoIcon: { color: "#f0c050", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  infoText: { color: "#a8d5a8", fontSize: 13, lineHeight: 1.5 },
  termsCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8e4dc",
    padding: 18,
  },
  termsCardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#111",
    marginBottom: 14,
  },
  termsRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  termsRowLabel: { fontSize: 12, color: "#888" },
  termsRowVal: { fontSize: 12, fontWeight: 600, color: "#1f4d1f" },
  stepGuide: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8e4dc",
    padding: 18,
  },
  stepGuideTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#111",
    marginBottom: 16,
  },
  stepGuideItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  stepGuideNum: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  stepGuideLabel: { fontSize: 13 },

  // Success
  successContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "70vh",
    padding: 16,
  },
  successCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8e4dc",
    padding: 40,
    maxWidth: 480,
    width: "100%",
    textAlign: "center",
  },
  successIconCircle: {
    width: 72,
    height: 72,
    background: "#1f4d1f",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
    color: "#fff",
    margin: "0 auto 20px",
  },
  successIconCircleApproved: {
    background: "#b36b00",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#111",
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 1.7,
    marginBottom: 24,
  },
  uploadStatusBox: {
    background: "#f7f5f0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    textAlign: "left",
  },
  uploadStatusTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  uploadStatusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  uploadStatusLabel: {
    fontSize: 13,
    color: "#333",
    textTransform: "capitalize",
  },
  uploadStatusBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 99,
  },
  successBtn: {
    width: "100%",
    padding: "13px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    marginBottom: 10,
  },
  outlineBtn: {
    width: "100%",
    padding: "13px",
    background: "#fff",
    color: "#1f4d1f",
    border: "2px solid #1f4d1f",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  // Terms Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    background: "#fff",
    borderRadius: 14,
    width: "100%",
    maxWidth: 600,
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    background: "#1f4d1f",
    borderRadius: "14px 14px 0 0",
    flexShrink: 0,
  },
  modalTitle: { fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 },
  modalClose: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "#fff",
    width: 28,
    height: 28,
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: 14,
  },
  modalBody: { flex: 1, overflowY: "auto", padding: 24 },
  termItem: { marginBottom: 20 },
  termTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1f4d1f",
    marginBottom: 6,
  },
  termText: { fontSize: 13, color: "#555", lineHeight: 1.7 },
  modalFooter: {
    display: "flex",
    gap: 12,
    padding: "16px 24px",
    borderTop: "1px solid #eee",
    flexShrink: 0,
  },
  modalAgreeBtn: {
    flex: 1,
    padding: "11px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  modalCloseBtn: {
    padding: "11px 20px",
    background: "#f5f5f5",
    color: "#555",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
