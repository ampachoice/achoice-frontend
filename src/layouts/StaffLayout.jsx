import { useNavigate } from "react-router-dom";
import StaffNotificationBell from "../components/staff/StaffNotificationBell";

const LOGO_PATH = "/achoice logo.png";

// The one place staff nav items are defined. Add a new staff page here and
// every page using StaffLayout picks it up automatically — no more copying
// the sidebar markup into each new page file.
function getNavItems(user, activePath) {
  const items = [];

  if (user?.can_manage_agro) {
    items.push({ icon: "📊", label: "Agro Dashboard", path: "/staff/agro" });
    items.push({ icon: "✅", label: "Product Approvals", path: "/staff/agro/product-approvals" });
  }
  if (user?.can_manage_loans) {
    items.push({ icon: "💰", label: "Loan Dashboard", path: "/staff/loans" });
  }

  items.push({ icon: "📋", label: "Complaints", path: "/staff/complaints" });
  items.push({ icon: "🔔", label: "Notifications", path: "/staff/notifications" });

  return items.map((item) => ({
    ...item,
    active: activePath === item.path || activePath?.startsWith(item.path + "/"),
  }));
}

// Where the logo/brand should send staff — their own home, never "/".
function getStaffHome(user) {
  if (user?.can_manage_agro) return "/staff/agro";
  if (user?.can_manage_loans) return "/staff/loans";
  return "/staff/complaints";
}

export default function StaffLayout({ activePath, children, mobileNavOpen, setMobileNavOpen }) {
  const navigate = useNavigate();

  let user = null;
  try { user = JSON.parse(localStorage.getItem("user")); } catch {}

  const navItems = getNavItems(user, activePath);
  const staffHome = getStaffHome(user);

  return (
    <>
      <style>{`
        .stl-shell { display:flex; min-height:100vh; background:#f0f2f5; font-family:'Segoe UI',sans-serif; }
        .stl-sidebar { width:240px; background:#1f4d1f; display:flex; flex-direction:column; position:fixed; top:0; left:0; height:100vh; }
        .stl-sidebar-logo { display:flex; align-items:center; gap:10px; padding:20px; border-bottom:1px solid rgba(255,255,255,0.1); cursor:pointer; }
        .stl-sidebar-logo img { width:40px; height:40px; object-fit:contain; }
        .stl-sidebar-name { font-size:14px; font-weight:700; color:#fff; }
        .stl-sidebar-sub { font-size:10px; color:#a8d5a8; }
        .stl-sidebar-nav { flex:1; padding:16px 0; }
        .stl-sidebar-item { display:flex; align-items:center; gap:10px; padding:12px 20px; color:#a8d5a8; font-size:14px; cursor:pointer; }
        .stl-sidebar-item-active { background:rgba(255,255,255,0.15); color:#fff; border-left:3px solid #f0c050; }
        .stl-sidebar-footer { padding:16px 20px; border-top:1px solid rgba(255,255,255,0.1); }
        .stl-staff-name { font-size:13px; font-weight:600; color:#fff; margin-bottom:2px; }
        .stl-staff-role { font-size:11px; color:#a8d5a8; margin-bottom:10px; }
        .stl-logout-btn { width:100%; padding:8px; background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; font-size:13px; cursor:pointer; font-family:inherit; }
        .stl-main { flex:1; margin-left:240px; padding:28px 32px; }
        .stl-topbar { display:flex; justify-content:flex-end; margin-bottom:16px; }
        .stl-hamburger { display:none; }
        .stl-backdrop { display:none; }
        .stl-sidebar-close { display:none; }
        @media(max-width:700px) {
          .stl-main { padding:16px; margin-left:0; }
          .stl-sidebar {
            width:min(280px,82vw);
            transform:translateX(-100%);
            transition:transform 0.25s ease;
            box-shadow:2px 0 16px rgba(0,0,0,0.25);
            z-index:600;
          }
          .stl-sidebar.stl-sidebar-open { transform:translateX(0); }
          .stl-hamburger {
            display:flex; align-items:center; justify-content:center;
            width:40px; height:40px; border-radius:10px; border:1px solid #e8e4dc;
            background:#fff; font-size:18px; cursor:pointer; flex-shrink:0;
          }
          .stl-backdrop.stl-backdrop-open {
            display:block; position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:550;
          }
          .stl-sidebar-close { display:block; margin-left:auto; background:none; border:none; color:#fff; font-size:18px; cursor:pointer; }
          .stl-topbar { justify-content:space-between; }
        }
      `}</style>

      <div className="stl-shell">
        {mobileNavOpen && (
          <div className="stl-backdrop stl-backdrop-open" onClick={() => setMobileNavOpen(false)} />
        )}
        <div className={"stl-sidebar" + (mobileNavOpen ? " stl-sidebar-open" : "")}>
          <div className="stl-sidebar-logo" onClick={() => { navigate(staffHome); setMobileNavOpen?.(false); }}>
            <img src={LOGO_PATH} alt="Achoice" />
            <div>
              <div className="stl-sidebar-name">ACHOICE</div>
              <div className="stl-sidebar-sub">Staff Panel</div>
            </div>
            <button
              className="stl-sidebar-close"
              onClick={(e) => { e.stopPropagation(); setMobileNavOpen?.(false); }}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
          <nav className="stl-sidebar-nav">
            {navItems.map((item) => (
              <div
                key={item.path}
                className={"stl-sidebar-item" + (item.active ? " stl-sidebar-item-active" : "")}
                onClick={() => { navigate(item.path); setMobileNavOpen?.(false); }}
              >
                <span>{item.icon}</span> {item.label}
              </div>
            ))}
          </nav>
          <div className="stl-sidebar-footer">
            <div className="stl-staff-name">{user?.name}</div>
            <div className="stl-staff-role">Staff</div>
            <button
              className="stl-logout-btn"
              onClick={() => { localStorage.clear(); navigate("/login"); }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="stl-main">
          <div className="stl-topbar">
            <button className="stl-hamburger" onClick={() => setMobileNavOpen?.(true)} aria-label="Open menu">☰</button>
            <StaffNotificationBell />
          </div>

          {children}
        </div>
      </div>
    </>
  );
}
