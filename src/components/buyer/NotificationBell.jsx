import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import api from "../../services/api";

export default function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) return;
    api
      .get("/notifications/unread-count")
      .then((res) => setUnreadCount(res.data.unread_count || 0))
      .catch(() => {});
  }, []);

  return (
    <div
      onClick={() => navigate("/notifications")}
      style={{
        position: "relative",
        cursor: "pointer",
        color: "#fff",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Bell size={22} />
      {unreadCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            background: "#f0c050",
            color: "#1a3d1a",
            fontSize: 10,
            fontWeight: 700,
            width: 18,
            height: 18,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #1f4d1f",
          }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </div>
  );
}
