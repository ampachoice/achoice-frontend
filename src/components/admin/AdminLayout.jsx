import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";

const LOGO_PATH = "/achoice logo.png";

// Core, frequently-used nav — stays in the sidebar
const SIDEBAR_ITEMS = [
  { icon: "📊", label: "Dashboard", path: "/admin/dashboard" },
  { icon: "👤", label: "Buyers", path: "/admin/buyers" },
  { icon: "📋", label: "Complaints", path: "/admin/complaints" },
  { icon: "🏪", label: "Sellers", path: "/admin/sellers" },
  { icon: "🌾", label: "Products", path: "/admin/products" },
  { icon: "📦", label: "Orders", path: "/admin/orders" },
  { icon: "💰", label: "Loans", path: "/admin/loans" },
  { icon: "👥", label: "Staff", path: "/admin/staff" },
];

// Configuration / setup items — moved into the top-right Settings dropdown
const SETTINGS_ITEMS = [
  { icon: "💳", label: "Payments", path: "/admin/payments" },
  { icon: "⚙️", label: "Loan Settings", path: "/admin/loan-settings" },
  { icon: "🚚", label: "Delivery Zones", path: "/admin/delivery-zones" },
  { icon: "📈", label: "Reports", path: "/admin/reports" },
  { icon: "⚙️", label: "Site Settings", path: "/admin/settings" },
];

/**
 * Shared admin shell: sidebar + header.
 *
 * Props:
 *  - title, subtitle       header text
 *  - showDate              show today's formatted date on the right of the header
 *  - headerActions         optional extra ReactNode rendered next to the settings gear
 *                          (e.g. a page-specific "+ Add Seller" button)
 *  - badges                optional map of { "/admin/loans": 2, ... } for sidebar count badges
 *  - children               page content
 */
const MOBILE_BREAKPOINT = 900;

export default function AdminLayout({
  title,
  subtitle,
  showDate = false,
  headerActions = null,
  badges = {},
  children,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const [autoBadges, setAutoBadges] = useState({});
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.innerWidth <= MOBILE_BREAKPOINT,
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setMobileNavOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close the mobile drawer whenever the route changes (e.g. after nav click)
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    // Dashboard endpoint already returns pending orders + pending loans in one call
    api
      .get("/admin/dashboard")
      .then((res) => {
        setAutoBadges((prev) => ({
          ...prev,
          "/admin/orders": res.data?.overview?.pending_orders,
          "/admin/loans": res.data?.loans?.pending_applications,
        }));
      })
      .catch(() => {});

    // No dedicated count endpoint for complaints — read the "total" from a
    // filtered, paginated fetch instead of pulling every complaint down
    api
      .get("/admin/complaints", { params: { status: "pending" } })
      .then((res) => {
        setAutoBadges((prev) => ({
          ...prev,
          "/admin/complaints": res.data?.total,
        }));
      })
      .catch(() => {});
  }, []);

  const mergedBadges = { ...autoBadges, ...badges };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin");
  };

  const isActive = (path) => location.pathname === path;
  const isSettingsActive = SETTINGS_ITEMS.some((item) =>
    isActive(item.path),
  );

  const dateNode = showDate ? (
    <div style={s.headerDate}>
      {new Date().toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
    </div>
  ) : null;

  const settingsMenu = (
    <div style={s.settingsWrap} ref={settingsRef}>
      <button
        style={{
          ...s.settingsBtn,
          ...(isSettingsActive ? s.settingsBtnActive : {}),
        }}
        onClick={() => setSettingsOpen((v) => !v)}
        title="Settings"
      >
        ⚙️
      </button>

      {settingsOpen && (
        <div style={s.settingsDropdown}>
          {SETTINGS_ITEMS.map((item) => (
            <div
              key={item.path}
              style={{
                ...s.settingsDropdownItem,
                ...(isActive(item.path) ? s.settingsDropdownItemActive : {}),
              }}
              onClick={() => {
                setSettingsOpen(false);
                navigate(item.path);
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={s.page}>
      {/* Dimmed backdrop behind the drawer, mobile only */}
      {isMobile && mobileNavOpen && (
        <div style={s.backdrop} onClick={() => setMobileNavOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        style={{
          ...s.sidebar,
          ...(isMobile ? s.sidebarMobile : {}),
          ...(isMobile && mobileNavOpen ? s.sidebarMobileOpen : {}),
        }}
      >
        <div style={s.sidebarLogo}>
          <img src={LOGO_PATH} alt="Logo" style={s.sidebarLogoImg} />
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Admin Panel</div>
          </div>
          {isMobile && (
            <button
              style={s.sidebarCloseBtn}
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          )}
        </div>

        <nav style={s.sidebarNav}>
          {SIDEBAR_ITEMS.map((item) => (
            <div
              key={item.path}
              style={{
                ...s.sidebarItem,
                ...(isActive(item.path) ? s.sidebarItemActive : {}),
              }}
              onClick={() => {
                navigate(item.path);
                setMobileNavOpen(false);
              }}
            >
              <span style={s.sidebarIcon}>{item.icon}</span> {item.label}
              {mergedBadges[item.path] > 0 && (
                <span style={s.badge}>{mergedBadges[item.path]}</span>
              )}
            </div>
          ))}
        </nav>

        <div style={s.sidebarFooter}>
          <div style={s.sidebarUser}>
            <div style={s.sidebarAvatar}>
              <img src={LOGO_PATH} alt="Admin" style={s.avatarImg} />
            </div>
            <div>
              <div style={s.sidebarUserName}>{user.name || "Admin"}</div>
              <div style={s.sidebarUserRole}>Administrator</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ ...s.main, ...(isMobile ? s.mainMobile : {}) }}>
        <div
          style={{ ...s.header, ...(isMobile ? s.headerMobile : {}) }}
        >
          {isMobile ? (
            <>
              {/* Row 1: hamburger (left) + settings gear (right) */}
              <div style={s.mobileTopRow}>
                <button
                  style={s.hamburgerBtn}
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open menu"
                >
                  ☰
                </button>
                {settingsMenu}
              </div>

              {/* Row 2: title + subtitle + date, left aligned */}
              <div style={s.mobileTitleBlock}>
                <h1 style={{ ...s.headerTitle, ...s.headerTitleMobile }}>
                  {title}
                </h1>
                {subtitle && <p style={s.headerSub}>{subtitle}</p>}
                {dateNode}
              </div>

              {/* Row 3: page-specific action button(s), own row */}
              {headerActions && (
                <div style={s.mobileHeaderActions}>{headerActions}</div>
              )}
            </>
          ) : (
            <>
              <div style={s.headerTitleCol}>
                <h1 style={s.headerTitle}>{title}</h1>
                {subtitle && <p style={s.headerSub}>{subtitle}</p>}
              </div>

              <div style={s.headerRight}>
                {dateNode}
                {headerActions}
                {settingsMenu}
              </div>
            </>
          )}
        </div>

        {children}
      </div>
    </div>

  );
}

const s = {
  page: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: 240,
    background: "#1f4d1f",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    overflowY: "auto",
    zIndex: 600,
  },
  // On mobile the sidebar becomes an off-canvas drawer, hidden by default
  sidebarMobile: {
    width: "min(280px, 82vw)",
    transform: "translateX(-100%)",
    transition: "transform 0.25s ease",
    boxShadow: "2px 0 16px rgba(0,0,0,0.25)",
  },
  sidebarMobileOpen: {
    transform: "translateX(0)",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 550,
  },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 20,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    position: "relative",
  },
  sidebarCloseBtn: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
    padding: 4,
    lineHeight: 1,
  },
  sidebarLogoImg: { width: 40, height: 40, objectFit: "contain" },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: "#fff" },
  sidebarLogoSub: { fontSize: 10, color: "#a8d5a8", marginTop: 1 },
  sidebarNav: { flex: 1, padding: "16px 0" },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 20px",
    color: "#a8d5a8",
    fontSize: 14,
    cursor: "pointer",
  },
  sidebarItemActive: {
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderLeft: "4px solid #f0c050",
  },
  sidebarIcon: { fontSize: 16 },
  badge: {
    marginLeft: "auto",
    background: "#cc0000",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 99,
  },
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  sidebarUser: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sidebarAvatar: {
    width: 34,
    height: 34,
    background: "#fff",
    borderRadius: "50%",
    overflow: "hidden",
    border: "2px solid #f0c050",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  sidebarUserName: { fontSize: 13, fontWeight: 600, color: "#fff" },
  sidebarUserRole: { fontSize: 11, color: "#a8d5a8" },
  logoutBtn: {
    width: "100%",
    padding: 8,
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
  },
  main: { flex: 1, marginLeft: 240, padding: 32, minWidth: 0 },
  mainMobile: { marginLeft: 0, padding: "16px 16px 32px", width: "100%" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 16,
    flexWrap: "wrap",
  },
  headerMobile: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 20,
  },
  mobileTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  mobileTitleBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  mobileHeaderActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  headerTitleRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    minWidth: 0,
  },
  headerTitleCol: { minWidth: 0 },
  hamburgerBtn: {
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    background: "#fff",
    fontSize: 18,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#111",
    marginBottom: 4,
    wordBreak: "break-word",
  },
  headerTitleMobile: {
    fontSize: 19,
    marginBottom: 0,
  },
  headerSub: { fontSize: 14, color: "#888" },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  headerDate: { fontSize: 13, color: "#888", whiteSpace: "nowrap" },
  settingsWrap: { position: "relative" },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    background: "#fff",
    fontSize: 18,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsBtnActive: {
    background: "#1f4d1f",
    borderColor: "#1f4d1f",
  },
  settingsDropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    width: 210,
    padding: 6,
    zIndex: 500,
  },
  settingsDropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 7,
    fontSize: 13,
    color: "#333",
    cursor: "pointer",
  },
  settingsDropdownItemActive: {
    background: "#f0f7ec",
    color: "#1f4d1f",
    fontWeight: 700,
  },
};
