import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import BuyerDropdown from '../../components/buyer/BuyerDropdown';

const LOGO_PATH = '/achoice logo.png';

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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchNotifications = (pageNum = 1) => {
    setLoading(true);
    setError(null);
    api.get('/notifications', { params: { page: pageNum } })
      .then((res) => {
        const pData = res.data;
        const data = pData?.data || pData || [];
        setNotifications(Array.isArray(data) ? data : []);
        if (pData?.meta || pData?.last_page) setMeta(pData.meta || pData);
        setPage(pData?.current_page || pageNum);
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

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await api.patch(`/notifications/${notification.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
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
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast('All notifications marked as read.');
    } catch {
      showToast('Failed to mark all as read. Please try again.');
    } finally {
      setMarkingAll(false);
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

  const typeIcon = (type) =>
    ({
      order_delivered: 'Delivered',
      order_confirmed: 'Confirmed',
      payment_collected: 'Payment',
      loan_approved: 'Loan',
      loan_rejected: 'Loan',
      complaint_reply: 'Complaint',
    }[type] || 'Notice');

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      <nav style={s.nav}>
        <div style={s.navLeft} onClick={() => navigate('/')}>
          <img src={LOGO_PATH} alt="Achoice" style={s.navLogo} />
          <div style={s.navName}>ACHOICE</div>
        </div>
        <div style={s.navRight}>
          <div style={s.cartBtn} onClick={() => navigate('/cart')}>
            Cart
            {cartCount > 0 && <span style={s.cartBadge}>{cartCount}</span>}
          </div>
          <BuyerDropdown cartCount={cartCount} />
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

        {loading && <p style={s.message}>Loading notifications...</p>}
        {error && <p style={s.errorMsg}>{error}</p>}

        {!loading && !error && notifications.length === 0 && (
          <div style={s.emptyBox}>
            <div style={s.emptyTitle}>No notifications yet</div>
            <p style={s.emptyText}>
              You'll see updates about your orders, loans and complaints here.
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
              <div style={s.notifTypeTag}>{typeIcon(n.type)}</div>
              <div style={s.notifBody}>
                <div style={s.notifTitleRow}>
                  <div style={s.notifTitle}>{n.title}</div>
                  {!n.is_read && <span style={s.unreadDot} />}
                </div>
                <div style={s.notifMessage}>{n.message}</div>
                <div style={s.notifDate}>{fmtDate(n.created_at)}</div>
              </div>
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
    flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#1f4d1f', background: '#eafaf0',
    border: '1px solid #a8d5a8', borderRadius: 6, padding: '4px 8px', height: 'fit-content',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  notifBody: { flex: 1, minWidth: 0 },
  notifTitleRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: 700, color: '#111' },
  unreadDot: { width: 8, height: 8, borderRadius: '50%', background: '#cc0000', flexShrink: 0 },
  notifMessage: { fontSize: 13, color: '#555', marginBottom: 6, lineHeight: 1.5 },
  notifDate: { fontSize: 11, color: '#aaa' },
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
