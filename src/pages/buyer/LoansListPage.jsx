import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getLoanSummary, verifyLoanPayment, payAllDue, liquidateAllLoans } from '../../services/loanService';
import BuyerDropdown from '../../components/buyer/BuyerDropdown';
import NotificationBell from '../../components/buyer/NotificationBell';

export default function LoansListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [payingAll, setPayingAll] = useState(false);
  const [liquidatingAll, setLiquidatingAll] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchSummary = () => {
    getLoanSummary()
      .then((res) => setSummary(res.data))
      .catch((err) => {
        setError(
          err.response?.data?.message || 'Failed to load your loans. Please try again.',
        );
      })
      .finally(() => setLoading(false));
  };

  const handlePayAll = async () => {
    setPayingAll(true);
    try {
      const res = await payAllDue();
      if (res.data?.reference_number) {
        // Same auto-verify-on-return pattern used everywhere else in this
        // app — a fallback in case the URL's query string doesn't survive
        // whatever redirect chain Paystack sends the buyer through.
        localStorage.setItem('last_loan_reference', res.data.reference_number);
      }
      if (res.data?.payment_url) {
        window.location.href = res.data.payment_url;
      } else {
        showToast('Payment could not be started. Please try again.', 'error');
        setPayingAll(false);
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Failed to start payment. Please try again.',
        'error',
      );
      setPayingAll(false);
    }
  };

  const handleLiquidateAll = async () => {
    const totalBalance = loans.reduce((sum, l) => sum + Number(l.balance || 0), 0);
    const confirmed = window.confirm(
      `This will pay off the FULL remaining balance on every active loan — a total of ` +
      `₦${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Continue?`,
    );
    if (!confirmed) return;

    setLiquidatingAll(true);
    try {
      const res = await liquidateAllLoans();
      if (res.data?.reference_number) {
        localStorage.setItem('last_loan_reference', res.data.reference_number);
      }
      if (res.data?.payment_url) {
        window.location.href = res.data.payment_url;
      } else {
        showToast('Payment could not be started. Please try again.', 'error');
        setLiquidatingAll(false);
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Failed to start payment. Please try again.',
        'error',
      );
      setLiquidatingAll(false);
    }
  };

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((acc, item) => acc + (item.quantity || 1), 0));

    // Confirm a payment when returning from Paystack. Check the URL first
    // (the normal path), then fall back to whatever reference was last
    // saved to localStorage before redirecting — a second safety net in
    // case the URL's query string got lost anywhere along the way.
    const params = new URLSearchParams(location.search);
    const urlRef = params.get('reference') || params.get('trxref');
    const savedRef = localStorage.getItem('last_loan_reference');
    const reference = urlRef || savedRef;

    if (reference) {
      setVerifying(true);
      verifyLoanPayment(reference)
        .then(() => {
          showToast('Payment confirmed! Your loan balance has been updated.');
        })
        .catch((err) => {
          showToast(
            err.response?.data?.message ||
              'Payment received but not yet confirmed. It may take a moment to reflect — refresh shortly.',
            'error',
          );
        })
        .finally(() => {
          localStorage.removeItem('last_loan_reference');
          // Strip the reference out of the URL so refreshing the page
          // doesn't try to re-verify an already-processed payment.
          navigate('/loans', { replace: true });
          setVerifying(false);
          fetchSummary();
        });
    } else {
      fetchSummary();
    }
  }, []);

  const loans = summary?.loans || [];

  const statusStyle = (status) =>
    ({
      pending:   { background: '#fff8e7', color: '#b36b00' },
      approved:  { background: '#e7f0ff', color: '#1a4fa0' },
      disbursed: { background: '#eafaf0', color: '#1a7a3a' },
      active:    { background: '#eafaf0', color: '#1a7a3a' },
    })[status] || { background: '#f0f0f0', color: '#555' };

  return (
    <div style={s.page}>
      <style>{`
        .ll-nav { background:#1f4d1f; padding:12px 40px; display:flex; justify-content:space-between; align-items:center; color:#fff; position:sticky; top:0; z-index:100; }
        .ll-nav-left { display:flex; align-items:center; gap:12px; cursor:pointer; flex-shrink:0; }
        .ll-nav-links { display:flex; gap:24px; align-items:center; }
        .ll-nav-link { color:#e8e4dc; cursor:pointer; font-size:14px; white-space:nowrap; }
        .ll-nav-link:hover { color:#f0c050; }
        .ll-nav-right { display:flex; align-items:center; gap:16px; flex-shrink:0; }
        .ll-cart { position:relative; cursor:pointer; font-size:20px; }
        .ll-badge { position:absolute; top:-6px; right:-8px; background:#cc0000; color:#fff; font-size:10px; font-weight:700; padding:1px 5px; border-radius:99px; }

        @media (max-width: 768px) {
          .ll-nav { padding:12px 16px; }
          .ll-nav-links { display:none; }
        }
      `}</style>

      {/* Navbar */}
      <nav className="ll-nav">
        <div className="ll-nav-left" onClick={() => navigate('/products')}>
          <img src="/android-chrome-192x192.png" alt="Logo" style={s.logoImg} />
          <div style={s.logoText}>
            ACHOICE <span style={{ color: '#f0c050' }}>LOANS</span>
          </div>
        </div>
        <div className="ll-nav-links">
          <span className="ll-nav-link" onClick={() => navigate('/')}>Home</span>
          <span className="ll-nav-link" onClick={() => navigate('/loans/apply')}>Apply for Loan</span>
          <span className="ll-nav-link" onClick={() => navigate('/orders')}>My Orders</span>
        </div>
        <div className="ll-nav-right">
          <div className="ll-cart" onClick={() => navigate('/cart')}>
            🛒 {cartCount > 0 && <span className="ll-badge">{cartCount}</span>}
          </div>
          <NotificationBell />
          <BuyerDropdown cartCount={cartCount} />
        </div>
      </nav>

      <div style={s.container}>
        {verifying && (
          <div style={s.verifyingBanner}>⏳ Confirming your payment...</div>
        )}

        <div style={s.headerRow}>
          <h1 style={s.title}>Loans</h1>
          <div style={s.headerActions}>
            {loans.length > 0 && (
              <button
                style={liquidatingAll ? s.liquidateAllBtnDisabled : s.liquidateAllBtn}
                onClick={handleLiquidateAll}
                disabled={liquidatingAll}
              >
                {liquidatingAll ? '⏳ Starting...' : '⚡ Liquidate All Loans'}
              </button>
            )}
            <span style={s.openNew} onClick={() => navigate('/loans/apply')}>
              Open new
            </span>
          </div>
        </div>

        {loading && <div style={s.loadingText}>Loading your loans...</div>}

        {error && (
          <div style={s.errorBox}>
            ⚠️ {error}
            <button style={s.retryBtn} onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Total due this month — the big headline figure */}
            <div style={s.totalCard}>
              <div style={s.totalLabel}>Left to repay this month</div>
              <div style={s.totalCardRow}>
                <div style={s.totalAmount}>
                  ₦
                  {Number(summary?.total_due_this_month || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                {Number(summary?.total_due_this_month || 0) > 0 && (
                  <button
                    style={payingAll ? s.payAllBtnDisabled : s.payAllBtn}
                    onClick={handlePayAll}
                    disabled={payingAll}
                  >
                    {payingAll ? '⏳ Starting...' : 'Pay All'}
                  </button>
                )}
              </div>
            </div>

            {/* Loan cards */}
            {loans.length === 0 ? (
              <div style={s.emptyBox}>
                <div style={s.emptyIcon}>💳</div>
                <h2 style={s.emptyTitle}>You have no active loans</h2>
                <p style={s.emptyText}>
                  Apply for a quick, affordable loan to grow your farm or business.
                </p>
                <button style={s.applyBtn} onClick={() => navigate('/loans/apply')}>
                  Apply for a Loan
                </button>
              </div>
            ) : (
              <div style={s.loanList}>
                {loans.map((loan) => (
                  <div
                    key={loan.id}
                    style={s.loanCard}
                    onClick={() => navigate(`/loans/${loan.id}`)}
                  >
                    <div style={s.loanCardLeft}>
                      <div style={s.loanIcon}>🌾</div>
                      <div>
                        <div style={s.loanLabel}>{loan.label}</div>
                        <div style={s.loanSub}>
                          {loan.is_disbursed ? 'Loan balance' : loan.status_label}
                        </div>
                      </div>
                    </div>
                    <div style={s.loanCardRight}>
                      <div style={s.loanAmount}>
                        ₦{Number(loan.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      {loan.is_disbursed ? (
                        <div style={s.loanBalance}>
                          ₦{Number(loan.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      ) : (
                        <div style={{ ...s.statusBadge, ...statusStyle(loan.status) }}>
                          {loan.status_label}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {toast && (
        <div
          style={{
            ...s.toast,
            ...(toast.type === 'error' ? s.toastError : {}),
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f7f5f0', fontFamily: 'Arial, sans-serif' },
  logoImg: { width: 32, height: 32, borderRadius: 6 },
  logoText: { fontWeight: 700, fontSize: 15 },
  container: { maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' },
  verifyingBanner: {
    background: '#e7f0ff',
    border: '1px solid #b8d0f0',
    color: '#1a4fa0',
    padding: '12px 18px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 20,
    textAlign: 'center',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 99,
    display: 'inline-block',
    marginTop: 2,
  },
  toast: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1f4d1f',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    zIndex: 9999,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    maxWidth: '90vw',
    textAlign: 'center',
  },
  toastError: { background: '#cc0000' },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 14,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    flexWrap: 'wrap',
  },
  title: { fontSize: 28, fontWeight: 800, color: '#111' },
  liquidateAllBtn: {
    padding: '10px 18px',
    background: '#fff',
    color: '#1f4d1f',
    border: '1.5px solid #1f4d1f',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s ease, color 0.15s ease',
  },
  liquidateAllBtnDisabled: {
    padding: '10px 18px',
    background: '#f0f0f0',
    color: '#aaa',
    border: '1.5px solid #ddd',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'not-allowed',
    whiteSpace: 'nowrap',
  },
  openNew: {
    color: '#1f4d1f',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },
  loadingText: { textAlign: 'center', padding: 60, color: '#888', fontSize: 14 },
  errorBox: {
    background: '#fdecec',
    border: '1px solid #f5b5b5',
    color: '#cc0000',
    padding: '14px 18px',
    borderRadius: 10,
    fontSize: 14,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  retryBtn: {
    padding: '6px 14px',
    background: '#cc0000',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  totalCard: {
    background: '#1a1a1a',
    borderRadius: 16,
    padding: '28px 24px',
    marginBottom: 24,
  },
  totalLabel: { color: '#aaa', fontSize: 13, marginBottom: 8 },
  totalCardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 12,
  },
  totalAmount: { color: '#fff', fontSize: 36, fontWeight: 800 },
  payAllBtn: {
    padding: '11px 22px',
    background: '#1f4d1f',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  payAllBtnDisabled: {
    padding: '11px 22px',
    background: '#555',
    color: '#ccc',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'not-allowed',
    whiteSpace: 'nowrap',
  },
  loanList: { display: 'flex', flexDirection: 'column', gap: 12 },
  loanCard: {
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: 14,
    padding: '18px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s ease',
  },
  loanCardLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  loanIcon: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: '#f0f7ec',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    flexShrink: 0,
  },
  loanLabel: { fontSize: 15, fontWeight: 700, color: '#111' },
  loanSub: { fontSize: 12, color: '#888', marginTop: 2 },
  loanCardRight: { textAlign: 'right' },
  loanAmount: { fontSize: 15, fontWeight: 700, color: '#111' },
  loanBalance: { fontSize: 12, color: '#888', marginTop: 2 },
  emptyBox: {
    background: '#fff',
    borderRadius: 16,
    padding: '60px 24px',
    textAlign: 'center',
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', marginBottom: 20, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' },
  applyBtn: {
    padding: '13px 28px',
    background: '#1f4d1f',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
