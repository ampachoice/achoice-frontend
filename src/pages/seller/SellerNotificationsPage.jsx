import { useState, useEffect } from "react";
import SellerLayout from "../../components/seller/SellerLayout";
import api from "../../services/api";

const typeIcon = (type) => {
  switch (type) {
    case "order": return "🛒";
    case "product": return "📦";
    case "payment": return "💰";
    case "review": return "⭐";
    default: return "🔔";
  }
};

export default function SellerNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = (pageNum = 1) => {
    setLoading(true);
    api.get("/notifications", { params: { page: pageNum } })
      .then((res) => {
        const pData = res.data;
        const data = pData?.data || pData || [];
        setNotifications(Array.isArray(data) ? data : []);
        if (pData?.meta || pData?.last_page) setMeta(pData.meta || pData);
        setPage(pData?.current_page || pageNum);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const handleClickNotification = (notification) => {
    if (!notification.is_read) {
      api.patch(`/notifications/${notification.id}/read`).catch(() => {});
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // no-op — a stale unread flag isn't worth blocking the page over
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <SellerLayout
      title="Notifications"
      headerActions={
        unreadCount > 0 && (
          <button style={s.markAllBtn} onClick={handleMarkAllRead} disabled={markingAll}>
            {markingAll ? "Marking..." : `Mark all ${unreadCount} as read`}
          </button>
        )
      }
    >
      {loading ? (
        <div style={s.emptyState}>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div style={s.emptyState}>No notifications yet.</div>
      ) : (
        <div style={s.list}>
          {notifications.map((n) => (
            <div key={n.id} style={n.is_read ? s.card : s.cardUnread} onClick={() => handleClickNotification(n)}>
              <div style={s.icon}>{typeIcon(n.type)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.titleRow}>
                  <div style={s.title}>{n.title}</div>
                  {!n.is_read && <span style={s.dot} />}
                </div>
                <div style={s.message}>{n.message}</div>
                <div style={s.date}>{new Date(n.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div style={s.pagination}>
          <button style={s.pageBtn} disabled={page <= 1} onClick={() => fetchNotifications(page - 1)}>← Prev</button>
          <span style={{ fontSize: 12.5, color: "#666" }}>Page {meta.current_page} of {meta.last_page}</span>
          <button style={s.pageBtn} disabled={page >= meta.last_page} onClick={() => fetchNotifications(page + 1)}>Next →</button>
        </div>
      )}
    </SellerLayout>
  );
}

const s = {
  markAllBtn: { padding: "10px 18px", background: "#1f4d1f", color: "#fff", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  emptyState: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: 48, textAlign: "center", color: "#888", fontSize: 14 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: { display: "flex", gap: 14, background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: "14px 16px", cursor: "pointer" },
  cardUnread: { display: "flex", gap: 14, background: "#f7fbf7", border: "1px solid #cfe8cf", borderRadius: 10, padding: "14px 16px", cursor: "pointer" },
  icon: { fontSize: 20, flexShrink: 0 },
  titleRow: { display: "flex", alignItems: "center", gap: 8 },
  title: { fontSize: 13.5, fontWeight: 700, color: "#111" },
  dot: { width: 7, height: 7, borderRadius: "50%", background: "#1f4d1f" },
  message: { fontSize: 13, color: "#555", margin: "3px 0 5px" },
  date: { fontSize: 11, color: "#aaa" },
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 18 },
  pageBtn: { padding: "8px 16px", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
};
