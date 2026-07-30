import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import BuyerDropdown from '../../components/buyer/BuyerDropdown';
import MobileNavDrawer from '../../components/buyer/MobileNavDrawer';

const LOGO_PATH = '/android-chrome-192x192.png';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchNotifications = (pageNum = 1, filters = {}) => {
    const activeUnreadOnly = filters.unreadOnly ?? unreadOnly;
    const activeType = filters.typeFilter ?? typeFilter;

    setLoading(true);
    setError(null);
    api.get('/inbox', {
      params: {
        page: pageNum,
        ...(activeUnreadOnly && { unread: true }),
        ...(activeType && { type: activeType }),
      },
    })
      .then((res) => {
        const pData = res.data?.notifications || {};
        setNotifications(Array.isArray(pData.data) ? pData.data : []);
        setMeta(pData);
        setPage(pData.current_page || pageNum);
        if (res.data?.unread_count != null) setUnreadCount(res.data.unread_count);
      })
      .catch(() => setError('Failed to load notifications. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((acc, item) => acc + (item.quantity || 0), 0));
    fetchNotifications(1);
  }, []);

  const goToPage = (pageNum) => {
    fetchNotifications(pageNum);
  };

  const handleToggleUnreadOnly = () => {
    const next = !unreadOnly;
    setUnreadOnly(next);
    fetchNotifications(1, { unreadOnly: next });
  };

  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
    fetchNotifications(1, { typeFilter: value });
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await api.patch(`/inbox/${notification.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      } catch {
        // Non-fatal — still navigate even if marking read fails
      }
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch('/inbox/read-all');
      setUnreadCount(0);
      showToast('All notifications marked as read.');
      // Refetch rather than just flipping is_read locally — if "Unread only"
      // is active, the list should now correctly come back empty instead of
      // showing already-read notifications inside an unread-only filter.
      fetchNotifications(1);
    } catch {
      showToast('Failed to mark all as read. Please try again.');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (notification, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this notification?')) return;
    setDeletingId(notification.id);
    try {
      await api.delete(`/inbox/${notification.id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      if (!notification.is_read) setUnreadCount((prev) => Math.max(prev - 1, 0));
      setMeta((prev) => (prev ? { ...prev, total: Math.max((prev.total || 1) - 1, 0) } : prev));
    } catch {
      showToast('Failed to delete this notification. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-NG', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

  const TYPE_META = {
    broadcast: { label: 'Announcement', bg: '#eef0ff', color: '#3a3aa8' },
    new_order: { label: 'New Order', bg: '#eafaf0', color: '#1a7a3a' },
    low_stock: { label: 'Low Stock', bg: '#fff8e7', color: '#b36b00' },
    product_approved: { label: 'Approved', bg: '#eafaf0', color: '#1a7a3a' },
    product_rejected: { label: 'Rejected', bg: '#fff0f0', color: '#cc0000' },
    loan_approved: { label: 'Loan Approved', bg: '#eafaf0', color: '#1a7a3a' },
    loan_rejected: { label: 'Loan Rejected', bg: '#fff0f0', color: '#cc0000' },
    loan_disbursed: { label: 'Loan Disbursed', bg: '#e7f0ff', color: '#1a4fa0' },
    repayment_due: { label: 'Payment Due', bg: '#fff8e7', color: '#b36b00' },
    repayment_overdue: { label: 'Overdue', bg: '#fff0f0', color: '#cc0000' },
    repayment_confirmed: { label: 'Payment', bg: '#eafaf0', color: '#1a7a3a' },
    order_confirmed: { label: 'Confirmed', bg: '#e7f0ff', color: '#1a4fa0' },
    order_shipped: { label: 'Shipped', bg: '#eee6fb', color: '#5a1aa8' },
    order_delivered: { label: 'Delivered', bg: '#eafaf0', color: '#1a7a3a' },
    general: { label: 'Notice', bg: '#f0f0f0', color: '#555' },
    // Legacy types kept for backward compatibility with older records that
    // predate the Phase 4 inbox type list.
    payment_collected: { label: 'Payment', bg: '#eafaf0', color: '#1a7a3a' },
    complaint_reply: { label: 'Complaint', bg: '#fff8e7', color: '#b36b00' },
  };

  const typeMeta = (type) => TYPE_META[type] || { label: 'Notice', bg: '#f0f0f0', color: '#555' };

  const TYPE_FILTER_OPTIONS = [
    { value: '', label: 'All types' },
    { value: 'broadcast', label: 'Announcements' },
    { value: 'new_order', label: 'New Order' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'product_approved', label: 'Product Approved' },
    { value: 'product_rejected', label: 'Product Rejected' },
    { value: 'loan_approved', label: 'Loan Approved' },
    { value: 'loan_rejected', label: 'Loan Rejected' },
    { value: 'loan_disbursed', label: 'Loan Disbursed' },
    { value: 'repayment_due', label: 'Payment Due' },
    { value: 'repayment_overdue', label: 'Payment Overdue' },
    { value: 'repayment_confirmed', label: 'Payment Confirmed' },
    { value: 'order_confirmed', label: 'Order Confirmed' },
    { value: 'order_shipped', label: 'Order Shipped' },
    { value: 'order_delivered', label: 'Order Delivered' },
    { value: 'general', label: 'General' },
  ];
  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      <style>{`
        .np-desktop-only { display: flex; align-items: center; gap: 16px; }
        @media (max-width: 640px) {
          .np-desktop-only { display: none; }
        }
      `}</style>
      <nav style={s.nav}>
        <div style={s.navLeft} onClick={() => navigate('/')}>
          <img src={LOGO_PATH} alt="Achoice" style={s.navLogo} />
        </div>
        <div style={s.navRight}>
          <div className="np-desktop-only">
            <div style={s.cartBtn} onClick={() => navigate('/cart')}>
              Cart
              {cartCount > 0 && <span style={s.cartBadge}>{cartCount}</span>}
            </div>
            <BuyerDropdown cartCount={cartCount} />
          </div>
          <MobileNavDrawer cartCount={cartCount} />
        </div>
      </nav>

      <div style={s.container}>
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>Notifications</h1>
            <p style={s.headerSub}>
              {meta?.total ?? notifications.length} total
              {unreadCount > 0 ? ` \u2022 ${unreadCount} unread` : ''}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              style={markingAll ? s.markAllBtnDisabled : s.markAllBtn}
              onClick={handleMarkAllRead}
              disabled={markingAll}
            >
              {markingAll ? 'Marking...' : 'Mark all as read'}
            </button>
          )}
        </div>

        <div style={s.filterRow}>
          <button
            style={unreadOnly ? s.filterToggleActive : s.filterToggle}
            onClick={handleToggleUnreadOnly}
          >
            {unreadOnly ? '✓ Unread only' : 'Unread only'}
          </button>
          <select
            style={s.filterSelect}
            value={typeFilter}
            onChange={(e) => handleTypeFilterChange(e.target.value)}
          >
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {loading && <p style={s.message}>Loading notifications...</p>}
        {error && <p style={s.errorMsg}>{error}</p>}

        {!loading && !error && notifications.length === 0 && (
          <div style={s.emptyBox}>
            <div style={s.emptyTitle}>
              {unreadOnly || typeFilter ? 'No notifications match these filters' : 'No notifications yet'}
            </div>
            <p style={s.emptyText}>
              {unreadOnly || typeFilter
                ? 'Try clearing a filter to see more.'
                : "You'll see updates about your orders, loans and complaints here."}
            </p>
          </div>
        )}

        {!loading &&
          notifications.map((n) => (
            <div
              key={n.id}
              style={n.is_read ? s.notifCard : s.notifCardUnread}
              onClick={() => handleNotificationClick(n)}
            >
              <div style={{ ...s.notifTypeTag, background: typeMeta(n.type).bg, color: typeMeta(n.type).color }}>
                {typeMeta(n.type).label}
              </div>
              <div style={s.notifBody}>
                <div style={s.notifTitleRow}>
                  <div style={s.notifTitle}>{n.title}</div>
                  {!n.is_read && <span style={s.unreadDot} />}
                </div>
                <div style={s.notifMessage}>{n.message}</div>
                <div style={s.notifDate}>{fmtDate(n.created_at)}</div>
              </div>
              <button
                style={s.deleteBtn}
                onClick={(e) => handleDelete(n, e)}
                disabled={deletingId === n.id}
                aria-label="Delete notification"
                title="Delete"
              >
                {deletingId === n.id ? '…' : '✕'}
              </button>
            </div>
          ))}

        {meta && (meta.last_page || meta.total_pages || 1) > 1 && (
          <div style={s.paginationRow}>
            <button
              style={page <= 1 ? s.pageBtnDisabled : s.pageBtn}
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              Prev
            </button>
            <span style={s.pageLabel}>
              Page {page} of {meta.last_page || meta.total_pages || 1}
            </span>
            <button
              style={
                page >= (meta.last_page || meta.total_pages || 1)
                  ? s.pageBtnDisabled
                  : s.pageBtn
              }
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
  navName: { fontWeight: 700, fontSize: 16, color: '#fff' },
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  cartBtn: { color: '#fff', fontSize: 13, cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', gap: 4 },
  cartBadge: {
    background: '#f0c050', color: '#1a3d1a', fontSize: 10, fontWeight: 700,
    padding: '1px 6px', borderRadius: 99, marginLeft: 2,
  },
  container: { maxWidth: 720, margin: '0 auto', padding: '28px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
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
  message: { textAlign: 'center', color: '#888', padding: 40 },
  filterRow: { display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' },
  filterToggle: {
    padding: '8px 16px', background: '#fff', color: '#555', border: '1px solid #ddd',
    borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  filterToggleActive: {
    padding: '8px 16px', background: '#1f4d1f', color: '#fff', border: '1px solid #1f4d1f',
    borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  filterSelect: {
    padding: '8px 14px', background: '#fff', color: '#333', border: '1px solid #ddd',
    borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    outline: 'none',
  },
  errorMsg: { textAlign: 'center', color: '#cc0000', padding: 20 },
  emptyBox: { textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc' },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#888' },
  notifCard: {
    display: 'flex', gap: 14, background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc',
    padding: 16, marginBottom: 10, cursor: 'pointer',
  },
  notifCardUnread: {
    display: 'flex', gap: 14, background: '#f0f7ec', borderRadius: 10, border: '1px solid #c5ddb8',
    padding: 16, marginBottom: 10, cursor: 'pointer',
  },
  notifTypeTag: {
    flexShrink: 0, fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '4px 8px', height: 'fit-content',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  notifBody: { flex: 1, minWidth: 0 },
  notifTitleRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: 700, color: '#111' },
  unreadDot: { width: 8, height: 8, borderRadius: '50%', background: '#cc0000', flexShrink: 0 },
  notifMessage: { fontSize: 13, color: '#555', marginBottom: 6, lineHeight: 1.5 },
  notifDate: { fontSize: 11, color: '#aaa' },
  deleteBtn: {
    background: 'none', border: 'none', color: '#aaa', fontSize: 15, cursor: 'pointer',
    padding: '4px 6px', flexShrink: 0, alignSelf: 'flex-start', fontFamily: 'inherit',
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
