import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLoanDetails, liquidateLoan } from '../../services/loanService';
import LoanHeaderActions from '../../components/common/LoanHeaderActions';

export default function LoanLiquidatePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const [type, setType] = useState('full'); // 'full' | 'partial'
  const [partialAmount, setPartialAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((acc, item) => acc + (item.quantity || 1), 0));

    getLoanDetails(id)
      .then((res) => setLoan(res.data))
      .catch((err) => {
        setError(
          err.response?.data?.message || 'Failed to load this loan. Please try again.',
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const fmt = (n) =>
    `₦${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const balance = Number(loan?.balance || 0);
  const amountToPay =
    type === 'full' ? balance : Number(partialAmount || 0);

  const canSubmit =
    !submitting &&
    (type === 'full' ||
      (type === 'partial' && amountToPay > 0 && amountToPay <= balance));

  const handleRepay = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload =
        type === 'full' ? { type: 'full' } : { type: 'partial', amount: amountToPay };

      const res = await liquidateLoan(id, payload);

      // Store the reference so LoanDetailPage/LoansListPage can auto-verify
      // when Paystack redirects back, same pattern as the direct-repay flow.
      if (res.data.reference_number) {
        localStorage.setItem('last_loan_reference', res.data.reference_number);
      }

      if (res.data.payment_url) {
        window.location.href = res.data.payment_url;
      } else {
        setSubmitError('Payment could not be started. Please try again.');
        setSubmitting(false);
      }
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || 'Failed to start payment. Please try again.',
      );
      setSubmitting(false);
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        .lq-nav { background:#1f4d1f; padding:12px 40px; display:flex; justify-content:space-between; align-items:center; color:#fff; position:sticky; top:0; z-index:100; }
        .lq-nav-left { display:flex; align-items:center; gap:12px; cursor:pointer; flex-shrink:0; }
        .lq-nav-links { display:flex; gap:24px; align-items:center; }
        .lq-nav-link { color:#e8e4dc; cursor:pointer; font-size:14px; white-space:nowrap; }
        .lq-nav-link:hover { color:#f0c050; }
        .lq-nav-right { display:flex; align-items:center; gap:16px; flex-shrink:0; }
        .lq-cart { position:relative; cursor:pointer; font-size:20px; }
        .lq-badge { position:absolute; top:-6px; right:-8px; background:#cc0000; color:#fff; font-size:10px; font-weight:700; padding:1px 5px; border-radius:99px; }

        @media (max-width: 768px) {
          .lq-nav { padding:12px 16px; }
          .lq-nav-links { display:none; }
        }
      `}</style>

      <nav className="lq-nav">
        <div className="lq-nav-left" onClick={() => navigate('/products')}>
          <img src="/android-chrome-192x192.png" alt="Logo" style={s.logoImg} />
          <div style={s.logoText}>
            ACHOICE <span style={{ color: '#f0c050' }}>LOANS</span>
          </div>
        </div>
        <div className="lq-nav-links">
          <span className="lq-nav-link" onClick={() => navigate('/')}>Home</span>
          <span className="lq-nav-link" onClick={() => navigate('/loans/apply')}>Apply for Loan</span>
          <span className="lq-nav-link" onClick={() => navigate('/orders')}>My Orders</span>
        </div>
        <div className="lq-nav-right">
          <LoanHeaderActions cartCount={cartCount} />
        </div>
      </nav>

      <div style={s.container}>
        <div style={s.backRow} onClick={() => navigate(`/loans/${id}`)}>
          ← Back
        </div>

        {loading && <div style={s.loadingText}>Loading loan details...</div>}

        {error && (
          <div style={s.errorBox}>
            ⚠️ {error}
            <button style={s.retryBtn} onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && loan && (
          <>
            <h1 style={s.title}>Liquidate loan</h1>

            {/* Fully / Partially toggle */}
            <div style={s.toggleRow}>
              <button
                style={type === 'full' ? s.toggleBtnActive : s.toggleBtn}
                onClick={() => setType('full')}
              >
                Fully
              </button>
              <button
                style={type === 'partial' ? s.toggleBtnActive : s.toggleBtn}
                onClick={() => setType('partial')}
              >
                Partially
              </button>
            </div>

            {/* Partial amount input */}
            {type === 'partial' && (
              <div style={s.partialField}>
                <label style={s.partialLabel}>Amount to pay (₦)</label>
                <input
                  type="number"
                  style={s.partialInput}
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder={`Max ${fmt(balance)}`}
                  max={balance}
                  min={1}
                />
                {amountToPay > balance && (
                  <div style={s.partialWarning}>
                    Amount can't exceed your loan balance of {fmt(balance)}
                  </div>
                )}
              </div>
            )}

            {/* Payment method — honest framing: this redirects to Paystack, */}
            {/* there's no real "source account" selector like a bank app has */}
            <div style={s.sectionLabel}>Payment Method</div>
            <div style={s.sourceCard}>
              <div style={s.sourceLeft}>
                <div style={s.sourceIcon}>₦</div>
                <div>
                  <div style={s.sourceAccount}>Pay via Paystack</div>
                  <div style={s.sourceSub}>Card, bank transfer or USSD</div>
                </div>
              </div>
              <div style={s.sourceAmount}>- {fmt(amountToPay)}</div>
            </div>

            {/* Details */}
            <div style={s.sectionLabel}>Details</div>
            <div style={s.detailsCard}>
              {[
                ['Loan type', loan.label],
                ['Loan balance', fmt(loan.balance)],
                ['Loan amount', fmt(loan.amount)],
              ].map(([label, value]) => (
                <div key={label} style={s.detailRow}>
                  <span style={s.detailLabel}>{label}</span>
                  <span style={s.detailValue}>{value}</span>
                </div>
              ))}
            </div>

            {submitError && <div style={s.errorBox}>⚠️ {submitError}</div>}

            <button
              style={canSubmit ? s.repayBtn : s.repayBtnDisabled}
              onClick={handleRepay}
              disabled={!canSubmit}
            >
              {submitting ? '⏳ Starting payment...' : `Repay ${fmt(amountToPay)}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f7f5f0', fontFamily: 'Arial, sans-serif' },
  logoImg: { width: 32, height: 32, borderRadius: 6 },
  logoText: { fontWeight: 700, fontSize: 15 },
  container: { maxWidth: 560, margin: '0 auto', padding: '24px 20px 60px' },
  backRow: {
    color: '#1f4d1f',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    marginBottom: 16,
  },
  loadingText: { textAlign: 'center', padding: 60, color: '#888', fontSize: 14 },
  errorBox: {
    background: '#fdecec',
    border: '1px solid #f5b5b5',
    color: '#cc0000',
    padding: '14px 18px',
    borderRadius: 10,
    fontSize: 14,
    marginBottom: 16,
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
  title: { fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 20 },
  toggleRow: {
    display: 'flex',
    background: '#fff',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    padding: '11px 0',
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    color: '#888',
    cursor: 'pointer',
  },
  toggleBtnActive: {
    flex: 1,
    padding: '11px 0',
    background: '#1f4d1f',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    cursor: 'pointer',
  },
  partialField: { marginBottom: 24 },
  partialLabel: { fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 },
  partialInput: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 15,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  partialWarning: { fontSize: 12, color: '#cc0000', marginTop: 6 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sourceCard: {
    background: '#fff',
    borderRadius: 14,
    padding: '16px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sourceLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  sourceIcon: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: '#f0f7ec',
    color: '#1f4d1f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 16,
  },
  sourceAccount: { fontSize: 14, fontWeight: 700, color: '#111' },
  sourceSub: { fontSize: 12, color: '#888', marginTop: 2 },
  sourceAmount: { fontSize: 15, fontWeight: 700, color: '#cc0000' },
  detailsCard: {
    background: '#fff',
    borderRadius: 14,
    padding: '4px 18px',
    marginBottom: 24,
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: 14,
  },
  detailLabel: { color: '#888' },
  detailValue: { color: '#111', fontWeight: 600 },
  repayBtn: {
    width: '100%',
    padding: '15px 0',
    background: '#1f4d1f',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  repayBtnDisabled: {
    width: '100%',
    padding: '15px 0',
    background: '#ccc',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'not-allowed',
  },
};
