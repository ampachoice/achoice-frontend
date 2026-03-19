import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyActiveLoan, getMyLoanHistory, repayLoan } from '../../services/loanService';

export default function LoanRepayPage() {
  const navigate = useNavigate();
  const [activeLoan, setActiveLoan] = useState(null);
  const [loanHistory, setLoanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repaying, setRepaying] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [selectedQuick, setSelectedQuick] = useState(null);

  useEffect(() => {
    Promise.all([getMyActiveLoan(), getMyLoanHistory()])
      .then(([activeRes, historyRes]) => {
        setActiveLoan(activeRes.data);
        setLoanHistory(historyRes.data.data || historyRes.data);
      })
      .catch(() => setError('Failed to load loan information.'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleQuickSelect = (amount) => {
    setSelectedQuick(amount);
    setRepayAmount(amount.toString());
  };

  const handleRepay = async (e) => {
    e.preventDefault();
    if (!repayAmount) return;
    setRepaying(true);
    try {
      const res = await repayLoan({ amount: repayAmount });
      if (res.data.payment_url) {
        window.location.href = res.data.payment_url;
      } else {
        showToast('Repayment initiated successfully!');
      }
    } catch (err) {
      showToast('Repayment failed. Please try again.');
    } finally {
      setRepaying(false);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      pending: { background: '#fff8e7', color: '#b36b00' },
      approved: { background: '#eafaf0', color: '#1a7a3a' },
      active: { background: '#e7f0ff', color: '#1a4fa0' },
      rejected: { background: '#fff0f0', color: '#cc0000' },
      completed: { background: '#f0f0f0', color: '#555' },
    };
    return styles[status] || { background: '#f0f0f0', color: '#555' };
  };

  const getDotStyle = (status) => {
    const styles = {
      completed: { background: '#eafaf0', color: '#1a7a3a' },
      active: { background: '#e7f0ff', color: '#1a4fa0' },
      rejected: { background: '#fff0f0', color: '#cc0000' },
      pending: { background: '#fff8e7', color: '#b36b00' },
    };
    return styles[status] || { background: '#f0f0f0', color: '#555' };
  };

  if (loading) return <div style={s.center}>Loading your loans...</div>;

  const totalRepayment = activeLoan ? Number(activeLoan.total_repayment || activeLoan.amount * 1.1) : 0;
  const amountPaid = activeLoan ? Number(activeLoan.amount_paid || 0) : 0;
  const balance = totalRepayment - amountPaid;
  const progress = totalRepayment > 0 ? Math.round((amountPaid / totalRepayment) * 100) : 0;
  const monthlyPayment = activeLoan ? Math.ceil(totalRepayment / Number(activeLoan.duration_months || 6)) : 0;

  const quickAmounts = activeLoan ? [
    Math.ceil(monthlyPayment / 2),
    monthlyPayment,
    Math.ceil(monthlyPayment * 1.5),
    Math.ceil(balance),
  ] : [];

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      <nav style={s.nav}>
        <div style={s.navLogo} onClick={() => navigate('/')}>
          ACHOICE <span style={s.navAccent}>LIMITED</span>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => navigate('/')}>Home</span>
          <span style={s.navLink} onClick={() => navigate('/loans/apply')}>Apply for Loan</span>
          <span style={s.navLink} onClick={() => navigate('/orders')}>My Orders</span>
        </div>
      </nav>

      <div style={s.container}>
        <h1 style={s.pageTitle}>My Loans</h1>

        {error && <div style={s.error}>{error}</div>}

        {activeLoan && activeLoan.id ? (
          <>
            {/* Hero Card */}
            <div style={s.heroCard}>
              <div style={s.heroLeft}>
                <div style={s.heroBadge}>Active Loan</div>
                <div style={s.heroAmount}>
                  ₦{Number(activeLoan.amount).toLocaleString()}
                </div>
                <div style={s.heroSub}>
                  {activeLoan.purpose} — {activeLoan.duration_months} months repayment
                </div>
                <div style={s.heroStats}>
                  <div style={s.heroStat}>
                    <div style={s.heroStatVal}>
                      ₦{totalRepayment.toLocaleString()}
                    </div>
                    <div style={s.heroStatLabel}>Total Repayment</div>
                  </div>
                  <div style={s.heroStatDivider}></div>
                  <div style={s.heroStat}>
                    <div style={s.heroStatVal}>
                      {activeLoan.duration_months} mo
                    </div>
                    <div style={s.heroStatLabel}>Duration</div>
                  </div>
                </div>
              </div>
              <div style={s.heroRight}>
                <div style={s.progressTitle}>Repayment Progress</div>
                <div style={s.progressPct}>{progress}%</div>
                <div style={s.progressBg}>
                  <div style={{ ...s.progressFill, width: `${progress}%` }}></div>
                </div>
                <div style={s.progressNote}>
                  ₦{amountPaid.toLocaleString()} paid of ₦{totalRepayment.toLocaleString()}
                </div>
                <div style={s.nextPayment}>
                  <div>
                    <div style={s.nextLabel}>Next Payment Due</div>
                    <div style={s.nextVal}>₦{monthlyPayment.toLocaleString()}</div>
                  </div>
                  <div style={s.nextArrow}>→</div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={s.statsGrid}>
              {[
                { icon: '💰', val: `₦${amountPaid.toLocaleString()}`, label: 'Amount Paid' },
                { icon: '⏳', val: `₦${balance.toLocaleString()}`, label: 'Balance Left' },
                { icon: '📅', val: `${activeLoan.duration_months} mo`, label: 'Duration' },
                { icon: '✅', val: `${progress}%`, label: 'Completed' },
              ].map((item) => (
                <div key={item.label} style={s.statCard}>
                  <div style={s.statIcon}>{item.icon}</div>
                  <div style={s.statVal}>{item.val}</div>
                  <div style={s.statLabel}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Make Payment */}
            {activeLoan.status === 'active' && (
              <div style={s.repaySection}>
                <h2 style={s.repaySectionTitle}>Make a Repayment</h2>
                <p style={s.repaySectionSub}>
                  Select a quick amount or enter a custom amount below.
                </p>
                <div style={s.quickAmounts}>
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      style={selectedQuick === amt ? s.quickAmtSelected : s.quickAmt}
                      onClick={() => handleQuickSelect(amt)}
                    >
                      {amt === Math.ceil(balance)
                        ? `₦${amt.toLocaleString()} (Full)`
                        : `₦${amt.toLocaleString()}`}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleRepay}>
                  <div style={s.repayInputRow}>
                    <input
                      style={s.repayInput}
                      type="number"
                      placeholder="Enter repayment amount"
                      value={repayAmount}
                      onChange={(e) => {
                        setRepayAmount(e.target.value);
                        setSelectedQuick(null);
                      }}
                      required
                    />
                    <button
                      style={repaying ? s.repayBtnDisabled : s.repayBtn}
                      type="submit"
                      disabled={repaying}
                    >
                      {repaying ? 'Processing...' : 'Pay Now via Paystack'}
                    </button>
                  </div>
                </form>
                <p style={s.repayNote}>
                  Payments are processed securely via Paystack. You will be redirected to complete payment.
                </p>
              </div>
            )}
          </>
        ) : (
          <div style={s.noLoanBox}>
            <div style={s.noLoanIcon}>💳</div>
            <h2 style={s.noLoanTitle}>No Active Loan</h2>
            <p style={s.noLoanText}>You do not have an active loan at the moment.</p>
            <button style={s.applyBtn} onClick={() => navigate('/loans/apply')}>
              Apply for a Loan
            </button>
          </div>
        )}

        {/* Loan History */}
        {loanHistory.length > 0 && (
          <div style={s.historyCard}>
            <h2 style={s.historyTitle}>Loan History</h2>
            {loanHistory.map((loan) => (
              <div key={loan.id} style={s.historyItem}>
                <div style={s.historyLeft}>
                  <div style={{ ...s.historyDot, ...getDotStyle(loan.status) }}>
                    N
                  </div>
                  <div>
                    <div style={s.historyAmount}>
                      ₦{Number(loan.amount).toLocaleString()}
                    </div>
                    <div style={s.historyMeta}>
                      {new Date(loan.created_at).toLocaleDateString('en-NG', {
                        year: 'numeric', month: 'long'
                      })} — {loan.purpose}
                    </div>
                  </div>
                </div>
                <div style={{ ...s.badge, ...getStatusStyle(loan.status) }}>
                  {loan.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f7f5f0', fontFamily: 'Arial, sans-serif' },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999 },
  nav: { background: '#fff', padding: '18px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e8e4dc' },
  navLogo: { fontSize: 20, fontWeight: 900, color: '#1f4d1f', cursor: 'pointer' },
  navAccent: { color: '#c8860a' },
  navLinks: { display: 'flex', gap: 24, alignItems: 'center' },
  navLink: { color: '#555', fontSize: 14, cursor: 'pointer' },
  container: { maxWidth: '900px', margin: '0 auto', padding: '40px 16px' },
  pageTitle: { fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 24 },
  error: { background: '#fff0f0', color: '#cc0000', padding: '12px 16px', borderRadius: 7, marginBottom: 24, fontSize: 14 },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 16, color: '#666' },
  heroCard: { background: '#1a3d1a', borderRadius: 12, padding: 28, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 },
  heroLeft: {},
  heroBadge: { display: 'inline-block', background: '#f0c050', color: '#1a3d1a', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },
  heroAmount: { fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 12, color: '#a8d5a8', marginBottom: 20, textTransform: 'capitalize' },
  heroStats: { display: 'flex', alignItems: 'center', gap: 20 },
  heroStat: {},
  heroStatVal: { fontSize: 16, fontWeight: 700, color: '#f0c050' },
  heroStatLabel: { fontSize: 10, color: '#a8d5a8', marginTop: 2 },
  heroStatDivider: { width: 1, height: 32, background: 'rgba(255,255,255,0.2)' },
  heroRight: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  progressTitle: { fontSize: 11, color: '#a8d5a8', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' },
  progressPct: { fontSize: 28, fontWeight: 700, color: '#f0c050', marginBottom: 8 },
  progressBg: { background: 'rgba(255,255,255,0.15)', borderRadius: 99, height: 10, marginBottom: 6, overflow: 'hidden' },
  progressFill: { background: '#f0c050', height: 10, borderRadius: 99, transition: 'width 0.3s' },
  progressNote: { fontSize: 11, color: '#a8d5a8', marginBottom: 16 },
  nextPayment: { background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  nextLabel: { fontSize: 11, color: '#a8d5a8', marginBottom: 4 },
  nextVal: { fontSize: 16, fontWeight: 700, color: '#fff' },
  nextArrow: { color: '#f0c050', fontSize: 20 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 },
  statCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 16, textAlign: 'center' },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statVal: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#888' },
  repaySection: { background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc', padding: 28, marginBottom: 16 },
  repaySectionTitle: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 4 },
  repaySectionSub: { fontSize: 13, color: '#888', marginBottom: 20 },
  quickAmounts: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  quickAmt: { padding: '8px 16px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, color: '#333', cursor: 'pointer', background: '#fff', fontFamily: 'inherit' },
  quickAmtSelected: { padding: '8px 16px', border: '1px solid #1f4d1f', borderRadius: 6, fontSize: 13, color: '#fff', cursor: 'pointer', background: '#1f4d1f', fontFamily: 'inherit' },
  repayInputRow: { display: 'flex', gap: 10 },
  repayInput: { flex: 1, padding: '12px 14px', border: '2px solid #1f4d1f', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#1f4d1f', fontFamily: 'inherit', outline: 'none' },
  repayBtn: { padding: '12px 24px', background: '#f0c050', color: '#1a3d1a', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  repayBtnDisabled: { padding: '12px 24px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'not-allowed', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  repayNote: { fontSize: 11, color: '#888', marginTop: 10, textAlign: 'center' },
  noLoanBox: { background: '#fff', borderRadius: 12, border: '2px dashed #c5ddb8', padding: 48, textAlign: 'center', marginBottom: 16 },
  noLoanIcon: { fontSize: 48, marginBottom: 12 },
  noLoanTitle: { fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 },
  noLoanText: { fontSize: 14, color: '#666', marginBottom: 24 },
  applyBtn: { background: '#1f4d1f', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 7, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' },
  historyCard: { background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc', padding: 24 },
  historyTitle: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 16 },
  historyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f0f0f0' },
  historyLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  historyDot: { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  historyAmount: { fontSize: 15, fontWeight: 700, color: '#111' },
  historyMeta: { fontSize: 11, color: '#888', marginTop: 2, textTransform: 'capitalize' },
  badge: { fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 99, textTransform: 'capitalize' },
};