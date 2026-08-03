import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../services/api";

const TYPE_ICONS = {
  general: "🔔",
  broadcast: "📢",
  loan_application: "💰",
  repayment_due: "⏳",
  repayment_overdue: "⚠️",
};

export default function AdminNotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadNotifications = useCallback(() => {
    setLoading(true);
    const params = { per_page: 50 };
    if (unreadOnly) params.unread = "true";
    api
      .get("/inbox", { params })
      .then((res) => setNotifications(res.data?.notifications?.data || []))
      .catch(() => showToast("Failed to load notifications."))
      .finally(() => setLoading(false));
  }, [unreadOnly]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleClick = (n) => {
    if (!n.is_read) {
      api.patch(`/inbox/${n.id}/read`).catch(() => {});
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
      );
    }
    if (n.action_url) navigate(n.action_url);
  };

  const handleMarkAllRead = () => {
    api
      .patch("/inbox/read-all")
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        showToast("All marked as read.");
      })
      .catch(() => showToast("Failed to mark all as read."));
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this notification?")) return;
    api
      .delete(`/inbox/${id}`)
      .then(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        showToast("Deleted.");
      })
      .catch(() => showToast("Failed to delete."));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AdminLayout
      title="Notifications"
      subtitle="Loan status changes, broadcasts, and system alerts."
      headerActions={
        <button style={s.markAllBtn} onClick={handleMarkAllRead}>
          Mark all as read
        </button>
      }
    >
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.filterRow}>
        <button
          style={!unreadOnly ? s.filterBtnActive : s.filterBtn}
          onClick={() => setUnreadOnly(false)}
        >
          All
        </button>
        <button
          style={unreadOnly ? s.filterBtnActive : s.filterBtn}
          onClick={() => setUnreadOnly(true)}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {loading ? (
        <div style={s.emptyState}>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div style={s.emptyState}>
          {unreadOnly ? "No unread notifications." : "No notifications yet."}
        </div>
      ) : (
        <div style={s.list}>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                ...s.card,
                ...(n.is_read ? {} : s.cardUnread),
                cursor: n.action_url ? "pointer" : "default",
              }}
              onClick={() => handleClick(n)}
            >
              <div style={s.cardIcon}>{TYPE_ICONS[n.type] || "🔔"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.cardTitleRow}>
                  <div style={s.cardTitle}>{n.title}</div>
                  {!n.is_read && <span style={s.dot} />}
                </div>
                <div style={s.cardMessage}>{n.message}</div>
                <div style={s.cardTime}>
                  {n.created_at
                    ? new Date(n.created_at).toLocaleString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : ""}
                </div>
              </div>
              <button
                style={s.deleteBtn}
                onClick={(e) => handleDelete(e, n.id)}
                aria-label="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

const s = {
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    background: "#1f4d1f",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 8,
    fontSize: 13,
    zIndex: 999,
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  },
  markAllBtn: {
    padding: "10px 18px",
    background: "#fff",
    color: "#1f4d1f",
    border: "1.5px solid #1f4d1f",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  filterRow: { display: "flex", gap: 8, marginBottom: 18 },
  filterBtn: {
    padding: "8px 16px",
    background: "#fff",
    color: "#555",
    border: "1.5px solid #e8e4dc",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  filterBtnActive: {
    padding: "8px 16px",
    background: "#1f4d1f",
    color: "#fff",
    border: "1.5px solid #1f4d1f",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  emptyState: {
    background: "#fff",
    border: "1px solid #e8e4dc",
    borderRadius: 10,
    padding: 48,
    textAlign: "center",
    color: "#888",
    fontSize: 14,
  },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    background: "#fff",
    border: "1px solid #e8e4dc",
    borderRadius: 10,
    padding: "16px 18px",
  },
  cardUnread: {
    background: "#f7fbf5",
    borderColor: "#c8e6c0",
  },
  cardIcon: { fontSize: 20, flexShrink: 0, marginTop: 2 },
  cardTitleRow: { display: "flex", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: "#111" },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#cc0000",
    flexShrink: 0,
  },
  cardMessage: { fontSize: 13, color: "#555", marginTop: 4, lineHeight: 1.5 },
  cardTime: { fontSize: 11.5, color: "#aaa", marginTop: 6 },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#bbb",
    fontSize: 14,
    cursor: "pointer",
    padding: 4,
    flexShrink: 0,
  },
};
