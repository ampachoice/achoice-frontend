import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const LOGO_PATH = '/achoice logo.png';

export default function ManageBuyersPage() {
  const navigate = useNavigate();

  const [buyers, setBuyers] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [acting, setActing] = useState(null);

  const [restrictModal, setRestrictModal] = useState(null);
  const [restrictForm, setRestrictForm] = useState({
    restrict_orders: false,
    restrict_loans: false,
    reason: '',
  });
  const [restrictSubmitting, setRestrictSubmitting] = useState(false);

  const [expandedBuyer, setExpandedBuyer] = useState(null);
  const [detailMap, setDetailMap] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const fetchBuyers = (pageNum = 1) => {
    setLoading(true);
    api.get('/admin/users', {
      params: {
        page: pageNum,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: search || undefined,
      },
    })
      .then((res) => {
        const pData = res.data;
        const data = pData?.data || pData || [];
        setBuyers(Array.isArray(data) ? data : []);
        if (pData?.meta || pData?.last_page) setMeta(pData.meta || pData);
        setPage(pData?.current_page || pageNum);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBuyers(1);
  }, [filterStatus, search]);

  const goToPage = (pageNum) => {
    fetchBuyers(pageNum);
  };

  const handleViewDetails = async (buyerId) => {
    if (expandedBuyer === buyerId) {
      setExpandedBuyer(null);
      return;
    }
    setExpandedBuyer(buyerId);
    if (detailMap[buyerId]) return;
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/users/${buyerId}`);
      setDetailMap((prev) => ({ ...prev, [buyerId]: res.data }));
    } catch {
      setDetailMap((prev) => ({ ...prev, [buyerId]: { error: true } }));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBan = async (buyer) => {
    if (!window.confirm(`Permanently ban ${buyer.name}? This will revoke all their active sessions immediately.`)) return;
    setActing(buyer.id);
    try {
      const res = await api.patch(`/admin/users/${buyer.id}/ban`);
      const updated = res.data?.user || res.data;
      setBuyers((prev) => prev.map((b) => (b.id === buyer.id ? { ...b, ...updated } : b)));
      showToast(res.data?.message || 'Buyer banned.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to ban buyer.');
    } finally {
      setActing(null);
    }
  };

  const handleActivate = async (buyer) => {
    if (!window.confirm(`Lift all restrictions on ${buyer.name} and restore active status?`)) return;
    setActing(buyer.id);
    try {
      const res = await api.patch(`/admin/users/${buyer.id}/activate`);
      const updated = res.data?.user || res.data;
      setBuyers((prev) => prev.map((b) => (b.id === buyer.id ? { ...b, ...updated } : b)));
      showToast(res.data?.message || 'Buyer activated.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to activate buyer.');
    } finally {
      setActing(null);
    }
  };

  const openRestrictModal = (buyer) => {
    setRestrictModal(buyer);
    setRestrictForm({
      restrict_orders: !!buyer.restrict_orders,
      restrict_loans: !!buyer.restrict_loans,
      reason: buyer.restrict_reason || '',
    });
  };

  const handleRestrictSubmit = async (e) => {
    e.preventDefault();
    setRestrictSubmitting(true);
    try {
      const res = await api.patch(`/admin/users/${restrictModal.id}/restrict`, restrictForm);
      const updated = res.data?.user || res.data;
      setBuyers((prev) => prev.map((b) => (b.id === restrictModal.id ? { ...b, ...updated } : b)));
      showToast(res.data?.message || 'Restrictions updated.');
      setRestrictModal(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update restrictions.');
    } finally {
      setRestrictSubmitting(false);
    }
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const toMoney = (val) =>
    val != null && !isNaN(Number(val)) ? `₦${Number(val).toLocaleString()}` : '—';

  const getStatusStyle = (status) => ({
    active:    { background: '#eafaf0', color: '#1a7a3a' },
    suspended: { background: '#fff8e7', color: '#b36b00' },
    banned:    { background: '#fff0f0', color: '#cc0000' },
  }[status] || { background: '#f0f0f0', color: '#555' });

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Restrict Modal */}
      {restrictModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalBox}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Restrict Buyer</h2>
              <button style={s.modalClose} onClick={() => setRestrictModal(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.modalBuyerInfo}>
                <div style={s.modalBuyerName}>{restrictModal.name}</div>
                <div style={s.modalBuyerEmail}>{restrictModal.email}</div>
              </div>
              <form onSubmit={handleRestrictSubmit}>
                <label style={s.checkRow}>
                  <input
                    type="checkbox"
                    checked={restrictForm.restrict_orders}
                    onChange={(e) => setRestrictForm({ ...restrictForm, restrict_orders: e.target.checked })}
                  />
                  Restrict from placing orders
                </label>
                <label style={s.checkRow}>
                  <input
                    type="checkbox"
                    checked={restrictForm.restrict_loans}
                    onChange={(e) => setRestrictForm({ ...restrictForm, restrict_loans: e.target.checked })}
                  />
                  Restrict from applying for loans
                </label>
                <div style={s.modalField}>
                  <label style={s.modalLabel}>Reason</label>
                  <textarea
                    style={s.modalTextarea}
                    rows={3}
                    placeholder="e.g. Fraud suspected"
                    value={restrictForm.reason}
                    onChange={(e) => setRestrictForm({ ...restrictForm, reason: e.target.value })}
                  />
                </div>
                <div style={s.modalFooter}>
                  <button type="button" style={s.modalCancelBtn} onClick={() => setRestrictModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" style={s.modalSaveBtn} disabled={restrictSubmitting}>
                    {restrictSubmitting ? 'Saving...' : 'Save Restrictions'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <img src={LOGO_PATH} alt="Achoice" style={s.logoImg} />
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Admin Panel</div>
          </div>
        </div>
        <nav style={s.sidebarNav}>
          {[
            { icon: '📊', label: 'Dashboard', path: '/admin/dashboard' },
            { icon: '👤', label: 'Buyers', path: '/admin/buyers', active: true },
            { icon: '🏪', label: 'Sellers', path: '/admin/sellers' },
            { icon: '🌾', label: 'Products', path: '/admin/products' },
            { icon: '📦', label: 'Orders', path: '/admin/orders' },
            { icon: '💰', label: 'Loans', path: '/admin/loans' },
            { icon: '⚙️', label: 'Loan Settings', path: '/admin/loan-settings' },
            { icon: '🚚', label: 'Delivery Zones', path: '/admin/delivery-zones' },
            { icon: '👥', label: 'Staff', path: '/admin/staff' },
            { icon: '📈', label: 'Reports', path: '/admin/reports' },
          ].map((item) => (
            <div
              key={item.label}
              style={{ ...s.sidebarItem, ...(item.active ? s.sidebarItemActive : {}) }}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
        <div style={s.sidebarFooter}>
          <button
            style={s.logoutBtn}
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/admin');
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>Buyers</h1>
            <p style={s.headerSub}>{meta?.total ?? buyers.length} total buyers</p>
          </div>
          <button style={s.refreshBtn} onClick={() => fetchBuyers(page)} disabled={loading}>
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>

        <div style={s.filterRow}>
          <div style={s.filterTabs}>
            {['all', 'active', 'suspended', 'banned'].map((tab) => (
              <button
                key={tab}
                style={filterStatus === tab ? s.filterTabActive : s.filterTab}
                onClick={() => setFilterStatus(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p style={s.message}>Loading buyers...</p>}
        {!loading && buyers.length === 0 && (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>👤</div>
            <p style={s.emptyText}>No buyers found.</p>
          </div>
        )}

        {buyers.map((buyer) => (
          <div key={buyer.id} style={s.buyerCard}>
            <div style={s.buyerHeader}>
              <div>
                <div style={s.buyerName}>{buyer.name}</div>
                <div style={s.buyerMeta}>{buyer.email} {buyer.phone ? `· ${buyer.phone}` : ''}</div>
                <div style={s.buyerMeta}>Joined {fmtDate(buyer.created_at)}</div>
              </div>
              <div style={s.buyerHeaderRight}>
                <div style={{ ...s.statusBadge, ...getStatusStyle(buyer.status) }}>{buyer.status}</div>
                {!!buyer.restrict_orders && <div style={s.restrictBadge}>🚫 Orders restricted</div>}
                {!!buyer.restrict_loans && <div style={s.restrictBadge}>🚫 Loans restricted</div>}
              </div>
            </div>

            {buyer.restrict_reason && (
              <div style={s.reasonNote}>Reason: {buyer.restrict_reason}</div>
            )}

            <div style={s.actionRow}>
              <button
                style={s.detailsBtn}
                onClick={() => handleViewDetails(buyer.id)}
              >
                {expandedBuyer === buyer.id ? 'Hide' : 'View'} Details
              </button>

              {buyer.status !== 'banned' && (
                <button
                  style={acting === buyer.id ? s.banBtnDisabled : s.banBtn}
                  onClick={() => handleBan(buyer)}
                  disabled={acting === buyer.id}
                >
                  Ban
                </button>
              )}

              <button
                style={acting === buyer.id ? s.restrictBtnDisabled : s.restrictBtn}
                onClick={() => openRestrictModal(buyer)}
                disabled={acting === buyer.id}
              >
                Restrict
              </button>

              {(buyer.status !== 'active' || buyer.restrict_orders || buyer.restrict_loans) && (
                <button
                  style={acting === buyer.id ? s.activateBtnDisabled : s.activateBtn}
                  onClick={() => handleActivate(buyer)}
                  disabled={acting === buyer.id}
                >
                  Activate
                </button>
              )}
            </div>

            {expandedBuyer === buyer.id && (
              <div style={s.detailPanel}>
                {detailLoading && !detailMap[buyer.id] && (
                  <p style={{ textAlign: 'center', color: '#888', padding: 16 }}>Loading details...</p>
                )}
                {detailMap[buyer.id]?.error && (
                  <p style={{ textAlign: 'center', color: '#cc0000', padding: 16 }}>Failed to load details.</p>
                )}
                {detailMap[buyer.id] && !detailMap[buyer.id].error && (
                  <>
                    <div style={s.detailSectionTitle}>Recent Orders</div>
                    {(detailMap[buyer.id].orders || []).length === 0 ? (
                      <p style={s.detailEmpty}>No orders yet.</p>
                    ) : (
                      <div style={s.detailTable}>
                        {(detailMap[buyer.id].orders || []).map((o) => (
                          <div key={o.id} style={s.detailRow}>
                            <span>{o.order_number || `#${o.id}`}</span>
                            <span>{toMoney(o.total)}</span>
                            <span style={{ textTransform: 'capitalize' }}>{o.status}</span>
                            <span>{fmtDate(o.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ ...s.detailSectionTitle, marginTop: 16 }}>Recent Loans</div>
                    {(detailMap[buyer.id].loans || []).length === 0 ? (
                      <p style={s.detailEmpty}>No loans yet.</p>
                    ) : (
                      <div style={s.detailTable}>
                        {(detailMap[buyer.id].loans || []).map((l) => (
                          <div key={l.id} style={s.detailRow}>
                            <span>{toMoney(l.amount)}</span>
                            <span>{l.duration_months} months</span>
                            <span style={{ textTransform: 'capitalize' }}>{l.status}</span>
                            <span>{fmtDate(l.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {meta && (meta.last_page || meta.total_pages || 1) > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '24px 0' }}>
            <button
              style={{
                padding: '10px 20px',
                background: page <= 1 ? '#f0f0f0' : '#1f4d1f',
                color: page <= 1 ? '#aaa' : '#fff',
                border: 'none',
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              Prev
            </button>
            <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>
              Page {page} of {meta.last_page || meta.total_pages || 1}
            </span>
            <button
              style={{
                padding: '10px 20px',
                background: page >= (meta.last_page || meta.total_pages || 1) ? '#f0f0f0' : '#1f4d1f',
                color: page >= (meta.last_page || meta.total_pages || 1) ? '#aaa' : '#fff',
                border: 'none',
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
                cursor: page >= (meta.last_page || meta.total_pages || 1) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
              disabled={page >= (meta.last_page || meta.total_pages || 1)}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif' },
  toast: {
    position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff',
    padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  sidebar: {
    width: 240, background: '#1f4d1f', display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, height: '100vh',
  },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: 10, padding: 20, borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoImg: { width: 40, height: 40, objectFit: 'contain' },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: '#fff' },
  sidebarLogoSub: { fontSize: 10, color: '#a8d5a8' },
  sidebarNav: { flex: 1, padding: '16px 0' },
  sidebarItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', color: '#a8d5a8', fontSize: 14, cursor: 'pointer' },
  sidebarItemActive: { background: 'rgba(255,255,255,0.15)', color: '#fff', borderLeft: '3px solid #f0c050' },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  logoutBtn: {
    width: '100%', padding: 8, background: 'rgba(255,255,255,0.1)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
  },
  main: { flex: 1, marginLeft: 240, padding: 32 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  headerTitle: { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 4 },
  headerSub: { fontSize: 14, color: '#888' },
  refreshBtn: {
    padding: '8px 16px', background: '#fff', color: '#1f4d1f', border: '1px solid #1f4d1f',
    borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  filterRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  filterTabs: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filterTab: {
    padding: '8px 16px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, color: '#555',
    cursor: 'pointer', background: '#fff', fontFamily: 'inherit',
  },
  filterTabActive: {
    padding: '8px 16px', border: '1px solid #1f4d1f', borderRadius: 6, fontSize: 13, color: '#fff',
    cursor: 'pointer', background: '#1f4d1f', fontFamily: 'inherit',
  },
  searchInput: {
    padding: '10px 16px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14,
    outline: 'none', minWidth: 260, fontFamily: 'inherit',
  },
  message: { textAlign: 'center', color: '#666', padding: 40 },
  emptyBox: { textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#888' },
  buyerCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 24, marginBottom: 16 },
  buyerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 10 },
  buyerHeaderRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  buyerName: { fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 4 },
  buyerMeta: { fontSize: 12, color: '#888' },
  statusBadge: { fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 99, textTransform: 'capitalize' },
  restrictBadge: { fontSize: 11, color: '#b36b00', background: '#fff8e7', padding: '3px 10px', borderRadius: 99, fontWeight: 600 },
  reasonNote: { fontSize: 12, color: '#666', background: '#f7f5f0', padding: '8px 12px', borderRadius: 6, marginBottom: 12 },
  actionRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  detailsBtn: {
    padding: '9px 18px', background: '#f7f5f0', color: '#555', border: '1px solid #e8e4dc',
    borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  banBtn: {
    padding: '9px 18px', background: '#cc0000', color: '#fff', border: 'none',
    borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  banBtnDisabled: {
    padding: '9px 18px', background: '#e8a8a8', color: '#fff', border: 'none',
    borderRadius: 6, fontSize: 13, cursor: 'not-allowed', fontFamily: 'inherit',
  },
  restrictBtn: {
    padding: '9px 18px', background: '#fff', color: '#b36b00', border: '1px solid #b36b00',
    borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  restrictBtnDisabled: {
    padding: '9px 18px', background: '#fff', color: '#ccc', border: '1px solid #ccc',
    borderRadius: 6, fontSize: 13, cursor: 'not-allowed', fontFamily: 'inherit',
  },
  activateBtn: {
    padding: '9px 18px', background: '#1f4d1f', color: '#fff', border: 'none',
    borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  activateBtnDisabled: {
    padding: '9px 18px', background: '#ccc', color: '#fff', border: 'none',
    borderRadius: 6, fontSize: 13, cursor: 'not-allowed', fontFamily: 'inherit',
  },
  detailPanel: { marginTop: 16, background: '#f7f5f0', borderRadius: 8, padding: 16 },
  detailSectionTitle: { fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  detailEmpty: { fontSize: 13, color: '#888', padding: '8px 0' },
  detailTable: { display: 'flex', flexDirection: 'column', gap: 6 },
  detailRow: {
    display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 8, fontSize: 12,
    background: '#fff', padding: '8px 12px', borderRadius: 6, border: '1px solid #e8e4dc',
  },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modalBox: { background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#1f4d1f' },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 },
  modalClose: {
    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 28, height: 28,
    borderRadius: '50%', cursor: 'pointer', fontSize: 14,
  },
  modalBody: { padding: 24 },
  modalBuyerInfo: { background: '#f7f5f0', borderRadius: 8, padding: '12px 16px', marginBottom: 18 },
  modalBuyerName: { fontSize: 15, fontWeight: 700, color: '#111' },
  modalBuyerEmail: { fontSize: 12, color: '#888' },
  checkRow: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#444', marginBottom: 12, cursor: 'pointer' },
  modalField: { marginTop: 14, marginBottom: 6 },
  modalLabel: { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 8 },
  modalTextarea: {
    width: '100%', padding: '11px 14px', border: '1px solid #ddd', borderRadius: 7, fontSize: 14,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical',
  },
  modalFooter: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 18 },
  modalCancelBtn: {
    padding: '10px 20px', background: '#f5f5f5', color: '#555', border: '1px solid #ddd',
    borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
  },
  modalSaveBtn: {
    padding: '10px 24px', background: '#1f4d1f', color: '#fff', border: 'none',
    borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14,
  },
};
