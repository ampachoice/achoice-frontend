import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLoanDetails } from '../../services/loanService';
import LoanHeaderActions from '../../components/common/LoanHeaderActions';

export default function LoanDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';

  const fmtShortDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : '—';

  // Progress ring math
  const paid = loan?.payments?.paid ?? 0;
  const total = loan?.payments?.total ?? 0;
  const remaining = loan?.payments?.remaining ?? Math.max(total - paid, 0);
  const progressFraction = total > 0 ? paid / total : 0;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progressFraction);

  return (
    <div style={s.page}>
      <style>{`
        .ld-nav { background:#1f4d1f; padding:12px 40px; display:flex; justify-content:space-between; align-items:center; color:#fff; position:sticky; top:0; z-index:100; gap:16px; }
        .ld-nav-left { display:flex; align-items:center; gap:12px; cursor:pointer; flex-shrink:0; }
        .ld-nav-links { display:flex; gap:24px; align-items:center; flex-shrink:1; min-width:0; overflow:hidden; }
        .ld-nav-link { color:#e8e4dc; cursor:pointer; font-size:14px; white-space:nowrap; }
        .ld-nav-link:hover { color:#f0c050; }
        .ld-nav-right { display:flex; align-items:center; gap:16px; flex-shrink:0; }
        .ld-cart { position:relative; cursor:pointer; font-size:20px; }
        .ld-badge { position:absolute; top:-6px; right:-8px; background:#cc0000; color:#fff; font-size:10px; font-weight:700; padding:1px 5px; border-radius:99px; }
        .ld-hamburger { display:none; background:none; border:none; font-size:22px; color:#fff; cursor:pointer; padding:4px; }
        .ld-drawer-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:998; }
        .ld-drawer { position:fixed; top:0; right:0; bottom:0; width:75%; max-width:280px; background:#fff; z-index:999; display:flex; flex-direction:column; box-shadow:-4px 0 20px rgba(0,0,0,0.2); }
        .ld-drawer-header { background:#1f4d1f; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; color:#fff; font-weight:700; }
        .ld-drawer-close { background:none; border:none; color:#fff; font-size:20px; cursor:pointer; }
        .ld-drawer-link { padding:16px 20px; font-size:15px; color:#111; cursor:pointer; border-bottom:1px solid #f0f0f0; }

        @media (max-width: 768px) {
          .ld-nav { padding:12px 16px; }
          .ld-nav-links { display:none; }
          .ld-hamburger { display:block; }
        }
      `}</style>

      {/* Navbar */}
      <nav className="ld-nav">
        <div className="ld-nav-left" onClick={() => navigate('/products')}>
          <img src="/android-chrome-192x192.png" alt="Logo" style={s.logoImg} />
          <div style={s.logoText}>
            ACHOICE <span style={{ color: '#f0c050' }}>LOANS</span>
          </div>
        </div>
        <div className="ld-nav-links">
          <span className="ld-nav-link" onClick={() => navigate('/')}>Home</span>
          <span className="ld-nav-link" onClick={() => navigate('/loans/apply')}>Apply for Loan</span>
          <span className="ld-nav-link" onClick={() => navigate('/orders')}>My Orders</span>
        </div>
        <div className="ld-nav-right">
          <LoanHeaderActions cartCount={cartCount} />
          <button className="ld-hamburger" onClick={() => setMenuOpen(true)} aria-label="Menu">☰</button>
        </div>
      </nav>

      {menuOpen && (
        <div className="ld-drawer-overlay" onClick={() => setMenuOpen(false)}>
          <div className="ld-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ld-drawer-header">
              <span>Menu</span>
              <button className="ld-drawer-close" onClick={() => setMenuOpen(false)}>✕</button>
            </div>
            <div className="ld-drawer-link" onClick={() => { setMenuOpen(false); navigate('/'); }}>Home</div>
            <div className="ld-drawer-link" onClick={() => { setMenuOpen(false); navigate('/loans/apply'); }}>Apply for Loan</div>
            <div className="ld-drawer-link" onClick={() => { setMenuOpen(false); navigate('/orders'); }}>My Orders</div>
          </div>
        </div>
      )}

      <div style={s.container}>
        <div style={s.backRow} onClick={() => navigate('/loans')}>
          ← Back to Loans
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
            {/* Header: amount + label */}
            <div style={s.headerRow}>
              <div>
                <div style={s.headerAmount}>{fmt(loan.amount).replace('.00', '')}</div>
                <div style={s.headerLabel}>{loan.label}</div>
              </div>
              <div style={s.headerIcon}>🌾</div>
            </div>

            {/* Status banner — shown for every stage that isn't yet disbursed,
                so a pending/approved/rejected loan never just looks "empty" */}
            {!loan.is_disbursed && (
              <div
                style={{
                  ...s.statusBanner,
                  ...(loan.status === 'rejected' ? s.statusBannerRejected : s.statusBannerPending),
                }}
              >
                <div style={s.statusBannerLabel}>{loan.status_label}</div>
                {loan.status === 'pending' && (
                  <div style={s.statusBannerText}>
                    Your application is being reviewed. You'll be notified once a decision is made.
                  </div>
                )}
                {loan.status === 'approved' && (
                  <div style={s.statusBannerText}>
                    Your loan has been approved and will be disbursed shortly.
                  </div>
                )}
                {loan.status === 'rejected' && (
                  <div style={s.statusBannerText}>
                    {loan.rejection_reason || 'This application was not approved.'}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons — repaying/liquidating only makes sense once
                money has actually moved */}
            {loan.is_disbursed && (
              <div style={s.actionRow}>
                <button
                  style={s.liquidateBtn}
                  onClick={() => navigate(`/loans/${id}/liquidate`)}
                >
                  ⚡ Liquidate
                </button>
                <button
                  style={s.scheduleBtn}
                  onClick={() => navigate(`/loans/${id}/schedule`)}
                >
                  📋 Schedule
                </button>
              </div>
            )}

            {/* Next payment + progress ring — only relevant once disbursed */}
            {loan.is_disbursed && (
            <div style={s.progressCard}>
              <div style={s.nextPaymentAmount}>
                {loan.next_payment ? fmt(loan.next_payment.amount) : '—'}
              </div>
              <div style={s.nextPaymentLabel}>
                {loan.next_payment
                  ? `Next payment on ${fmtShortDate(loan.next_payment.due_date)}`
                  : 'No upcoming payment'}
              </div>

              <div style={s.ringWrap}>
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke="#e8e4dc"
                    strokeWidth="14"
                  />
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke="#1f4d1f"
                    strokeWidth="14"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 90 90)"
                  />
                </svg>
                <div style={s.ringCenter}>
                  <div style={s.ringFraction}>
                    {paid}/{total}
                  </div>
                  <div style={s.ringSub}>
                    {remaining > 0 ? 'Payments left' : 'All paid up'}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Details */}
            <div style={s.detailsCard}>
              <div style={s.detailsTitle}>Details</div>
              {[
                ['Loan balance', fmt(loan.balance)],
                ['Interest rate', `${loan.interest_rate}%`],
                ['Loan interest', fmt(loan.total_interest)],
                ['Total repayable', fmt(loan.total_repayable)],
                ['Loan opening date', fmtDate(loan.opening_date)],
                ['Loan maturity date', fmtDate(loan.maturity_date)],
              ].map(([label, value]) => (
                <div key={label} style={s.detailRow}>
                  <span style={s.detailLabel}>{label}</span>
                  <span style={s.detailValue}>{value}</span>
                </div>
              ))}
            </div>

            {/* Payment history preview */}
            <div style={s.historyCard}>
              <div style={s.historyHeader}>
                <div style={s.detailsTitle}>Payment history</div>
                <span
                  style={s.seeMore}
                  onClick={() => navigate(`/loans/${id}/schedule`)}
                >
                  See more →
                </span>
              </div>

              {(!loan.payment_history || loan.payment_history.length === 0) ? (
                <div style={s.noHistory}>No payments made yet.</div>
              ) : (
                loan.payment_history.map((p) => (
                  <div key={p.id} style={s.historyRow}>
                    <div>
                      <div style={s.historyAmount}>{fmt(p.amount)}</div>
                      <div style={s.historySub}>Installment #{p.instalment_number}</div>
                    </div>
                    <div style={s.historyDate}>{fmtDate(p.paid_at)}</div>
                  </div>
                ))
              )}
            </div>
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
    marginBottom: 20,
  },
  loadingText: { textAlign: 'center', padding: 60, color: '#888', fontSize: 14 },
  errorBox: {
    background: '#fdecec',
    border: '1px solid #f5b5b5',
    color: '#cc0000',
    padding: '14px 18px',
    borderRadius: 10,
    fontSize: 14,
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerAmount: { fontSize: 34, fontWeight: 800, color: '#111' },
  headerLabel: { fontSize: 14, color: '#888', marginTop: 4 },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#f0f7ec',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
  },
  statusBanner: {
    borderRadius: 14,
    padding: '18px 20px',
    marginBottom: 20,
  },
  statusBannerPending: {
    background: '#fff8e7',
    border: '1px solid #f0d99a',
  },
  statusBannerRejected: {
    background: '#fdecec',
    border: '1px solid #f5b5b5',
  },
  statusBannerLabel: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 },
  statusBannerText: { fontSize: 13, color: '#666', lineHeight: 1.5 },
  actionRow: { display: 'flex', gap: 12, marginBottom: 24 },
  liquidateBtn: {
    flex: 1,
    padding: '13px 20px',
    background: '#1f4d1f',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  scheduleBtn: {
    flex: 1,
    padding: '13px 20px',
    background: '#fff',
    color: '#1f4d1f',
    border: '1px solid #1f4d1f',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  progressCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '28px 20px',
    textAlign: 'center',
    marginBottom: 20,
  },
  nextPaymentAmount: { fontSize: 28, fontWeight: 800, color: '#111' },
  nextPaymentLabel: { fontSize: 13, color: '#888', marginBottom: 20 },
  ringWrap: { position: 'relative', display: 'inline-block' },
  ringCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
  },
  ringFraction: { fontSize: 22, fontWeight: 800, color: '#111' },
  ringSub: { fontSize: 11, color: '#888', marginTop: 2 },
  detailsCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '20px',
    marginBottom: 20,
  },
  detailsTitle: { fontSize: 16, fontWeight: 700, color: '#111' },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: 14,
  },
  detailLabel: { color: '#888' },
  detailValue: { color: '#111', fontWeight: 600 },
  historyCard: { background: '#fff', borderRadius: 16, padding: '20px' },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeMore: { fontSize: 13, color: '#1f4d1f', fontWeight: 600, cursor: 'pointer' },
  noHistory: { fontSize: 13, color: '#888', padding: '12px 0' },
  historyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  historyAmount: { fontSize: 14, fontWeight: 700, color: '#111' },
  historySub: { fontSize: 12, color: '#888', marginTop: 2 },
  historyDate: { fontSize: 13, color: '#888' },
};
