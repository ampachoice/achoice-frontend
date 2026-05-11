import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMyActiveLoan, getMyLoanHistory, repayLoan } from '../../services/loanService';
import api from '../../services/api';
import BuyerDropdown from '../../components/buyer/BuyerDropdown';

export default function LoanRepayPage() {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ detect Paystack return
  const [activeLoan, setActiveLoan] = useState(null);
  const [loanHistory, setLoanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repaying, setRepaying] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [selectedQuick, setSelectedQuick] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleView, setScheduleView] = useState('monthly');
  const [verifying, setVerifying] = useState(false);
  const [lastReference, setLastReference] = useState(null); // ✅ stored after Paystack redirect

  const fetchLoanData = () => {
    setLoading(true);
    Promise.all([getMyActiveLoan(), getMyLoanHistory()])
      .then(([activeRes, historyRes]) => {
        const loanData = activeRes.data?.data || activeRes.data;
        setActiveLoan(loanData);
        setLoanHistory(historyRes.data?.data || historyRes.data || []);

        // ✅ Auto-set last reference from most recent pending repayment
        if (loanData?.repayments?.length > 0) {
          const latestPending = [...loanData.repayments]
            .reverse()
            .find(r => r.status === 'pending' && r.payment_reference);
          if (latestPending) {
            setLastReference(latestPending.payment_reference);
          }
        }
      })
      .catch(() => setError('Failed to load loan information.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((acc, item) => acc + (item.quantity || 1), 0));

    // ✅ Detect return from Paystack (has ?reference= or ?trxref= in URL)
    const params = new URLSearchParams(location.search);
    const reference = params.get('reference') || params.get('trxref');
    if (reference) {
      setLastReference(reference); // ✅ save so verify button can use it
      showToast('✅ Payment received! Click "Verify Payment" to update your balance.');
      window.history.replaceState({}, '', '/loans/repay');
    }

    fetchLoanData();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleQuickSelect = (amount) => {
    setSelectedQuick(amount);
    setRepayAmount(amount.toString());
  };

  const handleRepayDirect = async (amount) => {
    if (!amount || parseFloat(amount) <= 0) return;
    setRepaying(true);
    try {
      const res = await repayLoan({ amount: Number(amount) });
      if (res.data?.payment_url) {
        showToast('Redirecting to Paystack secure checkout...');
        setTimeout(() => { window.location.href = res.data.payment_url; }, 800);
      } else {
        showToast('Repayment initiated successfully!');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Repayment failed. Please try again.');
    } finally {
      setRepaying(false);
    }
  };

  const handleRepay = async (e) => {
    e.preventDefault();
    handleRepayDirect(repayAmount);
  };

  // ✅ POST /api/loans/verify-payment — checks Paystack directly and updates loan immediately
  const handleVerifyPayment = async (customRef) => {
    const reference = customRef || lastReference;
    if (!reference) {
      // Ask user to enter reference manually if not auto-captured
      const manualRef = window.prompt(
        'Enter your Paystack payment reference:\n(found in your payment confirmation email or SMS)'
      );
      if (!manualRef) return;
      return handleVerifyPayment(manualRef);
    }
    setVerifying(true);
    try {
      const result = await api.post('/loans/verify-payment', { reference });
      showToast(result.data?.message || '✅ Payment verified! Balance updated.');
      setLastReference(null);
      fetchLoanData();
    } catch (err) {
      showToast(err.response?.data?.message || '❌ Verification failed. Please try again or contact support.');
    } finally {
      setVerifying(false);
    }
  };

  const handlePayFullBalance = () => {
    if (!loan || balance <= 0) return;
    // ✅ Use loan.balance directly from API — the exact remaining amount
    console.log('Paying full balance:', balance, '(from loan.balance field)');
    handleRepayDirect(balance);
  };

  const getStatusStyle = (status) => ({
    pending:   { background: '#fff8e7', color: '#b36b00' },
    approved:  { background: '#eafaf0', color: '#1a7a3a' },
    disbursed: { background: '#e7f0ff', color: '#1a4fa0' },
    active:    { background: '#e7f0ff', color: '#1a4fa0' },
    rejected:  { background: '#fff0f0', color: '#cc0000' },
    completed: { background: '#f0f0f0', color: '#555' },
    paid:      { background: '#eafaf0', color: '#1a7a3a' },
  }[status] || { background: '#f0f0f0', color: '#555' });

  if (loading) return <div style={s.center}>Loading your loans...</div>;

  // ── Derived values — using EXACT field names from API ─────────────────────
  const loan = activeLoan;
  const isActive = loan && (loan.status === 'active' || loan.status === 'disbursed');
  const totalRepayment = loan ? Number(loan.total_repayable || 0) : 0;  // ✅ exact: total_repayable
  const amountPaid = loan ? Number(loan.amount_paid || 0) : 0;           // ✅ exact: amount_paid
  const balance = loan ? Number(loan.balance || 0) : 0;                  // ✅ exact: balance (direct field!)
  const progress = totalRepayment > 0 ? Math.round((amountPaid / totalRepayment) * 100) : 0;
  const durationMonths = loan ? Number(loan.duration_months || 6) : 6;
  const monthlyInstalment = loan ? Number(loan.monthly_instalment || 0) : 0; // ✅ exact: monthly_instalment
  const weeklyInstalment = Math.ceil(monthlyInstalment / 4);

  // Disbursement & due date
  const disbursedAt = loan?.disbursed_at ? new Date(loan.disbursed_at) : null;
  const dueDate = loan?.due_date ? new Date(loan.due_date) : null;
  const daysRemaining = dueDate
    ? Math.max(0, Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  // ── Generate schedule ──────────────────────────────────────────────────────
  const generateSchedule = (view) => {
    if (!loan) return [];
    const startDate = disbursedAt || new Date();
    const instalments = view === 'monthly' ? durationMonths : durationMonths * 4;
    const amount = view === 'monthly' ? monthlyInstalment : weeklyInstalment;
    let cumPaid = amountPaid;
    const schedule = [];

    for (let i = 1; i <= instalments; i++) {
      const date = new Date(startDate);
      if (view === 'monthly') date.setMonth(date.getMonth() + i);
      else date.setDate(date.getDate() + i * 7);
      const paid = cumPaid >= amount;
      if (paid) cumPaid -= amount;
      const overdue = !paid && date < new Date();
      schedule.push({ num: i, date, amount, paid, overdue });
    }
    return schedule;
  };

  const schedule = generateSchedule(scheduleView);
  const quickAmounts = loan
    ? [Math.ceil(monthlyInstalment / 2), monthlyInstalment, Math.ceil(monthlyInstalment * 1.5)]
    : [];

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navLeft} onClick={() => navigate('/products')}>
          <img src="/android-chrome-192x192.png" alt="Logo" style={s.logoImg} />
          <div style={s.logoText}>ACHOICE <span style={{ color: '#f0c050' }}>LOANS</span></div>
              
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => navigate('/')}>Home</span>
          <span style={s.navLink} onClick={() => navigate('/loans/apply')}>Apply for Loan</span>
          <span style={s.navLink} onClick={() => navigate('/orders')}>My Orders</span>
        </div>
        <div style={s.navRight}>
          <div style={s.cartIcon} onClick={() => navigate('/cart')}>
            🛒 {cartCount > 0 && <span style={s.badge}>{cartCount}</span>}
          </div>
          <BuyerDropdown cartCount={cartCount} />
        </div>
      </nav>

      <div style={s.container}>
        <div style={s.pageTitleRow}>
          <h1 style={s.pageTitle}>My Loans</h1>
          {/* ✅ Manual refresh — buyer can tap after returning from Paystack */}
          <button style={s.refreshBtn} onClick={fetchLoanData} disabled={loading}>
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
        {error && <div style={s.error}>{error}</div>}

        {loan && loan.id ? (
          <>
            {/* ── Hero Card ── */}
            <div style={s.heroCard}>
              <div style={s.heroLeft}>
                <div style={{ ...s.heroBadge, ...getStatusStyle(loan.status) }}>
                  {loan.status?.toUpperCase()}
                </div>
                <div style={s.heroAmount}>₦{Number(loan.amount).toLocaleString()}</div>
                <div style={s.heroSub}>{loan.purpose} — {durationMonths} months</div>

                <div style={s.heroStats}>
                  <div style={s.heroStat}>
                    <div style={s.heroStatVal}>₦{totalRepayment.toLocaleString()}</div>
                    <div style={s.heroStatLabel}>Total Repayable</div>
                  </div>
                  <div style={s.heroStatDivider} />
                  <div style={s.heroStat}>
                    <div style={s.heroStatVal}>{loan.interest_rate || '—'}%</div>
                    <div style={s.heroStatLabel}>Interest</div>
                  </div>
                  {daysRemaining !== null && (
                    <>
                      <div style={s.heroStatDivider} />
                      <div style={s.heroStat}>
                        <div style={{ ...s.heroStatVal, color: daysRemaining < 30 ? '#ff6b6b' : '#f0c050' }}>
                          {daysRemaining}d
                        </div>
                        <div style={s.heroStatLabel}>Days Left</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Disbursement info */}
                {disbursedAt && (
                  <div style={s.disbursedInfo}>
                    <span>📅 Disbursed: <strong>{fmtDate(disbursedAt)}</strong></span>
                    {dueDate && <span>⏰ Due: <strong>{fmtDate(dueDate)}</strong></span>}
                  </div>
                )}

                {/* Approved but not disbursed yet */}
                {loan.status === 'approved' && (
                  <div style={s.pendingDisbursement}>
                    ⏳ Loan approved! Admin will transfer funds to your bank account shortly. Repayment starts on disbursement date.
                  </div>
                )}
              </div>

              <div style={s.heroRight}>
                <div style={s.progressTitle}>Repayment Progress</div>
                <div style={s.progressPct}>{progress}%</div>
                <div style={s.progressBg}>
                  <div style={{ ...s.progressFill, width: `${progress}%` }} />
                </div>
                <div style={s.progressNote}>
                  ₦{amountPaid.toLocaleString()} paid of ₦{totalRepayment.toLocaleString()}
                </div>

                {/* Monthly + Weekly instalment cards */}
                <div style={s.instalmentCards}>
                  <div style={s.instalmentCard}>
                    <div style={s.instalmentIcon}>📅</div>
                    <div style={s.instalmentVal}>₦{monthlyInstalment.toLocaleString()}</div>
                    <div style={s.instalmentLabel}>Monthly</div>
                  </div>
                  <div style={s.instalmentCard}>
                    <div style={s.instalmentIcon}>📆</div>
                    <div style={s.instalmentVal}>₦{weeklyInstalment.toLocaleString()}</div>
                    <div style={s.instalmentLabel}>Weekly</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Stats Row ── */}
            <div style={s.statsGrid}>
              {[
                { icon: '💰', val: `₦${amountPaid.toLocaleString()}`, label: 'Amount Paid' },
                { icon: '⏳', val: `₦${balance.toLocaleString()}`, label: 'Balance Left' },
                { icon: '📅', val: `${durationMonths} mo`, label: 'Duration' },
                { icon: '✅', val: `${progress}%`, label: 'Completed' },
              ].map(item => (
                <div key={item.label} style={s.statCard}>
                  <div style={s.statIcon}>{item.icon}</div>
                  <div style={s.statVal}>{item.val}</div>
                  <div style={s.statLabel}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* ── Pay Full Balance ── */}
            {isActive && balance > 0 && (
              <div style={s.fullBalanceContainer}>
                <button
                  style={repaying ? s.fullBalanceBtnDisabled : s.fullBalanceBtn}
                  onClick={handlePayFullBalance}
                  disabled={repaying}
                >
                  {repaying ? '⏳ Redirecting to Paystack...' : `💳 PAY FULL BALANCE — ₦${balance.toLocaleString()}`}
                </button>
              </div>
            )}

            {/* ── Partial Repayment ── */}
            {isActive && (
              <div style={s.repaySection}>
                <h2 style={s.repaySectionTitle}>Make a Partial Repayment</h2>
                <p style={s.repaySectionSub}>Choose a quick amount or enter a custom amount. Paid via Paystack.</p>

                <div style={s.quickAmounts}>
                  {quickAmounts.map(amt => (
                    <button key={amt}
                      style={selectedQuick === amt ? s.quickAmtSelected : s.quickAmt}
                      onClick={() => handleQuickSelect(amt)}>
                      ₦{amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleRepay} style={s.repayForm}>
                  <input
                    style={s.repayInput}
                    type="number"
                    placeholder="Enter custom amount"
                    value={repayAmount}
                    onChange={e => { setRepayAmount(e.target.value); setSelectedQuick(null); }}
                    required
                  />
                  <button
                    type="submit"
                    style={repaying ? s.repayBtnDisabled : s.repayBtn}
                    disabled={repaying}
                  >
                    {repaying ? 'Redirecting...' : '💳 Pay with Paystack'}
                  </button>
                </form>
                <p style={s.repayNote}>🔒 Secured by Paystack · Accepts card, bank transfer & USSD</p>
              </div>
            )}

            {/* ── View Schedule Button ── */}
            <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 8 }}>
              <button onClick={() => setShowScheduleModal(true)} style={s.scheduleBtn}>
                📋 View Full Repayment Schedule
              </button>
            </div>

            {/* ✅ Verify Payment — shows automatically after Paystack redirect */}
            {lastReference && (
              <div style={s.verifyBanner}>
                <div style={s.verifyBannerText}>
                  <div style={s.verifyBannerTitle}>💳 Payment Completed on Paystack</div>
                  <div style={s.verifyBannerSub}>
                    Reference: <strong>{lastReference}</strong> · Click to confirm and update your balance
                  </div>
                </div>
                <button
                  style={verifying ? s.verifyBtnDisabled : s.verifyBtn}
                  onClick={() => handleVerifyPayment(lastReference)}
                  disabled={verifying}
                >
                  {verifying ? '⏳ Verifying...' : '✅ Verify Payment'}
                </button>
              </div>
            )}

            {/* Always show verify option in case buyer needs it */}
            {!lastReference && isActive && (
              <div style={s.verifyManual}>
                <span style={s.verifyManualText}>Already paid but balance not updated?</span>
                <button style={s.verifyManualBtn} onClick={() => handleVerifyPayment(null)}>
                  Verify Payment
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={s.noLoanBox}>
            <div style={s.noLoanIcon}>💳</div>
            <h2 style={s.noLoanTitle}>No Active Loan</h2>
            <p style={s.noLoanText}>You currently have no active loan.</p>
            <button style={s.applyBtn} onClick={() => navigate('/loans/apply')}>
              Apply for a Loan
            </button>
          </div>
        )}

        {/* ── Loan History ── */}
        {loanHistory.length > 0 && (
          <div style={s.historyCard}>
            <h2 style={s.historyTitle}>Loan History</h2>
            {loanHistory.map(l => (
              <div key={l.id} style={s.historyItem}>
                <div style={s.historyLeft}>
                  <div style={{ ...s.historyDot, ...getStatusStyle(l.status) }}>₦</div>
                  <div>
                    <div style={s.historyAmount}>₦{Number(l.amount).toLocaleString()}</div>
                    <div style={s.historyMeta}>
                      {fmtDate(l.created_at)} — {l.purpose}
                    </div>
                    {l.disbursed_at && (
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                        Disbursed: {fmtDate(l.disbursed_at)}
                        {l.due_date && ` · Due: ${fmtDate(l.due_date)}`}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ ...s.historyBadge, ...getStatusStyle(l.status) }}>{l.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Repayment Schedule Modal ── */}
      {showScheduleModal && (
        <div style={s.modalOverlay} onClick={() => setShowScheduleModal(false)}>
          <div style={s.modalContent} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>📋 Repayment Schedule</h2>
              <button style={s.closeBtn} onClick={() => setShowScheduleModal(false)}>✕</button>
            </div>

            {/* Monthly / Weekly toggle */}
            <div style={s.modalTabs}>
              <button
                style={scheduleView === 'monthly' ? s.modalTabActive : s.modalTab}
                onClick={() => setScheduleView('monthly')}
              >Monthly</button>
              <button
                style={scheduleView === 'weekly' ? s.modalTabActive : s.modalTab}
                onClick={() => setScheduleView('weekly')}
              >Weekly</button>
              <div style={s.modalTabInfo}>
                {scheduleView === 'monthly'
                  ? `₦${monthlyInstalment.toLocaleString()} / month`
                  : `₦${weeklyInstalment.toLocaleString()} / week`
                }
              </div>
            </div>

            {/* Table header */}
            <div style={s.scheduleHeadRow}>
              <span>#</span>
              <span>Due Date</span>
              <span>Amount</span>
              <span>Status</span>
            </div>

            {/* Schedule rows */}
            <div style={s.scheduleBody}>
              {schedule.map(row => (
                <div key={row.num} style={{
                  ...s.scheduleRow,
                  background: row.paid ? '#f0fff4' : row.overdue ? '#fff8f8' : '#fff',
                }}>
                  <span style={s.scheduleNum}>{row.num}</span>
                  <span style={s.scheduleDate}>{fmtDate(row.date)}</span>
                  <span style={s.scheduleAmt}>₦{row.amount.toLocaleString()}</span>
                  <span>
                    {row.paid
                      ? <span style={s.paidBadge}>✓ Paid</span>
                      : row.overdue
                        ? <span style={s.overdueBadge}>⚠ Overdue</span>
                        : <span style={s.upcomingBadge}>Upcoming</span>
                    }
                  </span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div style={s.modalSummary}>
              <span>Total: ₦{totalRepayment.toLocaleString()}</span>
              <span style={{ color: '#1a7a3a' }}>Paid: ₦{amountPaid.toLocaleString()}</span>
              <span style={{ color: '#cc0000' }}>Balance: ₦{balance.toLocaleString()}</span>
            </div>

            <div style={s.modalFooter}>
              <button style={s.closeModalBtn} onClick={() => setShowScheduleModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f7f5f0', fontFamily: 'Arial, sans-serif' },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 1001, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  nav: { background: '#1f4d1f', padding: '12px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', position: 'sticky', top: 0, zIndex: 100 },
  navLeft: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' },
  logoImg: { width: 35, height: 35, borderRadius: 4 },
  logoText: { fontWeight: 'bold', fontSize: 18 },
  navLinks: { display: 'flex', gap: 24, alignItems: 'center' },
  navLink: { color: '#f0c050', fontSize: 14, cursor: 'pointer', fontWeight: 500 },
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  cartIcon: { fontSize: 22, cursor: 'pointer', position: 'relative' },
  badge: { position: 'absolute', top: -8, right: -10, background: '#f0c050', color: '#1f4d1f', fontSize: 10, fontWeight: 'bold', width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  container: { maxWidth: 900, margin: '0 auto', padding: '40px 16px' },
  pageTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: 700, color: '#111', margin: 0 },
  refreshBtn: { padding: '8px 18px', background: '#fff', color: '#1f4d1f', border: '1px solid #1f4d1f', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  error: { background: '#fff0f0', color: '#cc0000', padding: '12px 16px', borderRadius: 7, marginBottom: 24, fontSize: 14 },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 16, color: '#666' },

  heroCard: { background: '#1a3d1a', borderRadius: 12, padding: 28, marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 },
  heroLeft: {},
  heroBadge: { display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, marginBottom: 10, letterSpacing: 1 },
  heroAmount: { fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 12, color: '#a8d5a8', marginBottom: 16, textTransform: 'capitalize' },
  heroStats: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 },
  heroStat: {},
  heroStatVal: { fontSize: 15, fontWeight: 700, color: '#f0c050' },
  heroStatLabel: { fontSize: 10, color: '#a8d5a8', marginTop: 2 },
  heroStatDivider: { width: 1, height: 28, background: 'rgba(255,255,255,0.2)' },
  disbursedInfo: { background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#a8d5a8', display: 'flex', flexDirection: 'column', gap: 3 },
  pendingDisbursement: { background: 'rgba(240,192,80,0.15)', border: '1px solid rgba(240,192,80,0.3)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#f0c050', marginTop: 10 },
  heroRight: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  progressTitle: { fontSize: 11, color: '#a8d5a8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  progressPct: { fontSize: 28, fontWeight: 700, color: '#f0c050', marginBottom: 8 },
  progressBg: { background: 'rgba(255,255,255,0.15)', borderRadius: 99, height: 10, marginBottom: 6, overflow: 'hidden' },
  progressFill: { background: '#f0c050', height: 10, borderRadius: 99, transition: 'width 0.3s' },
  progressNote: { fontSize: 11, color: '#a8d5a8', marginBottom: 14 },
  instalmentCards: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  instalmentCard: { background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 12, textAlign: 'center' },
  instalmentIcon: { fontSize: 18, marginBottom: 4 },
  instalmentVal: { fontSize: 14, fontWeight: 700, color: '#f0c050' },
  instalmentLabel: { fontSize: 10, color: '#a8d5a8', marginTop: 2 },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 },
  statCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 16, textAlign: 'center' },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statVal: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#888' },

  fullBalanceContainer: { marginBottom: 16 },
  fullBalanceBtn: { width: '100%', padding: '16px', background: '#f0c050', color: '#1a3d1a', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 900, cursor: 'pointer', letterSpacing: 0.5 },
  fullBalanceBtnDisabled: { width: '100%', padding: '16px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, cursor: 'not-allowed' },

  repaySection: { background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc', padding: 28, marginBottom: 16 },
  repaySectionTitle: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 6 },
  repaySectionSub: { fontSize: 13, color: '#888', marginBottom: 20 },
  quickAmounts: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
  quickAmt: { padding: '10px 18px', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: '#fff', fontSize: 13, fontFamily: 'inherit' },
  quickAmtSelected: { padding: '10px 18px', border: '1px solid #1f4d1f', borderRadius: 6, background: '#1f4d1f', color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' },
  repayForm: { display: 'flex', gap: 12 },
  repayInput: { flex: 1, padding: '13px 16px', border: '2px solid #1f4d1f', borderRadius: 8, fontSize: 15, outline: 'none', fontFamily: 'inherit' },
  repayBtn: { padding: '13px 24px', background: '#f0c050', color: '#1a3d1a', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', whiteSpace: 'nowrap' },
  repayBtnDisabled: { padding: '13px 24px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 8, cursor: 'not-allowed', fontSize: 14, fontFamily: 'inherit', whiteSpace: 'nowrap' },
  repayNote: { fontSize: 12, color: '#888', marginTop: 12, textAlign: 'center' },

  scheduleBtn: { padding: '11px 24px', background: '#fff', color: '#1f4d1f', border: '2px solid #1f4d1f', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

  // ✅ Verify payment styles
  verifyBanner: { background: '#f0fff4', border: '2px solid #1f4d1f', borderRadius: 10, padding: '16px 20px', marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  verifyBannerText: {},
  verifyBannerTitle: { fontSize: 15, fontWeight: 700, color: '#1f4d1f', marginBottom: 4 },
  verifyBannerSub: { fontSize: 13, color: '#555' },
  verifyBtn: { padding: '11px 24px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  verifyBtnDisabled: { padding: '11px 24px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'not-allowed', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  verifyManual: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16, padding: '12px', background: '#f7f5f0', borderRadius: 8 },
  verifyManualText: { fontSize: 13, color: '#888' },
  verifyManualBtn: { padding: '7px 16px', background: 'none', color: '#1f4d1f', border: '1px solid #1f4d1f', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

  noLoanBox: { background: '#fff', borderRadius: 12, border: '2px dashed #c5ddb8', padding: 60, textAlign: 'center' },
  noLoanIcon: { fontSize: 60, marginBottom: 16 },
  noLoanTitle: { fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 8 },
  noLoanText: { color: '#666', marginBottom: 24, fontSize: 14 },
  applyBtn: { background: '#1f4d1f', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontFamily: 'inherit' },

  historyCard: { background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc', padding: 24, marginTop: 24 },
  historyTitle: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 16 },
  historyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f0f0f0' },
  historyLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  historyDot: { width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  historyAmount: { fontSize: 15, fontWeight: 700, color: '#111' },
  historyMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  historyBadge: { fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 99, textTransform: 'capitalize' },

  // Modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modalContent: { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalHeader: { padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#111', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' },
  modalTabs: { display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderBottom: '1px solid #eee', flexShrink: 0 },
  modalTab: { padding: '7px 18px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, color: '#555', cursor: 'pointer', background: '#fff', fontFamily: 'inherit' },
  modalTabActive: { padding: '7px 18px', border: '1px solid #1f4d1f', borderRadius: 6, fontSize: 13, color: '#fff', cursor: 'pointer', background: '#1f4d1f', fontFamily: 'inherit' },
  modalTabInfo: { marginLeft: 'auto', fontSize: 13, color: '#1f4d1f', fontWeight: 700 },
  scheduleHeadRow: { display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px', padding: '10px 24px', background: '#f7f5f0', borderBottom: '1px solid #eee', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 },
  scheduleBody: { overflowY: 'auto', flex: 1 },
  scheduleRow: { display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px', padding: '11px 24px', borderBottom: '1px solid #f5f5f5', alignItems: 'center' },
  scheduleNum: { fontSize: 13, color: '#888' },
  scheduleDate: { fontSize: 13, color: '#333' },
  scheduleAmt: { fontSize: 13, fontWeight: 600, color: '#111' },
  paidBadge: { background: '#eafaf0', color: '#1a7a3a', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99 },
  overdueBadge: { background: '#fff0f0', color: '#cc0000', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99 },
  upcomingBadge: { background: '#f0f0f0', color: '#888', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99 },
  modalSummary: { display: 'flex', justifyContent: 'space-around', padding: '14px 24px', borderTop: '1px solid #eee', fontSize: 13, fontWeight: 600, flexShrink: 0 },
  modalFooter: { padding: '14px 24px', borderTop: '1px solid #eee', textAlign: 'right', flexShrink: 0 },
  closeModalBtn: { padding: '10px 24px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 },
};
