import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getInstallments, getLoanDetails } from '../../services/loanService';
import LoanHeaderActions from '../../components/common/LoanHeaderActions';

export default function LoanSchedulePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((acc, item) => acc + (item.quantity || 1), 0));

    Promise.all([getInstallments(id), getLoanDetails(id)])
      .then(([instRes, loanRes]) => {
        setInstallments(instRes.data?.schedule || []);
        setSummary(instRes.data?.summary || null);
        setBalances({
          loan_balance: instRes.data?.loan_balance,
          interest_balance: instRes.data?.interest_balance,
        });
        setLoan(loanRes.data);
      })
      .catch((err) => {
        setError(
          err.response?.data?.message || 'Failed to load the repayment schedule. Please try again.',
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

  const statusStyle = (status) =>
    ({
      paid:    { background: '#eafaf0', color: '#1a7a3a' },
      overdue: { background: '#fdecec', color: '#cc0000' },
      partial: { background: '#fff8e7', color: '#b36b00' },
      pending: { background: '#f0f0f0', color: '#666' },
    })[status] || { background: '#f0f0f0', color: '#666' };

  return (
    <div style={s.page}>
      <style>{`
        .ls-nav { background:#1f4d1f; padding:12px 40px; display:flex; justify-content:space-between; align-items:center; color:#fff; position:sticky; top:0; z-index:100; gap:16px; }
        .ls-nav-left { display:flex; align-items:center; gap:12px; cursor:pointer; flex-shrink:0; }
        .ls-nav-links { display:flex; gap:24px; align-items:center; flex-shrink:1; min-width:0; overflow:hidden; }
        .ls-nav-link { color:#e8e4dc; cursor:pointer; font-size:14px; white-space:nowrap; }
        .ls-nav-link:hover { color:#f0c050; }
        .ls-nav-right { display:flex; align-items:center; gap:16px; flex-shrink:0; }
        .ls-cart { position:relative; cursor:pointer; font-size:20px; }
        .ls-badge { position:absolute; top:-6px; right:-8px; background:#cc0000; color:#fff; font-size:10px; font-weight:700; padding:1px 5px; border-radius:99px; }
        .ls-hamburger { display:none; background:none; border:none; font-size:22px; color:#fff; cursor:pointer; padding:4px; }
        .ls-drawer-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:998; }
        .ls-drawer { position:fixed; top:0; right:0; bottom:0; width:75%; max-width:280px; background:#fff; z-index:999; display:flex; flex-direction:column; box-shadow:-4px 0 20px rgba(0,0,0,0.2); }
        .ls-drawer-header { background:#1f4d1f; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; color:#fff; font-weight:700; }
        .ls-drawer-close { background:none; border:none; color:#fff; font-size:20px; cursor:pointer; }
        .ls-drawer-link { padding:16px 20px; font-size:15px; color:#111; cursor:pointer; border-bottom:1px solid #f0f0f0; }

        @media (max-width: 768px) {
          .ls-nav { padding:12px 16px; }
          .ls-nav-links { display:none; }
          .ls-hamburger { display:block; }
        }
      `}</style>

      <nav className="ls-nav">
        <div className="ls-nav-left" onClick={() => navigate('/products')}>
          <img src="/android-chrome-192x192.png" alt="Logo" style={s.logoImg} />
          <div style={s.logoText}>
            ACHOICE <span style={{ color: '#f0c050' }}>LOANS</span>
          </div>
        </div>
        <div className="ls-nav-links">
          <span className="ls-nav-link" onClick={() => navigate('/')}>Home</span>
          <span className="ls-nav-link" onClick={() => navigate('/loans/apply')}>Apply for Loan</span>
          <span className="ls-nav-link" onClick={() => navigate('/orders')}>My Orders</span>
        </div>
        <div className="ls-nav-right">
          <LoanHeaderActions cartCount={cartCount} />
          <button className="ls-hamburger" onClick={() => setMenuOpen(true)} aria-label="Menu">☰</button>
        </div>
      </nav>

      {menuOpen && (
        <div className="ls-drawer-overlay" onClick={() => setMenuOpen(false)}>
          <div className="ls-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ls-drawer-header">
              <span>Menu</span>
              <button className="ls-drawer-close" onClick={() => setMenuOpen(false)}>✕</button>
            </div>
            <div className="ls-drawer-link" onClick={() => { setMenuOpen(false); navigate('/'); }}>Home</div>
            <div className="ls-drawer-link" onClick={() => { setMenuOpen(false); navigate('/loans/apply'); }}>Apply for Loan</div>
            <div className="ls-drawer-link" onClick={() => { setMenuOpen(false); navigate('/orders'); }}>My Orders</div>
          </div>
        </div>
      )}

      <div style={s.container}>
        <div style={s.backRow} onClick={() => navigate(`/loans/${id}`)}>
          ← Back
        </div>

        {loading && <div style={s.loadingText}>Loading repayment schedule...</div>}

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
            <h1 style={s.title}>Repayment schedule</h1>
            {loan && <div style={s.subtitle}>{loan.label} · {fmt(loan.amount)}</div>}

            {summary && (
              <div style={s.summaryRow}>
                <div style={s.summaryItem}>
                  <div style={s.summaryValue}>{summary.total}</div>
                  <div style={s.summaryLabel}>Total</div>
                </div>
                <div style={s.summaryItem}>
                  <div style={{ ...s.summaryValue, color: '#1a7a3a' }}>{summary.paid}</div>
                  <div style={s.summaryLabel}>Paid</div>
                </div>
                <div style={s.summaryItem}>
                  <div style={{ ...s.summaryValue, color: summary.overdue > 0 ? '#cc0000' : '#111' }}>
                    {summary.overdue}
                  </div>
                  <div style={s.summaryLabel}>Overdue</div>
                </div>
                <div style={s.summaryItem}>
                  <div style={s.summaryValue}>{summary.remaining}</div>
                  <div style={s.summaryLabel}>Remaining</div>
                </div>
              </div>
            )}

            {(balances.loan_balance != null || balances.interest_balance != null) && (
              <div style={s.balanceRow}>
                {balances.loan_balance != null && (
                  <div style={s.balanceCard}>
                    <div style={s.balanceLabel}>Loan Balance</div>
                    <div style={s.balanceValue}>{fmt(balances.loan_balance)}</div>
                  </div>
                )}
                {balances.interest_balance != null && (
                  <div style={s.balanceCard}>
                    <div style={s.balanceLabel}>Interest Balance</div>
                    <div style={s.balanceValue}>{fmt(balances.interest_balance)}</div>
                  </div>
                )}
              </div>
            )}

            {installments.length === 0 ? (
              <div style={s.emptyBox}>
                <div style={s.emptyIcon}>📋</div>
                <h2 style={s.emptyTitle}>No schedule yet</h2>
                <p style={s.emptyText}>
                  Your repayment schedule appears here once the loan has been disbursed.
                </p>
              </div>
            ) : (
              <div style={s.scheduleScroll}>
                <div style={s.scheduleCard}>
                  <div style={s.scheduleHeadRow}>
                    <span>#</span>
                    <span>Due Date</span>
                    <span>Principal</span>
                    <span>Interest</span>
                    <span>Total Due</span>
                    <span>Paid</span>
                    <span>Status</span>
                  </div>
                  {installments.map((inst) => (
                    <div key={inst.installment_number} style={s.scheduleRow}>
                      <span style={s.scheduleNum}>{inst.installment_number}</span>
                      <span style={s.scheduleDate}>{fmtDate(inst.due_date)}</span>
                      <span style={s.scheduleDate}>{fmt(inst.principal_payment)}</span>
                      <span style={s.scheduleDate}>{fmt(inst.interest_payment)}</span>
                      <span style={s.scheduleAmt}>
                        {fmt(inst.total_payable)}
                        {Number(inst.penalty_applied) > 0 && (
                          <span style={s.penaltyNote}>
                            +{fmt(inst.penalty_applied)} penalty
                          </span>
                        )}
                      </span>
                      <span style={s.scheduleDate}>{fmt(inst.amount_paid)}</span>
                      <span>
                        <span style={{ ...s.statusBadge, ...statusStyle(inst.status) }}>
                          {inst.status}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
  container: { maxWidth: 820, margin: '0 auto', padding: '24px 20px 60px' },
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
  title: { fontSize: 26, fontWeight: 800, color: '#111' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 10,
    marginBottom: 24,
  },
  summaryItem: {
    background: '#fff',
    borderRadius: 12,
    padding: '14px 8px',
    textAlign: 'center',
  },
  summaryValue: { fontSize: 20, fontWeight: 800, color: '#111' },
  summaryLabel: { fontSize: 11, color: '#888', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 10,
    marginBottom: 24,
  },
  balanceCard: {
    background: '#1f4d1f',
    borderRadius: 12,
    padding: '14px 18px',
  },
  balanceValue: { fontSize: 19, fontWeight: 800, color: '#fff', marginTop: 4 },
  balanceLabel: { fontSize: 11, color: '#a8d5a8', textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyBox: {
    background: '#fff',
    borderRadius: 16,
    padding: '60px 24px',
    textAlign: 'center',
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' },
  scheduleScroll: { overflowX: 'auto' },
  scheduleCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '8px 20px',
    minWidth: 640,
  },
  scheduleHeadRow: {
    display: 'grid',
    gridTemplateColumns: '0.4fr 1fr 1fr 1fr 1.1fr 1fr 1fr',
    gap: 8,
    padding: '12px 0',
    borderBottom: '2px solid #f0f0f0',
    fontSize: 11,
    fontWeight: 700,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scheduleRow: {
    display: 'grid',
    gridTemplateColumns: '0.4fr 1fr 1fr 1fr 1.1fr 1fr 1fr',
    gap: 8,
    padding: '14px 0',
    borderBottom: '1px solid #f5f5f5',
    fontSize: 13,
    alignItems: 'center',
  },
  scheduleNum: { color: '#888', fontWeight: 600 },
  scheduleDate: { color: '#333' },
  scheduleAmt: { color: '#111', fontWeight: 700 },
  penaltyNote: { display: 'block', color: '#cc0000', fontSize: 11, fontWeight: 600, marginTop: 2 },
  statusBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 99,
    textTransform: 'capitalize',
  },
};
