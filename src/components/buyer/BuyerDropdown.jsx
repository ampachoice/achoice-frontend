import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// BuyerDropdown — drop this into any buyer page navbar
//
// Usage:
//   import BuyerDropdown from '../../components/buyer/BuyerDropdown';
//   <BuyerDropdown />
//
// Optional props:
//   cartCount  — number shown on cart badge (default 0)
//   onLogout   — custom logout handler (default: clears localStorage + /login)
// ─────────────────────────────────────────────────────────────────────────────

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
  ];

  if (!user) {
    // Not logged in — show sign in / register buttons
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
            style={s.logoutItem}
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
  // Fixed to the viewport corner — this is deliberate: it guarantees the
  // account menu always renders in the same top-right spot on every page,
  // regardless of that page's own nav layout, padding, or overflow issues.
  wrapper: {
    position: "fixed",
    top: 12,
    right: 14,
    zIndex: 2000,
  },

  trigger: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#1f4d1f",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 99,
    padding: "5px 12px 5px 5px",
    cursor: "pointer",
    userSelect: "none",
    boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
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
  triggerInfo: {},
  triggerName: { fontSize: 13, fontWeight: 600, color: "#fff" },
  chevron: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    transition: "transform 0.2s",
  },

  menu: {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8e4dc",
    boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
    minWidth: 230,
    maxWidth: "calc(100vw - 28px)",
    zIndex: 2000,
    overflow: "hidden",
  },
  menuHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    background: "#f7f5f0",
  },
  menuAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#1f4d1f",
    color: "#f0c050",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 15,
    flexShrink: 0,
  },
  menuName: { fontSize: 14, fontWeight: 600, color: "#111" },
  menuEmail: { fontSize: 11, color: "#888", marginTop: 2 },
  divider: { height: 1, background: "#f0ece4" },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 16px",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  menuIcon: { fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 },
  menuLabel: { fontSize: 14, color: "#333", flex: 1 },
  menuBadge: {
    background: "#f0c050",
    color: "#1a1a1a",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: 99,
  },
  logoutItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 16px",
    cursor: "pointer",
    transition: "background 0.15s",
  },

  // Not-logged-in state
  authRow: { display: "flex", gap: 10 },
  btnOutline: {
    padding: "8px 16px",
    border: "1px solid rgba(255,255,255,0.5)",
    color: "#fff",
    borderRadius: 6,
    fontSize: 13,
    background: "transparent",
    cursor: "pointer",
  },
  btnSolid: {
    padding: "8px 16px",
    background: "#f0c050",
    color: "#1a3d1a",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};
