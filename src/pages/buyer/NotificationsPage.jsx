import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import BuyerDropdown from '../../components/buyer/BuyerDropdown';
import MobileNavDrawer from '../../components/buyer/MobileNavDrawer';

const LOGO_PATH = '/android-chrome-192x192.png';

const TYPE_CONFIG = {
  broadcast:           { icon: '📢', label: 'Announcement', color: '#1565c0', bg: '#e3f2fd' },
  new_order:           { icon: '🛍️', label: 'New Order',    color: '#2e7d32', bg: '#e8f5e9' },
  order_confirmed:     { icon: '✅', label: 'Confirmed',    color: '#2e7d32', bg: '#e8f5e9' },
  order_shipped:       { icon: '🚚', label: 'Shipped',      color: '#1565c0', bg: '#e3f2fd' },
  order_delivered:     { icon: '📦', label: 'Delivered',    color: '#2e7d32', bg: '#e8f5e9' },
  low_stock:           { icon: '⚠️', label: 'Low Stock',    color: '#f57c00', bg: '#fff8e7' },
  product_approved:    { icon: '✅', label: 'Approved',     color: '#2e7d32', bg: '#e8f5e9' },
  product_rejected:    { icon: '❌', label: 'Rejected',     color: '#cc0000', bg: '#fff0f0' },
  loan_approved:       { icon: '💰', label: 'Loan',         color: '#2e7d32', bg: '#e8f5e9' },
  loan_rejected:       { icon: '💔', label: 'Loan',         color: '#cc0000', bg: '#fff0f0' },
  loan_disbursed:      { icon: '💵', label: 'Disbursed',    color: '#1565c0', bg: '#e3f2fd' },
  repayment_due:       { icon: '⏰', label: 'Due Soon',     color: '#f57c00', bg: '#fff8e7' },
  repayment_overdue:   { icon: '🔴', label: 'Overdue',      color: '#cc0000', bg: '#fff0f0' },
  repayment_confirmed: { icon: '✅', label: 'Paid',         color: '#2e7d32', bg: '#e8f5e9' },
  general:             { icon: '🔔', label: 'Notice',       color: '#555',    bg: '#f5f5f5' },
};

const getTypeConfig = (type) =>
  TYPE_CONFIG[type] || { icon: '🔔', label: 'Notice', color: '#555', bg: '#f5f5f5' };

const FILTERS = [
  { label: 'All',           params: {} },
  { label: 'Unread',        params: { unread: true } },
  { label: 'Announcements', params: { type: 'broadcast' } },
  { label: 'Orders',        params: { type: 'new_order' } },
  { label: 'Loans',         params: { type: 'loan_approved' } },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [page, setPage]                   = useState(1);
  const [meta, setMeta]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [toast, setToast]                 = useState('');
  const [cartCount, setCartCount]         = useState(0);
  const [markingAll, setMarkingAll]       = useState(false);
  const [deletingId, setDeletingId]       = useState(null);
  const [activeFilter, setActiveFilter]   = useState(0);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchNotifications = (pageNum = 1, filterIdx = activeFilter) => {
    setLoading(true);
    setError(null);
    const params = { page: pageNum, ...FILTERS[filterIdx].params };
    api.get('/inbox', { params })
      .then((res) => {
        const pData = res.data;
        // Backend returns { notifications: { data: [...], total, current_page }, unread_count }
        const inner = pData?.notifications || pData;
        const data  = inner?.data || (Array.isArray(inner) ? inner : []);
        setNotifications(Array.isArray(data) ? data : []);
        if (inner?.total !== undefined || inner?.last_page) setMeta(inner);
        setPage(inner?.current_page || pageNum);
      })
      .catch(() => setError('Failed to load notifications. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((acc, item) => acc + (item.quantity || 0), 0));
    fetchNotifications(1, 0);
  }, []);

  const handleFilterChange = (idx) => {
    setActiveFilter(idx);
    fetchNotifications(1, idx);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await api.patch(`/inbox/${notification.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => n.id === notification.id ? { ...n, is_read: true } : n)
        );
      } catch { /* non-fatal */ }
    }
    if (notification.action_url) navigate(notification.action_url);
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch('/inbox/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast('All notifications marked as read.');
    } catch {
      showToast('Failed to mark all as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await api.delete(`/inbox/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast('Notification deleted.');
    } catch {
      showToast('Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) : '';

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      <style>{`
        .np-desktop-only { display:flex; align-items:center; gap:16px; }
        .np-filter-scroll { display:flex; gap:8px; overflow-x:auto; padding-bottom:4px; scrollbar-width:none; }
        .np-filter-scroll::-webkit-scrollbar { display:none; }
        @media (max-width:640px) { .np-desktop-only { display:none; } }
      `}</style>

      <nav style={s.nav}>
        <div style={s.navLeft} onClick={() => navigate('/')}>
          <img src={LOGO_PATH} alt="Achoice" style={s.navLogo} />
        </div>
        <div style={s.navRight}>
          <div className="np-desktop-only">
            <div style={s.cartBtn} onClick={() => navigate('/cart')}>
              Cart {cartCount > 0 && <span style={s.cartBadge}>{cartCount}</span>}
            </div>
            <BuyerDropdown cartCount={cartCount} />
          </div>
          <MobileNavDrawer cartCount={cartCount} />
        </div>
      </nav>

      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>🔔 Notifications</h1>
            <p style={s.headerSub}>
              {meta?.total ?? notifications.length} total
              {unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              style={markingAll ? s.markAllBtnDisabled : s.markAllBtn}
              onClick={handleMarkAllRead}
              disabled={markingAll}
            >
              {markingAll ? 'Marking...' : '✓ Mark all read'}
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="np-filter-scroll" style={{ marginBottom: 20 }}>
          {FILTERS.map((f, idx) => (
            <button
              key={f.label}
              style={activeFilter === idx ? s.filterBtnActive : s.filterBtn}
              onClick={() => handleFilterChange(idx)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && <p style={s.message}>Loading notifications...</p>}
        {error && <p style={s.errorMsg}>{error}</p>}

        {!loading && !error && notifications.length === 0 && (
          <div style={s.emptyBox}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔕</div>
            <div style={s.emptyTitle}>No notifications</div>
            <p style={s.emptyText}>
              {activeFilter > 0
                ? 'No notifications match this filter.'
                : "You'll see updates about your orders, loans, and broadcasts here."}
            </p>
          </div>
        )}

        {!loading && notifications.map((n) => {
          const cfg = getTypeConfig(n.type);
          return (
            <div
              key={n.id}
              style={n.is_read ? s.notifCard : s.notifCardUnread}
              onClick={() => handleNotificationClick(n)}
            >
              {/* Type icon badge */}
              <div style={{ ...s.notifIcon, background: cfg.bg, color: cfg.color }}>
                {cfg.icon}
              </div>

              <div style={s.notifBody}>
                <div style={s.notifTitleRow}>
                  <div style={s.notifTitle}>{n.title}</div>
                  {!n.is_read && <span style={s.unreadDot} />}
                </div>
                <div style={s.notifMessage}>{n.message}</div>
                <div style={s.notifMeta}>
                  <span style={{ ...s.notifTypeTag, background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <span style={s.notifDate}>{fmtDate(n.created_at)}</span>
                  {n.action_url && (
                    <span style={s.notifCta}>View →</span>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <button
                style={s.deleteBtn}
                onClick={(e) => handleDelete(e, n.id)}
                disabled={deletingId === n.id}
                title="Delete notification"
              >
                {deletingId === n.id ? '...' : '✕'}
              </button>
            </div>
          );
        })}

        {/* Pagination */}
        {meta && (meta.last_page || meta.total_pages || 1) > 1 && (
          <div style={s.paginationRow}>
            <button
              style={page <= 1 ? s.pageBtnDisabled : s.pageBtn}
              disabled={page <= 1}
              onClick={() => { fetchNotifications(page - 1); }}
            >
              ← Prev
            </button>
            <span style={s.pageLabel}>
              Page {page} of {meta.last_page || meta.total_pages || 1}
            </span>
            <button
              style={page >= (meta.last_page || meta.total_pages || 1) ? s.pageBtnDisabled : s.pageBtn}
              disabled={page >= (meta.last_page || meta.total_pages || 1)}
              onClick={() => { fetchNotifications(page + 1); }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f7f5f0', fontFamily: 'Arial, sans-serif' },
  toast: {
    position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff',
    padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  nav: {
    background: '#1f4d1f', padding: '12px 24px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100,
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  navLogo: { width: 36, height: 36, borderRadius: 6 },
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  cartBtn: { color: '#fff', fontSize: 13, cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', gap: 4 },
  cartBadge: { background: '#f0c050', color: '#1a3d1a', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, marginLeft: 2 },
  container: { maxWidth: 720, margin: '0 auto', padding: '28px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  headerTitle: { fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 4px' },
  headerSub: { fontSize: 13, color: '#888', margin: 0 },
  markAllBtn: {
    padding: '9px 16px', background: '#fff', color: '#1f4d1f', border: '1px solid #1f4d1f',
    borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  markAllBtnDisabled: {
    padding: '9px 16px', background: '#f5f5f5', color: '#aaa', border: '1px solid #ddd',
    borderRadius: 7, fontSize: 13, cursor: 'not-allowed', fontFamily: 'inherit',
  },
  filterBtn: {
    padding: '7px 14px', background: '#fff', color: '#555', border: '1px solid #ddd',
    borderRadius: 99, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  filterBtnActive: {
    padding: '7px 14px', background: '#1f4d1f', color: '#fff', border: '1px solid #1f4d1f',
    borderRadius: 99, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
    fontWeight: 600,
  },
  message: { textAlign: 'center', color: '#888', padding: 40 },
  errorMsg: { textAlign: 'center', color: '#cc0000', padding: 20 },
  emptyBox: { textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc' },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#888' },
  notifCard: {
    display: 'flex', gap: 12, background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc',
    padding: '14px 16px', marginBottom: 10, cursor: 'pointer', alignItems: 'flex-start',
  },
  notifCardUnread: {
    display: 'flex', gap: 12, background: '#f0f7ec', borderRadius: 10, border: '1px solid #c5ddb8',
    padding: '14px 16px', marginBottom: 10, cursor: 'pointer', alignItems: 'flex-start',
  },
  notifIcon: {
    flexShrink: 0, width: 38, height: 38, borderRadius: 10, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 18,
  },
  notifBody: { flex: 1, minWidth: 0 },
  notifTitleRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: 700, color: '#111' },
  unreadDot: { width: 8, height: 8, borderRadius: '50%', background: '#cc0000', flexShrink: 0 },
  notifMessage: { fontSize: 13, color: '#555', marginBottom: 8, lineHeight: 1.5 },
  notifMeta: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  notifTypeTag: {
    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  notifDate: { fontSize: 11, color: '#aaa' },
  notifCta: { fontSize: 12, color: '#1f4d1f', fontWeight: 600 },
  deleteBtn: {
    background: 'none', border: 'none', color: '#ccc', fontSize: 14, cursor: 'pointer',
    padding: '2px 6px', borderRadius: 4, flexShrink: 0, fontFamily: 'inherit',
    lineHeight: 1,
  },
  paginationRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '24px 0' },
  pageBtn: {
    padding: '10px 20px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 7,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  pageBtnDisabled: {
    padding: '10px 20px', background: '#f0f0f0', color: '#aaa', border: 'none', borderRadius: 7,
    fontSize: 13, cursor: 'not-allowed', fontFamily: 'inherit',
  },
  pageLabel: { fontSize: 13, color: '#555', fontWeight: 500 },
};