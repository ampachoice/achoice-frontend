import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyForLoan } from '../../services/loanService';
import api from '../../services/api';
import farmerImg from '../../assets/farmer.jpg';

export default function LoanApplyPage() {
  const navigate = useNavigate();

  const [loanConfig, setLoanConfig] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    duration_months: '',
    repayment_preference: 'monthly',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // REPLACE your existing useEffect with this:

  useEffect(() => {
    api.get('/settings/loan')
      .then((res) => {
        setLoanConfig(res.data);
        // ✅ Always overwrite localStorage with fresh API data
        localStorage.removeItem('loan_settings');
      })
      .catch(() => {
        // Only fall back to localStorage if API completely fails
        const saved = localStorage.getItem('loan_settings');
        if (saved) {
          const s = JSON.parse(saved);
          setLoanConfig({
            min_amount: s.min_amount,
            max_amount: s.max_amount,
            default_interest: s.interest_rate,
            purposes: s.allowed_purposes.split(',').map((p, i) => ({ id: i, name: p.trim() })),
            durations: s.duration_options.split(',').map((d, i) => ({ id: i, months: Number(d.trim()), label: `${d.trim()} Months` })),
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const interestRate = parseFloat(loanConfig?.default_interest || 10);
  const minAmount = parseInt(loanConfig?.min_amount || 50000);
  const maxAmount = parseInt(loanConfig?.max_amount || 5000000);
  const purposes = loanConfig?.purposes || [];
  const durations = loanConfig?.durations || [];

  const calcInterest = Number(formData.amount) * interestRate / 100;
  const calcTotal = Number(formData.amount) + calcInterest;
  const calcMonthly = formData.duration_months
    ? Math.ceil(calcTotal / Number(formData.duration_months)) : 0;
  const calcWeekly = formData.duration_months
    ? Math.ceil(calcTotal / (Number(formData.duration_months) * 4)) : 0;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(formData.amount);
    if (amt < minAmount || amt > maxAmount) {
      setError(`Amount must be between ₦${minAmount.toLocaleString()} and ₦${maxAmount.toLocaleString()}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await applyForLoan({
        ...formData,
        interest_rate: interestRate,
        total_repayable: calcTotal,
        monthly_instalment: calcMonthly,
      });
      setSuccess(true);
    } catch (err) {
      setError('Failed to submit loan application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={s.center}>Loading loan settings...</div>;

  if (success) {
    return (
      <div style={s.page}>
        <nav style={s.nav}>
          <div style={s.navLogo} onClick={() => navigate('/')}>
            ACHOICE <span style={s.navAccent}>LIMITED</span>
          </div>
        </nav>
        <div style={s.successContainer}>
          <div style={s.successCard}>
            <div style={s.successIcon}>✓</div>
            <h2 style={s.successTitle}>Application Submitted!</h2>
            <p style={s.successText}>
              Your loan application has been submitted successfully. Our team will
              review it and get back to you within 24 hours.
            </p>
            <button style={s.successBtn} onClick={() => navigate('/loans/repay')}>
              View My Loans
            </button>
            <button style={s.outlineBtn} onClick={() => navigate('/')}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.navLogo} onClick={() => navigate('/')}>
          ACHOICE <span style={s.navAccent}>LIMITED</span>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => navigate('/')}>Home</span>
          <span style={s.navLink} onClick={() => navigate('/orders')}>My Orders</span>
          <span style={s.navLink} onClick={() => navigate('/loans/repay')}>My Loans</span>
        </div>
      </nav>

      {/* Hero Banner */}
      <div style={s.heroBanner}>
        <div style={s.heroLeft}>
          <img src={farmerImg} alt="African farmer" style={s.farmerImg} />
        </div>
        <div style={s.heroRight}>
          <div style={s.heroBadge}>ACHOICE Farm Finance</div>
          <h1 style={s.heroTitle}>Grow Your Farm with an ACHOICE Loan</h1>
          <p style={s.heroText}>
            Quick, affordable loans for farmers and buyers. Apply in minutes,
            get funded in 24 hours, and take your agricultural business to the next level.
          </p>
          <div style={s.heroStats}>
            <div style={s.heroStat}>
              <div style={s.heroStatVal}>₦{Number(maxAmount).toLocaleString()}</div>
              <div style={s.heroStatLabel}>Max Loan</div>
            </div>
            <div style={s.heroStatDivider}></div>
            <div style={s.heroStat}>
              <div style={s.heroStatVal}>24hrs</div>
              <div style={s.heroStatLabel}>Decision</div>
            </div>
            <div style={s.heroStatDivider}></div>
            <div style={s.heroStat}>
              <div style={s.heroStatVal}>{interestRate}%</div>
              <div style={s.heroStatLabel}>Flat Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div style={s.container}>
        <div style={s.layout}>

          {/* Form */}
          <div style={s.formCol}>
            <div style={s.card}>
              <h2 style={s.cardTitle}>Loan Application Form</h2>
              <p style={s.cardSubtitle}>Fill in the details below. All fields are required.</p>

              {error && <div style={s.error}>{error}</div>}

              <form onSubmit={handleSubmit}>
                <div style={s.field}>
                  <label style={s.label}>Loan Amount (NGN)</label>
                  <input
                    style={s.input}
                    type="number"
                    name="amount"
                    placeholder="e.g. 500000"
                    value={formData.amount}
                    onChange={handleChange}
                    min={minAmount}
                    max={maxAmount}
                    required
                  />
                  <div style={s.hint}>
                    Minimum: ₦{minAmount.toLocaleString()} — Maximum: ₦{maxAmount.toLocaleString()}
                  </div>
                </div>

                <div style={s.field}>
                  <label style={s.label}>Purpose of Loan</label>
                  <select
                    style={s.input}
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select purpose</option>
                    {purposes.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div style={s.field}>
                  <label style={s.label}>Loan Duration</label>
                  <select
                    style={s.input}
                    name="duration_months"
                    value={formData.duration_months}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select duration</option>
                    {durations.map((d) => (
                      <option key={d.id} value={d.months}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div style={s.field}>
                  <label style={s.label}>Repayment Preference</label>
                  <div style={s.radioGroup}>
                    <label style={s.radioLabel}>
                      <input
                        type="radio"
                        name="repayment_preference"
                        value="monthly"
                        checked={formData.repayment_preference === 'monthly'}
                        onChange={handleChange}
                      />
                      <span style={s.radioText}>Monthly</span>
                    </label>
                    <label style={s.radioLabel}>
                      <input
                        type="radio"
                        name="repayment_preference"
                        value="weekly"
                        checked={formData.repayment_preference === 'weekly'}
                        onChange={handleChange}
                      />
                      <span style={s.radioText}>Weekly</span>
                    </label>
                  </div>
                </div>

                {/* Loan Summary Box */}
                {formData.amount > 0 && (
                  <div style={s.summaryBox}>
                    <div style={s.summaryTitle}>Loan Summary</div>
                    <div style={s.summaryRow}>
                      <span style={s.summaryLabel}>Principal</span>
                      <span style={s.summaryValue}>₦{Number(formData.amount).toLocaleString()}</span>
                    </div>
                    <div style={s.summaryRow}>
                      <span style={s.summaryLabel}>Interest ({interestRate}%)</span>
                      <span style={s.summaryValue}>₦{calcInterest.toLocaleString()}</span>
                    </div>
                    <div style={s.summaryDivider}></div>
                    <div style={s.summaryRow}>
                      <span style={s.summaryLabel}>Total Repayable</span>
                      <span style={s.summaryTotal}>₦{calcTotal.toLocaleString()}</span>
                    </div>
                    {formData.duration_months && (
                      <div style={s.summaryRow}>
                        <span style={s.summaryLabel}>
                          {formData.repayment_preference === 'monthly' ? 'Monthly' : 'Weekly'} Payment
                        </span>
                        <span style={s.summaryTotal}>
                          ₦{formData.repayment_preference === 'monthly'
                            ? calcMonthly.toLocaleString()
                            : calcWeekly.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  style={submitting ? s.submitBtnDisabled : s.submitBtn}
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </div>
          </div>

          {/* Info Panel */}
          <div style={s.infoCol}>
            <div style={s.infoCard}>
              <h3 style={s.infoTitle}>Why ACHOICE Loans?</h3>
              <div style={s.infoList}>
                {[
                  `Loans from ₦${minAmount.toLocaleString()} to ₦${maxAmount.toLocaleString()}`,
                  'Decision within 24 hours',
                  'Flexible repayment weekly or monthly',
                  'No hidden charges',
                  'Dedicated support team',
                ].map((item) => (
                  <div key={item} style={s.infoItem}>
                    <span style={s.infoIcon}>✓</span>
                    <span style={s.infoText}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={s.configCard}>
              <div style={s.configTitle}>Current Loan Terms</div>
              {[
                ['Interest Rate', `${interestRate}% flat`],
                ['Min Amount', `₦${minAmount.toLocaleString()}`],
                ['Max Amount', `₦${maxAmount.toLocaleString()}`],
                ['Durations', durations.map(d => `${d.months}mo`).join(', ')],
              ].map(([label, val]) => (
                <div key={label} style={s.configRow}>
                  <span style={s.configLabel}>{label}</span>
                  <span style={s.configValue}>{val}</span>
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
  page: { minHeight: '100vh', backgroundColor: '#f7f5f0', fontFamily: 'Arial, sans-serif' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 16, color: '#666' },
  nav: { background: '#fff', padding: '18px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e8e4dc' },
  navLogo: { fontSize: 20, fontWeight: 900, color: '#1f4d1f', cursor: 'pointer' },
  navAccent: { color: '#c8860a' },
  navLinks: { display: 'flex', gap: 24, alignItems: 'center' },
  navLink: { color: '#555', fontSize: 14, cursor: 'pointer' },
  heroBanner: { background: '#1a3d1a', display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 280, overflow: 'hidden' },
  heroLeft: { overflow: 'hidden' },
  farmerImg: { width: '100%', height: '100%', objectFit: 'cover', minHeight: 280, display: 'block' },
  heroRight: { padding: '40px 40px 40px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  heroBadge: { display: 'inline-block', background: '#f0c050', color: '#1a3d1a', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, marginBottom: 14, width: 'fit-content' },
  heroTitle: { fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 12 },
  heroText: { fontSize: 14, color: '#a8d5a8', lineHeight: 1.7, marginBottom: 24 },
  heroStats: { display: 'flex', alignItems: 'center', gap: 20 },
  heroStat: { textAlign: 'center' },
  heroStatVal: { fontSize: 22, fontWeight: 700, color: '#f0c050' },
  heroStatLabel: { fontSize: 11, color: '#a8d5a8', marginTop: 2 },
  heroStatDivider: { width: 1, height: 40, background: 'rgba(255,255,255,0.2)' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '40px 16px' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 },
  formCol: {},
  card: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 32 },
  cardTitle: { fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 6 },
  cardSubtitle: { fontSize: 13, color: '#666', marginBottom: 24, lineHeight: 1.6 },
  error: { background: '#fff0f0', color: '#cc0000', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16 },
  field: { marginBottom: 20 },
  label: { display: 'block', fontSize: 13, color: '#333', fontWeight: 500, marginBottom: 6 },
  input: { width: '100%', padding: '11px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  hint: { fontSize: 11, color: '#888', marginTop: 4 },
  radioGroup: { display: 'flex', gap: 24 },
  radioLabel: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  radioText: { fontSize: 14, color: '#333' },
  summaryBox: { background: '#f0f7ec', border: '1px dashed #1f4d1f', borderRadius: 8, padding: 16, marginBottom: 20 },
  summaryTitle: { fontSize: 13, fontWeight: 700, color: '#1f4d1f', marginBottom: 12 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: '#555' },
  summaryValue: { fontSize: 13, color: '#333', fontWeight: 500 },
  summaryDivider: { height: 1, background: '#c5ddb8', margin: '8px 0' },
  summaryTotal: { fontSize: 15, fontWeight: 700, color: '#1f4d1f' },
  submitBtn: { width: '100%', padding: '13px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtnDisabled: { width: '100%', padding: '13px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, cursor: 'not-allowed', fontFamily: 'inherit' },
  infoCol: { display: 'flex', flexDirection: 'column', gap: 16 },
  infoCard: { background: '#1f4d1f', borderRadius: 10, padding: 24 },
  infoTitle: { fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 },
  infoList: { display: 'flex', flexDirection: 'column', gap: 12 },
  infoItem: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  infoIcon: { color: '#f0c050', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  infoText: { color: '#a8d5a8', fontSize: 13 },
  configCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 20 },
  configTitle: { fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 14 },
  configRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
  configLabel: { fontSize: 12, color: '#888' },
  configValue: { fontSize: 12, fontWeight: 600, color: '#1f4d1f' },
  successContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 16 },
  successCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 40, maxWidth: 420, width: '100%', textAlign: 'center' },
  successIcon: { fontSize: 48, color: '#1f4d1f', fontWeight: 700, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 12 },
  successText: { fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 28 },
  successBtn: { width: '100%', padding: '12px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 },
  outlineBtn: { width: '100%', padding: '12px', background: '#fff', color: '#1f4d1f', border: '2px solid #1f4d1f', borderRadius: 6, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
};