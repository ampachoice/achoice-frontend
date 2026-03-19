import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyForLoan } from '../../services/loanService';
import farmerImg from '../../assets/farmer.jpg';

export default function LoanApplyPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    duration_months: '',
    repayment_preference: 'monthly',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await applyForLoan(formData);
      setSuccess(true);
    } catch (err) {
      setError('Failed to submit loan application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

     <div style={s.heroBanner}>
  <div style={s.heroLeft}>
    <img
      src={farmerImg}
      alt="African farmer"
      style={s.farmerImg}
    />
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
        <div style={s.heroStatVal}>₦5M</div>
        <div style={s.heroStatLabel}>Max Loan</div>
      </div>
      <div style={s.heroStatDivider}></div>
      <div style={s.heroStat}>
        <div style={s.heroStatVal}>24hrs</div>
        <div style={s.heroStatLabel}>Decision</div>
      </div>
      <div style={s.heroStatDivider}></div>
      <div style={s.heroStat}>
        <div style={s.heroStatVal}>10%</div>
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
              <p style={s.cardSubtitle}>
                Fill in the details below. All fields marked are required.
              </p>

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
                    min="50000"
                    max="5000000"
                    required
                  />
                  <div style={s.hint}>Minimum: ₦50,000 — Maximum: ₦5,000,000</div>
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
                    <option value="farm_expansion">Farm Expansion</option>
                    <option value="equipment_purchase">Equipment Purchase</option>
                    <option value="seeds_fertilizer">Seeds and Fertilizer</option>
                    <option value="irrigation">Irrigation Setup</option>
                    <option value="processing">Processing and Storage</option>
                    <option value="working_capital">Working Capital</option>
                    <option value="other">Other</option>
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
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="9">9 Months</option>
                    <option value="12">12 Months</option>
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

                <button
                  style={loading ? s.submitBtnDisabled : s.submitBtn}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
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
                  'Loans from N50,000 to N5,000,000',
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

            {formData.amount && formData.duration_months && (
              <div style={s.calcCard}>
                <h3 style={s.calcTitle}>Quick Estimate</h3>
                <div style={s.calcRow}>
                  <span style={s.calcLabel}>Loan Amount</span>
                  <span style={s.calcValue}>
                    N{Number(formData.amount).toLocaleString()}
                  </span>
                </div>
                <div style={s.calcRow}>
                  <span style={s.calcLabel}>Interest (10% flat)</span>
                  <span style={s.calcValue}>
                    N{(Number(formData.amount) * 0.1).toLocaleString()}
                  </span>
                </div>
                <div style={s.calcRow}>
                  <span style={s.calcLabel}>Total Repayment</span>
                  <span style={s.calcValue}>
                    N{(Number(formData.amount) * 1.1).toLocaleString()}
                  </span>
                </div>
                <div style={s.calcDivider}></div>
                <div style={s.calcRow}>
                  <span style={s.calcLabel}>
                    {formData.repayment_preference === 'monthly' ? 'Monthly' : 'Weekly'} Payment
                  </span>
                  <span style={s.calcHighlight}>
                    {formData.repayment_preference === 'monthly'
                      ? 'N' + Math.ceil((Number(formData.amount) * 1.1) / Number(formData.duration_months)).toLocaleString()
                      : 'N' + Math.ceil((Number(formData.amount) * 1.1) / (Number(formData.duration_months) * 4)).toLocaleString()
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f7f5f0', fontFamily: 'Arial, sans-serif' },
  nav: { background: '#fff', padding: '18px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e8e4dc' },
  navLogo: { fontSize: 20, fontWeight: 900, color: '#1f4d1f', cursor: 'pointer' },
  navAccent: { color: '#c8860a' },
  navLinks: { display: 'flex', gap: 24, alignItems: 'center' },
  navLink: { color: '#555', fontSize: 14, cursor: 'pointer' },
  heroBanner: { background: '#1a3d1a', display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 280, overflow: 'hidden' },
  heroLeft: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden' },
  //heroIllustration: { width: 220, height: 180, position: 'relative' },
  farmerScene: { width: '100%', height: '100%', position: 'relative' },
  sun: { position: 'absolute', top: 10, right: 20, width: 40, height: 40, background: '#f0c050', borderRadius: '50%' },
  field: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: '#2d5a1b', borderRadius: '0 0 8px 8px' },
  farmer: { position: 'absolute', bottom: 30, left: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  farmerHead: { width: 30, height: 30, background: '#8B4513', borderRadius: '50%', marginBottom: 2 },
  farmerBody: { width: 26, height: 40, background: '#2E5E2E', borderRadius: 4 },
  farmerArm: { position: 'absolute', right: -20, top: 35, width: 20, height: 6, background: '#8B4513', borderRadius: 3 },
  money: { position: 'absolute', right: -35, top: 25, fontSize: 20, color: '#f0c050', fontWeight: 700 },
  crop1: { position: 'absolute', bottom: 35, left: 20, width: 8, height: 30, background: '#4a8c2a', borderRadius: '50% 50% 0 0' },
  crop2: { position: 'absolute', bottom: 35, left: 35, width: 8, height: 40, background: '#4a8c2a', borderRadius: '50% 50% 0 0' },
  crop3: { position: 'absolute', bottom: 35, right: 30, width: 8, height: 35, background: '#4a8c2a', borderRadius: '50% 50% 0 0' },
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
  submitBtn: { width: '100%', padding: '13px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtnDisabled: { width: '100%', padding: '13px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, cursor: 'not-allowed', fontFamily: 'inherit' },
  infoCol: { display: 'flex', flexDirection: 'column', gap: 16 },
  infoCard: { background: '#1f4d1f', borderRadius: 10, padding: 24 },
  infoTitle: { fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 },
  infoList: { display: 'flex', flexDirection: 'column', gap: 12 },
  infoItem: { display: 'flex', alignItems: 'center', gap: 10 },
  infoIcon: { color: '#f0c050', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  infoText: { color: '#a8d5a8', fontSize: 13 },
  calcCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 24 },
  calcTitle: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 16 },
  calcRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
  calcLabel: { fontSize: 13, color: '#666' },
  calcValue: { fontSize: 13, color: '#333', fontWeight: 500 },
  calcDivider: { height: 1, background: '#eee', margin: '12px 0' },
  calcHighlight: { fontSize: 16, fontWeight: 700, color: '#1f4d1f' },
  successContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 16 },
  successCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 40, maxWidth: 420, width: '100%', textAlign: 'center' },
  successIcon: { fontSize: 48, color: '#1f4d1f', fontWeight: 700, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 12 },
  successText: { fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 28 },
  successBtn: { width: '100%', padding: '12px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 },
  outlineBtn: { width: '100%', padding: '12px', background: '#fff', color: '#1f4d1f', border: '2px solid #1f4d1f', borderRadius: 6, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  farmerImg: { width: '100%', height: 200, objectFit: 'cover', borderRadius: 10 },
  farmerImg: { width: '100%', height: '100%', objectFit: 'cover', minHeight: 280 },
  heroLeft: { overflow: 'hidden' },
farmerImg: { width: '100%', height: '100%', objectFit: 'cover', minHeight: 280, display: 'block' },
};