import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ──────────────────────────────────────────────────────────────────────────
// BuyerDropdown — drop this into any buyer page navbar
//
// Usage:
//   import BuyerDropdown from '../../components/buyer/BuyerDropdown';
//   <BuyerDropdown />
//
// Optional props:
//   cartCount  — number shown on cart badge (default 0)
//   onLogout   — custom logout handler (default: clears localStorage + /login)
// ──────────────────────────────────────────────────────────────────────────

export default function BuyerDropdown({ cartCount = 0, onLogout }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      localStorage.clear();
      navigate("/login");
    }
  };

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const menuItems = [
    { icon: "👤", label: "My Profile", path: "/profile" },
    {
      icon: "🛒",
      label: "Cart",
      path: "/cart",
      badge: cartCount > 0 ? cartCount : null,
    },
    { icon: "📦", label: "My Orders", path: "/orders" },
    { icon: "💰", label: "Apply for Loan", path: "/loans/apply" },
    { icon: "📋", label: "My Loans", path: "/loans/repay" },
    { icon: "📝", label: "Complaints & Refunds", path: "/complaints" },
    { icon: "🔔", label: "Notifications", path: "/notifications" },
  ];

  if (!user) {
    return (
      <div style={s.authRow}>
        <button style={s.btnOutline} onClick={() => navigate("/login")}>
          Sign In
        </button>
        <button style={s.btnSolid} onClick={() => navigate("/register")}>
          Get Started
        </button>
      </div>
    );
  }

  return (
    <div style={s.wrapper} ref={ref}>
      {/* Trigger button */}
      <div style={s.trigger} onClick={() => setOpen(!open)}>
        <div style={s.avatar}>{initial}</div>
        <div style={s.triggerInfo}>
          <div style={s.triggerName}>{user.name?.split(" ")[0]}</div>
        </div>
        <span
          style={{ ...s.chevron, transform: open ? "rotate(180deg)" : "none" }}
        >
          ▾
        </span>
      </div>

      {/* Dropdown menu */}
      {open && (
        <div style={s.menu}>
          {/* Header */}
          <div style={s.menuHeader}>
            <div style={s.menuAvatar}>{initial}</div>
            <div>
              <div style={s.menuName}>{user.name}</div>
              <div style={s.menuEmail}>{user.email}</div>
            </div>
          </div>
          <div style={s.divider} />

          {/* Menu items */}
          {menuItems.map((item) => (
            <div
              key={item.path}
              style={s.menuItem}
              onClick={() => go(item.path)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f7f5f0")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span style={s.menuIcon}>{item.icon}</span>
              <span style={s.menuLabel}>{item.label}</span>
              {item.badge && <span style={s.menuBadge}>{item.badge}</span>}
            </div>
          ))}

          <div style={s.divider} />

          {/* Logout */}
          <div
            style={s.menuItem}
            onClick={handleLogout}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fff0f0")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <span style={s.menuIcon}>🚪</span>
            <span style={{ ...s.menuLabel, color: "#cc0000" }}>Logout</span>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrapper: { position: "relative" },
  trigger: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 99,
    padding: "5px 12px 5px 5px",
    cursor: "pointer",
    userSelect: "none",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#f0c050",
    color: "#1a3d1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },
  triggerInfo: { display: "flex", flexDirection: "column", gap: 1 },
  triggerName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    lineHeight: 1.2,
  },
  chevron: {
    fontSize: 12,
    color: "#fff",
    transition: "transform 0.2s",
    marginLeft: 2,
  },
  menu: {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    width: 240,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    zIndex: 1000,
    overflow: "hidden",
    border: "1px solid #e8e4dc",
  },
  menuHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    background: "#1f4d1f",
  },
  menuAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#f0c050",
    color: "#1a3d1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  menuName: { fontSize: 13, fontWeight: 700, color: "#fff" },
  menuEmail: { fontSize: 11, color: "#a8d5a8", marginTop: 1 },
  divider: { height: 1, background: "#f0ece4" },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  menuIcon: { fontSize: 16, width: 20, textAlign: "center", flexShrink: 0 },
  menuLabel: { fontSize: 13, color: "#333", flex: 1 },
  menuBadge: {
    background: "#cc0000",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 99,
    padding: "1px 6px",
    flexShrink: 0,
  },
  authRow: { display: "flex", gap: 8, alignItems: "center" },
  btnOutline: {
    padding: "7px 14px",
    border: "1px solid rgba(255,255,255,0.5)",
    borderRadius: 6,
    background: "transparent",
    color: "#fff",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnSolid: {
    padding: "7px 14px",
    border: "none",
    borderRadius: 6,
    background: "#f0c050",
    color: "#1a3d1a",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
