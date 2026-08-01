import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import StaffLayout from "../../layouts/StaffLayout";

const TYPE_META = {
  broadcast: { label: "Announcement", bg: "#eef0ff", color: "#3a3aa8" },
  new_order: { label: "New Order", bg: "#eafaf0", color: "#1a7a3a" },
  low_stock: { label: "Low Stock", bg: "#fff8e7", color: "#b36b00" },
  product_approved: { label: "Approved", bg: "#eafaf0", color: "#1a7a3a" },
  product_rejected: { label: "Rejected", bg: "#fff0f0", color: "#cc0000" },
  loan_approved: { label: "Loan Approved", bg: "#eafaf0", color: "#1a7a3a" },
  loan_rejected: { label: "Loan Rejected", bg: "#fff0f0", color: "#cc0000" },
  loan_disbursed: { label: "Loan Disbursed", bg: "#e7f0ff", color: "#1a4fa0" },
  repayment_due: { label: "Payment Due", bg: "#fff8e7", color: "#b36b00" },
  repayment_overdue: { label: "Overdue", bg: "#fff0f0", color: "#cc0000" },
  repayment_confirmed: { label: "Payment", bg: "#eafaf0", color: "#1a7a3a" },
  order_confirmed: { label: "Confirmed", bg: "#e7f0ff", color: "#1a4fa0" },
  order_shipped: { label: "Shipped", bg: "#eee6fb", color: "#5a1aa8" },
  order_delivered: { label: "Delivered", bg: "#eafaf0", color: "#1a7a3a" },
  general: { label: "Notice", bg: "#f0f0f0", color: "#555" },
  complaint_reply: { label: "Complaint", bg: "#fff8e7", color: "#b36b00" },
};
const typeMeta = (type) => TYPE_META[type] || { label: "Notice", bg: "#f0f0f0", color: "#555" };

export default function StaffNotificationsPage() {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchNotifications = (pageNum = 1, filters = {}) => {
    const activeUnreadOnly = filters.unreadOnly ?? unreadOnly;
    setLoading(true);
    api.get("/inbox", { params: { page: pageNum, ...(activeUnreadOnly && { unread: true }) } })
      .then((res) => {
        const pData = res.data?.notifications || {};
        setNotifications(Array.isArray(pData.data) ? pData.data : []);
        setMeta(pData);
      })
      .catch(() => showToast("Failed to load notifications."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(1); }, []);

  const handleToggleUnreadOnly = () => {
    const next = !unreadOnly;
    setUnreadOnly(next);
    fetchNotifications(1, { unreadOnly: next });
  };

  const handleClick = async (n) => {
    if (!n.is_read) {
      try {
        await api.patch(`/inbox/${n.id}/read`);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      } catch {}
    }
    // Staff never follow a notification's action_url into buyer-only routes —
    // this page is the destination, not a relay into /orders, /profile, etc.
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch("/inbox/read-all");
      showToast("All notifications marked as read.");
      fetchNotifications(1);
    } catch {
      showToast("Failed to mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (n, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this notification?")) return;
    setDeletingId(n.id);
    try {
      await api.delete(`/inbox/${n.id}`);
      setNotifications((prev) => prev.filter((x) => x.id !== n.id));
    } catch {
      showToast("Failed to delete this notification.");
    } finally {
      setDeletingId(null);
    }
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <StaffLayout activePath="/staff/notifications" mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen}>
      <style>{`
        .stn-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
        .stn-title { font-size:22px; font-weight:800; color:#1f4d1f; }
        .stn-actions { display:flex; gap:10px; align-items:center; }
        .stn-toggle { padding:8px 14px; border:1.5px solid #ddd; border-radius:99px; font-size:13px; font-weight:600; cursor:pointer; background:#fff; color:#555; }
        .stn-toggle.active { background:#1f4d1f; color:#fff; border-color:#1f4d1f; }
        .stn-mark-btn { padding:9px 16px; background:#1f4d1f; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; }
        .stn-mark-btn:disabled { background:#aaa; cursor:not-allowed; }
        .stn-item { background:#fff; border-radius:10px; padding:16px 20px; margin-bottom:10px; box-shadow:0 1px 6px rgba(0,0,0,.06); cursor:pointer; display:flex; justify-content:space-between; gap:12px; }
        .stn-item.unread { border-left:4px solid #1f4d1f; }
        .stn-badge { font-size:11px; font-weight:600; padding:3px 10px; border-radius:99px; display:inline-block; margin-bottom:6px; }
        .stn-msg-title { font-size:14px; font-weight:700; color:#222; margin-bottom:2px; }
        .stn-msg-body { font-size:13px; color:#555; line-height:1.4; }
        .stn-date { font-size:11px; color:#aaa; margin-top:6px; }
        .stn-del { background:none; border:none; color:#cc0000; font-size:12px; cursor:pointer; white-space:nowrap; }
        .stn-empty, .stn-loading { text-align:center; padding:60px; color:#aaa; font-size:14px; }
        .stn-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#1f4d1f; color:#fff; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:600; z-index:9999; }
      `}</style>

      <div className="stn-header">
        <div className="stn-title">Notifications</div>
        <div className="stn-actions">
          <button className={"stn-toggle" + (unreadOnly ? " active" : "")} onClick={handleToggleUnreadOnly}>
            {unreadOnly ? "Unread only" : "All"}
          </button>
          <button className="stn-mark-btn" onClick={handleMarkAllRead} disabled={markingAll}>
            {markingAll ? "Marking..." : "Mark all as read"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="stn-loading">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="stn-empty">No notifications{unreadOnly ? " (unread)" : ""} yet.</div>
      ) : (
        notifications.map((n) => {
          const meta = typeMeta(n.type);
          return (
            <div key={n.id} className={"stn-item" + (!n.is_read ? " unread" : "")} onClick={() => handleClick(n)}>
              <div>
                <span className="stn-badge" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                <div className="stn-msg-title">{n.title}</div>
                <div className="stn-msg-body">{n.message}</div>
                <div className="stn-date">{fmtDate(n.created_at)}</div>
              </div>
              <button className="stn-del" disabled={deletingId === n.id} onClick={(e) => handleDelete(n, e)}>
                {deletingId === n.id ? "..." : "Delete"}
              </button>
            </div>
          );
        })
      )}

      {toast && <div className="stn-toast">{toast}</div>}
    </StaffLayout>
  );
}
