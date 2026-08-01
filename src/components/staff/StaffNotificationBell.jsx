import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function StaffNotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.get("/inbox/unread-count")
      .then((res) => {
        if (!cancelled) setUnreadCount(res.data?.unread_count ?? res.data?.count ?? 0);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <style>{`
        .stnb-bell { position:relative; display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:10px; border:1px solid #e8e4dc; background:#fff; font-size:18px; cursor:pointer; }
        .stnb-badge { position:absolute; top:-4px; right:-4px; background:#cc0000; color:#fff; font-size:10px; font-weight:700; min-width:16px; height:16px; border-radius:99px; display:flex; align-items:center; justify-content:center; padding:0 3px; }
      `}</style>
      <button
        className="stnb-bell"
        onClick={() => navigate("/staff/notifications")}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="stnb-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>
    </>
  );
}
