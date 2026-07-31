import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

// ─────────────────────────────────────────────────────────────────────────────
// CategorySidebar — persistent left nav for Categories + "Our Service"
// (Loans / Contact Us), shown only on the Homepage and Product listing page.
//
// Desktop (>900px): a sticky <aside> alongside the page's main content column.
// Mobile (≤900px): the aside is hidden and replaced by a fixed trigger button
// pinned to the TOP-LEFT, opening a slide-in drawer from the left. This is
// deliberately offset below the page's own sticky nav bar (not glued to the
// very top of the viewport) so it never overlaps that nav's logo — the exact
// collision MobileNavDrawer's top-right hamburger had to be positioned
// carefully to avoid. The existing top-right hamburger (account/menu nav)
// is untouched; this is a second, independent trigger on the opposite side.
//
// Usage:
//   import CategorySidebar from '../../components/buyer/CategorySidebar';
//   <CategorySidebar
//     onLoansClick={() => scrollToSection('loans')}      // optional
//     onContactClick={() => scrollToSection('contact')}  // optional
//   />
// If onLoansClick / onContactClick aren't passed, they default to navigating
// to /loans/apply and /pages/live-chat-support (the Content Pages route).
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
  .cs-aside { display: block; }
  @media (max-width: 900px) {
    .cs-aside { display: none; }
  }
  .cs-trigger { display: none; }
  @media (max-width: 900px) {
    .cs-trigger {
      display: flex;
      position: fixed;
      /* Offset below the page's own sticky nav bar (~56-60px tall on every
         buyer page) rather than pinned to the very top of the viewport —
         sitting at top:12px would float directly over that nav's logo. */
      top: 70px;
      left: 14px;
      z-index: 2100;
    }
  }
  .cs-cat-row:hover { background: #f7f5f0; }
  .cs-sub-row:hover { background: #f0ece0; }
  .cs-service-row:hover { background: #143a14; }
`;

export default function CategorySidebar({
  onLoansClick,
  onContactClick,
  loansSubtext = "Farm financing in 24hrs",
  contactSubtext = "Get help & support",
}) {
  const navigate = useNavigate();
  const [categoryTree, setCategoryTree] = useState([]);
  const [expandedCat, setExpandedCat] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    api
      .get("/categories")
      .then((r) => setCategoryTree(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const goToCategory = (slug) => {
    setDrawerOpen(false);
    navigate(`/products?category=${slug}`);
  };

  const handleLoansClick = () => {
    setDrawerOpen(false);
    if (onLoansClick) onLoansClick();
    else navigate("/loans/apply");
  };

  const handleContactClick = () => {
    setDrawerOpen(false);
    if (onContactClick) onContactClick();
    else navigate("/pages/live-chat-support");
  };

  // Shared content — rendered once for the desktop aside, once for the
  // mobile drawer (only one is ever visible at a time per the CSS above).
  const Content = () => (
    <>
      <div style={s.header}>Categories</div>
      <div style={s.catList}>
        {categoryTree.map((cat) => {
          const hasSubs = cat.subcategories && cat.subcategories.length > 0;
          const isOpen = expandedCat === cat.id;
          return (
            <div key={cat.id || cat.slug}>
              <div
                className="cs-cat-row"
                style={s.catRow}
                onClick={() => goToCategory(cat.slug)}
              >
                <span style={{ marginRight: 8 }}>{cat.icon || "🌾"}</span>
                <span style={{ flex: 1 }}>{cat.name}</span>
                {hasSubs && (
                  <span
                    style={s.chevron}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCat(isOpen ? null : cat.id);
                    }}
                  >
                    {isOpen ? "▾" : "▸"}
                  </span>
                )}
              </div>
              {hasSubs && isOpen && (
                <div>
                  {cat.subcategories.map((sub) => (
                    <div
                      key={sub.id || sub.slug}
                      className="cs-sub-row"
                      style={s.subRow}
                      onClick={() => goToCategory(sub.slug)}
                    >
                      {sub.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={s.divider} />

      <div style={s.header}>Our Service</div>
      <div
        className="cs-service-row"
        style={s.serviceRow}
        onClick={handleLoansClick}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>💰</span>
          <span style={{ fontWeight: 600 }}>Get a Loan</span>
        </div>
        <div style={s.serviceSub}>{loansSubtext}</div>
      </div>
      <div
        className="cs-service-row"
        style={s.serviceRow}
        onClick={handleContactClick}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>📞</span>
          <span style={{ fontWeight: 600 }}>Contact Us</span>
        </div>
        <div style={s.serviceSub}>{contactSubtext}</div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>

      {/* Desktop — sticky, persistent alongside the page content */}
      <aside className="cs-aside" style={s.aside}>
        <Content />
      </aside>

      {/* Mobile — fixed trigger + slide-in drawer from the left */}
      <button
        className="cs-trigger"
        style={s.triggerBtn}
        onClick={() => setDrawerOpen(true)}
        aria-label="Open categories"
      >
        🗂️
      </button>

      {drawerOpen && (
        <div
          style={s.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrawerOpen(false);
          }}
        >
          <div style={s.drawerPanel}>
            <div style={s.drawerHeader}>
              <span style={s.drawerTitle}>Browse</span>
              <button
                style={s.drawerClose}
                onClick={() => setDrawerOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div style={s.drawerBody}>
              <Content />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const s = {
  aside: {
    width: 260,
    flexShrink: 0,
    background: "#fff",
    borderRight: "1px solid #e8e4dc",
    padding: "20px 0",
    position: "sticky",
    top: 0,
    alignSelf: "flex-start",
    maxHeight: "100vh",
    overflowY: "auto",
  },
  header: {
    fontSize: 11,
    fontWeight: 700,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    padding: "4px 20px 10px",
  },
  catList: { marginBottom: 6 },
  catRow: {
    display: "flex",
    alignItems: "center",
    padding: "10px 20px",
    fontSize: 13.5,
    color: "#222",
    cursor: "pointer",
  },
  chevron: {
    fontSize: 11,
    color: "#999",
    padding: "2px 6px",
    cursor: "pointer",
  },
  subRow: {
    padding: "8px 20px 8px 46px",
    fontSize: 12.5,
    color: "#555",
    cursor: "pointer",
  },
  divider: { height: 1, background: "#f0ece0", margin: "10px 0 14px" },
  serviceRow: {
    margin: "0 12px 8px",
    padding: "12px 12px",
    background: "#1f4d1f",
    color: "#fff",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
  },
  serviceSub: { fontSize: 11, color: "#a8d5a8", marginTop: 4 },

  triggerBtn: {
    alignItems: "center",
    justifyContent: "center",
    background: "#1f4d1f",
    border: "1px solid rgba(255,255,255,0.25)",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
    width: 38,
    height: 38,
    borderRadius: 8,
    lineHeight: 1,
    boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 2200,
    display: "flex",
  },
  drawerPanel: {
    width: "82%",
    maxWidth: 300,
    height: "100%",
    background: "#fff",
    boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
  },
  drawerHeader: {
    background: "#1f4d1f",
    padding: "20px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  drawerTitle: { color: "#fff", fontWeight: 700, fontSize: 16 },
  drawerClose: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: 20,
    cursor: "pointer",
    padding: 4,
    lineHeight: 1,
  },
  drawerBody: { flex: 1, overflowY: "auto", padding: "12px 0" },
};
