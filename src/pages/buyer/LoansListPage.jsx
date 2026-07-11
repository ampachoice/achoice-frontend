import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLoanSummary } from '../../services/loanService';
import BuyerDropdown from '../../components/buyer/BuyerDropdown';
import NotificationBell from '../../components/buyer/NotificationBell';

export default function LoansListPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((acc, item) => acc + (item.quantity || 1), 0));

    getLoanSummary()
      .then((res) => setSummary(res.data))
      .catch((err) => {
        setError(
          err.response?.data?.message || 'Failed to load your loans. Please try again.',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const loans = summary?.loans || [];

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
        <div style={s.headerRow}>
          <h1 style={s.title}>Loans</h1>
          <span style={s.openNew} onClick={() => navigate('/loans/apply')}>
            Open new
          </span>
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
              <div style={s.totalAmount}>
                ₦
                {Number(summary?.total_due_this_month || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
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
                        <div style={s.loanSub}>Loan balance</div>
                      </div>
                    </div>
                    <div style={s.loanCardRight}>
                      <div style={s.loanAmount}>
                        ₦{Number(loan.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div style={s.loanBalance}>
                        ₦{Number(loan.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
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
  container: { maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: 800, color: '#111' },
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
  totalAmount: { color: '#fff', fontSize: 36, fontWeight: 800 },
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
