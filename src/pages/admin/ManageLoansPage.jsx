import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminLoans, decideLoan } from '../../services/adminService';

export default function ManageLoansPage() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [deciding, setDeciding] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getAdminLoans()
      .then((res) => setLoans(res.data.data || res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

 const handleDecision = async (loanId, decision) => {
  const confirmMsg = decision === 'approved'
    ? 'Approve this loan application?'
    : 'Reject this loan application?';
  if (!window.confirm(confirmMsg)) return;

  let payload = { decision };

  if (decision === 'approved') {
    const interest_rate = window.prompt('Enter interest rate (e.g. 10):', '10');
    if (!interest_rate) return;
    const duration_months = window.prompt('Enter duration in months (e.g. 6):', '6');
    if (!duration_months) return;
    payload = { decision, interest_rate, duration_months };
  } else {
    const rejection_reason = window.prompt('Enter rejection reason:');
    if (!rejection_reason) return;
    payload = { decision, rejection_reason };
  }

  setDeciding(loanId);
  try {
    await decideLoan(loanId, payload);
    setLoans(loans.map((l) =>
      l.id === loanId ? { ...l, status: decision } : l
    ));
    showToast(`Loan ${decision} successfully!`);
  } catch (err) {
    showToast('Failed to process decision. Please try again.');
  } finally {
    setDeciding(null);
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

  const filtered = filter === 'all' ? loans : loans.filter((l) => l.status === filter);

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <div style={s.sidebarLogoIcon}>A</div>
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Admin Panel</div>
          </div>
        </div>
        <nav style={s.sidebarNav}>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/dashboard')}>
            <span style={s.sidebarIcon}>📊</span> Dashboard
          </div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/sellers')}>
            <span style={s.sidebarIcon}>🏪</span> Sellers
          </div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/products')}>
            <span style={s.sidebarIcon}>🌾</span> Products
          </div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/orders')}>
            <span style={s.sidebarIcon}>📦</span> Orders
          </div>
          <div style={{ ...s.sidebarItem, ...s.sidebarItemActive }}>
            <span style={s.sidebarIcon}>💰</span> Loans
          </div>
        </nav>
        <div style={s.sidebarFooter}>
          <button style={s.logoutBtn} onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/admin');
          }}>Logout</button>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>Loan Applications</h1>
            <p style={s.headerSub}>Review and approve or reject loan applications</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={s.filterTabs}>
          {['all', 'pending', 'approved', 'active', 'rejected', 'completed'].map((tab) => (
            <button
              key={tab}
              style={filter === tab ? s.filterTabActive : s.filterTab}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'pending' && loans.filter(l => l.status === 'pending').length > 0 && (
                <span style={s.tabBadge}>
                  {loans.filter(l => l.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && <p style={s.message}>Loading loans...</p>}

        {!loading && filtered.length === 0 && (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>💰</div>
            <p style={s.emptyText}>No {filter === 'all' ? '' : filter} loans found</p>
          </div>
        )}

        {filtered.map((loan) => (
          <div key={loan.id} style={s.loanCard}>
            <div style={s.loanHeader}>
              <div style={s.loanLeft}>
                <div style={s.loanAmount}>
                  ₦{Number(loan.amount).toLocaleString()}
                </div>
                <div style={s.loanApplicant}>
                  {loan.user ? loan.user.name : 'Applicant'} —{' '}
                  {loan.user ? loan.user.email : ''}
                </div>
              </div>
              <div style={{ ...s.statusBadge, ...getStatusStyle(loan.status) }}>
                {loan.status}
              </div>
            </div>

            <div style={s.loanDetails}>
              <div style={s.loanDetail}>
                <div style={s.loanDetailLabel}>Purpose</div>
                <div style={s.loanDetailValue}>{loan.purpose}</div>
              </div>
              <div style={s.loanDetail}>
                <div style={s.loanDetailLabel}>Duration</div>
                <div style={s.loanDetailValue}>{loan.duration_months} months</div>
              </div>
              <div style={s.loanDetail}>
                <div style={s.loanDetailLabel}>Repayment</div>
                <div style={s.loanDetailValue}>{loan.repayment_preference}</div>
              </div>
              <div style={s.loanDetail}>
                <div style={s.loanDetailLabel}>Applied</div>
                <div style={s.loanDetailValue}>
                  {new Date(loan.created_at).toLocaleDateString('en-NG', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {loan.status === 'pending' && (
              <div style={s.actionRow}>
                <button
                  style={deciding === loan.id ? s.approveBtnDisabled : s.approveBtn}
                  onClick={() => handleDecision(loan.id, 'approved')}
                  disabled={deciding === loan.id}
                >
                  {deciding === loan.id ? 'Processing...' : 'Approve Loan'}
                </button>
                <button
                  style={deciding === loan.id ? s.rejectBtnDisabled : s.rejectBtn}
                  onClick={() => handleDecision(loan.id, 'rejected')}
                  disabled={deciding === loan.id}
                >
                  Reject
                </button>
              </div>
            )}

            {loan.status === 'approved' && (
              <div style={s.approvedNote}>
                Loan approved: waiting for disbursement
              </div>
            )}

            {loan.status === 'rejected' && loan.rejection_reason && (
              <div style={s.rejectedNote}>
                Rejection reason: {loan.rejection_reason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif' },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999 },
  sidebar: { width: 240, background: '#1f4d1f', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: 10, padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  sidebarLogoIcon: { width: 36, height: 36, background: '#f0c050', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f4d1f', fontWeight: 900, fontSize: 18 },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: '#fff' },
  sidebarLogoSub: { fontSize: 10, color: '#a8d5a8', marginTop: 1 },
  sidebarNav: { flex: 1, padding: '16px 0' },
  sidebarItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', color: '#a8d5a8', fontSize: 14, cursor: 'pointer' },
  sidebarItemActive: { background: 'rgba(255,255,255,0.15)', color: '#fff', borderLeft: '3px solid #f0c050' },
  sidebarIcon: { fontSize: 16 },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  logoutBtn: { width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  main: { flex: 1, marginLeft: 240, padding: '32px' },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 4 },
  headerSub: { fontSize: 14, color: '#888' },
  filterTabs: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  filterTab: { padding: '8px 16px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, color: '#555', cursor: 'pointer', background: '#fff', fontFamily: 'inherit' },
  filterTabActive: { padding: '8px 16px', border: '1px solid #1f4d1f', borderRadius: 6, fontSize: 13, color: '#fff', cursor: 'pointer', background: '#1f4d1f', fontFamily: 'inherit' },
  tabBadge: { marginLeft: 6, background: '#cc0000', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 99 },
  message: { textAlign: 'center', color: '#666', padding: 40 },
  emptyBox: { textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#888' },
  loanCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 24, marginBottom: 16 },
  loanHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  loanLeft: {},
  loanAmount: { fontSize: 24, fontWeight: 700, color: '#1f4d1f', marginBottom: 4 },
  loanApplicant: { fontSize: 13, color: '#888' },
  statusBadge: { fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 99, textTransform: 'capitalize' },
  loanDetails: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, padding: '16px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', marginBottom: 16 },
  loanDetail: {},
  loanDetailLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  loanDetailValue: { fontSize: 13, fontWeight: 600, color: '#111', textTransform: 'capitalize' },
  actionRow: { display: 'flex', gap: 10 },
  approveBtn: { padding: '10px 24px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  approveBtnDisabled: { padding: '10px 24px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'not-allowed', fontFamily: 'inherit' },
  rejectBtn: { padding: '10px 24px', background: '#fff', color: '#cc0000', border: '1px solid #cc0000', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  rejectBtnDisabled: { padding: '10px 24px', background: '#fff', color: '#ccc', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, cursor: 'not-allowed', fontFamily: 'inherit' },
  approvedNote: { background: '#eafaf0', color: '#1a7a3a', padding: '10px 14px', borderRadius: 6, fontSize: 13 },
  rejectedNote: { background: '#fff0f0', color: '#cc0000', padding: '10px 14px', borderRadius: 6, fontSize: 13 },
};