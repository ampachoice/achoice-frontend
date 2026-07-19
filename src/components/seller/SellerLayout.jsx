import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getSellerProfile } from "../../services/sellerService";

const LOGO_PATH = "/achoice logo.png";

const SIDEBAR_ITEMS = [
  { icon: "📊", label: "Dashboard", path: "/seller/dashboard" },
  { icon: "📦", label: "Products", path: "/seller/products" },
  { icon: "🛒", label: "Orders", path: "/seller/orders" },
  { icon: "💰", label: "Finance", path: "/seller/finance" },
  { icon: "⭐", label: "Reviews", path: "/seller/reviews" },
  { icon: "🏪", label: "Store Profile", path: "/seller/profile" },
];

/**
 * Shared seller shell: sidebar + header + the "pending approval" banner.
 * Mirrors AdminLayout's structure so the two feel consistent.
 *
 * Props:
 *  - title, subtitle       header text
 *  - headerActions         optional extra ReactNode next to the header (e.g. "+ Add Product")
 *  - badges                optional map of { "/seller/orders": 2, ... } for sidebar count badges
 *  - children              page content
 */
const MOBILE_BREAKPOINT = 900;

export default function SellerLayout({ title, subtitle, headerActions = null, badges = {}, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Seller status — drives the pending-approval banner and the "Add Product"
  // gate across every seller page, per the Phase 1 requirement.
  const [seller, setSeller] = useState(null);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setMobileNavOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    getSellerProfile()
      .then((res) => setSeller(res.data))
      .catch(() => {});
  }, []);

  const mergedBadges = badges;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const isPending = seller?.status === "pending_approval";
  const isSuspended = seller?.status === "suspended";

  return (
    <div style={s.page}>
      {isMobile && mobileNavOpen && <div style={s.backdrop} onClick={() => setMobileNavOpen(false)} />}

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
            <div style={s.sidebarLogoSub}>Seller Center</div>
          </div>
          {isMobile && (
            <button style={s.sidebarCloseBtn} onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
              ✕
            </button>
          )}
        </div>

        <nav style={s.sidebarNav}>
          {SIDEBAR_ITEMS.map((item) => (
            <div
              key={item.path}
              style={{ ...s.sidebarItem, ...(isActive(item.path) ? s.sidebarItemActive : {}) }}
              onClick={() => {
                navigate(item.path);
                setMobileNavOpen(false);
              }}
            >
              <span style={s.sidebarIcon}>{item.icon}</span> {item.label}
              {mergedBadges[item.path] > 0 && <span style={s.badge}>{mergedBadges[item.path]}</span>}
            </div>
          ))}
        </nav>

        <div style={s.sidebarFooter}>
          <div style={s.sidebarUser}>
            <div style={s.sidebarAvatar}>
              <img src={LOGO_PATH} alt="Seller" style={s.avatarImg} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={s.sidebarUserName}>{seller?.business_name || user.name || "Seller"}</div>
              <div style={s.sidebarUserRole}>
                {isPending ? "Pending Approval" : isSuspended ? "Suspended" : "Seller"}
              </div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ ...s.main, ...(isMobile ? s.mainMobile : {}) }}>
        <div style={{ ...s.header, ...(isMobile ? s.headerMobile : {}) }}>
          {isMobile && (
            <div style={s.mobileTopRow}>
              <button style={s.hamburgerBtn} onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
                ☰
              </button>
            </div>
          )}
          <div style={s.headerTitleCol}>
            <h1 style={{ ...s.headerTitle, ...(isMobile ? s.headerTitleMobile : {}) }}>{title}</h1>
            {subtitle && <p style={s.headerSub}>{subtitle}</p>}
          </div>
          {headerActions && <div style={isMobile ? s.mobileHeaderActions : s.headerRight}>{headerActions}</div>}
        </div>

        {isPending && (
          <div style={s.banner}>
            <span style={{ fontSize: 18 }}>⏳</span>
            <div>
              <div style={{ fontWeight: 700 }}>Your seller account is under review</div>
              <div style={{ fontSize: 12.5, opacity: 0.9 }}>
                Our team is verifying your registration. You'll be able to list products and receive orders once
                your account is approved — this usually doesn't take long.
              </div>
            </div>
          </div>
        )}

        {isSuspended && (
          <div style={{ ...s.banner, background: "#fbe9e9", color: "#a81f1f" }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700 }}>Your seller account is suspended</div>
              <div style={{ fontSize: 12.5, opacity: 0.9 }}>Contact support for details on how to resolve this.</div>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", minHeight: "100vh", backgroundColor: "#f0f2f5", fontFamily: "Arial, sans-serif" },
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
  sidebarMobile: {
    width: "min(280px, 82vw)",
    transform: "translateX(-100%)",
    transition: "transform 0.25s ease",
    boxShadow: "2px 0 16px rgba(0,0,0,0.25)",
  },
  sidebarMobileOpen: { transform: "translateX(0)" },
  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 550 },
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
  sidebarItem: { display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", color: "#a8d5a8", fontSize: 14, cursor: "pointer" },
  sidebarItemActive: { background: "rgba(255,255,255,0.1)", color: "#fff", borderLeft: "4px solid #f0c050" },
  sidebarIcon: { fontSize: 16 },
  badge: { marginLeft: "auto", background: "#cc0000", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 99 },
  sidebarFooter: { padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" },
  sidebarUser: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  sidebarAvatar: { width: 34, height: 34, background: "#fff", borderRadius: "50%", overflow: "hidden", border: "2px solid #f0c050", flexShrink: 0 },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  sidebarUserName: { fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  sidebarUserRole: { fontSize: 11, color: "#a8d5a8" },
  logoutBtn: { width: "100%", padding: 8, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, fontSize: 13, cursor: "pointer" },
  main: { flex: 1, marginLeft: 240, padding: 32, minWidth: 0 },
  mainMobile: { marginLeft: 0, padding: "16px 16px 32px", width: "100%" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 16, flexWrap: "wrap" },
  headerMobile: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 },
  mobileTopRow: { display: "flex", alignItems: "center", width: "100%" },
  mobileHeaderActions: { display: "flex", flexWrap: "wrap", gap: 10 },
  headerTitleCol: { minWidth: 0 },
  hamburgerBtn: { width: 40, height: 40, flexShrink: 0, borderRadius: 10, border: "1px solid #e8e4dc", background: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 24, fontWeight: 700, color: "#111", marginBottom: 4, wordBreak: "break-word" },
  headerTitleMobile: { fontSize: 19, marginBottom: 0 },
  headerSub: { fontSize: 14, color: "#888" },
  headerRight: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" },
  banner: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    background: "#fff8e7",
    color: "#7a5000",
    border: "1px solid #f0c050",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 22,
    fontSize: 13,
  },
};
