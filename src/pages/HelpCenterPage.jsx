import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const LOGO_PATH = "/achoice logo.png";

export default function HelpCenterPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);

  useEffect(() => {
    api
      .get("/content-pages", { params: { category: "help" } })
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setArticles([...data].sort((a, b) => a.display_order - b.display_order));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openArticle = (article) => {
    setArticleLoading(true);
    setSelected({ ...article, body: null });
    api
      .get(`/content-pages/${article.slug}`)
      .then((res) => setSelected(res.data))
      .catch(() => setSelected({ ...article, body: "Failed to load this article." }))
      .finally(() => setArticleLoading(false));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9f7f3", fontFamily: "inherit" }}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navBrand} onClick={() => navigate("/")}>
          <img src={LOGO_PATH} alt="Achoice" style={s.navLogo} />
          <span style={s.navName}>ACHOICE LIMITED</span>
        </div>
        <div style={s.navLinks}>
          <Link to="/" style={s.navLink}>Home</Link>
          <Link to="/products" style={s.navLink}>Shop</Link>
          <Link to="/pages/return-refund-policy" style={s.navLink}>Return Policy</Link>
          <Link to="/pages/delivery-timeline" style={s.navLink}>Delivery Info</Link>
        </div>
      </nav>

      <div style={s.container}>
        <div style={s.header}>
          <div style={s.headerIcon}>🙋</div>
          <h1 style={s.headerTitle}>Help Center</h1>
          <p style={s.headerSub}>
            Find answers to common questions about shopping, payments, and more.
          </p>
        </div>

        {loading ? (
          <div style={s.center}>Loading articles...</div>
        ) : articles.length === 0 ? (
          <div style={s.center}>No help articles available right now.</div>
        ) : (
          <div style={s.grid}>
            {articles.map((a) => (
              <button key={a.id} style={s.card} onClick={() => openArticle(a)}>
                <div style={s.cardTitle}>{a.title}</div>
                <div style={s.cardArrow}>→</div>
              </button>
            ))}
          </div>
        )}

        {/* Related links */}
        <div style={s.relatedBox}>
          <div style={s.relatedTitle}>Related Pages</div>
          <div style={s.relatedLinks}>
            <Link to="/pages/return-refund-policy" style={s.relatedLink}>
              📦 Return & Refund Policy
            </Link>
            <Link to="/pages/delivery-timeline" style={s.relatedLink}>
              🚚 Delivery Timeline
            </Link>
            <Link to="/complaints" style={s.relatedLink}>
              💬 Submit a Complaint
            </Link>
          </div>
        </div>
      </div>

      {/* Article modal */}
      {selected && (
        <div style={s.overlay} onClick={() => setSelected(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{selected.title}</h2>
              <button style={s.modalClose} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              {articleLoading || !selected.body ? (
                <div style={s.center}>Loading...</div>
              ) : (
                <div
                  style={s.bodyText}
                  dangerouslySetInnerHTML={{
                    __html: selected.body?.replace(/\n/g, "<br/>"),
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <footer style={s.footer}>
        <span>© 2026 ACHOICE LIMITED. All rights reserved.</span>
        <span>
          <Link to="/pages/return-refund-policy" style={s.footerLink}>Return Policy</Link>
          {" · "}
          <Link to="/pages/delivery-timeline" style={s.footerLink}>Delivery Info</Link>
        </span>
      </footer>
    </div>
  );
}

const s = {
  nav: {
    background: "#fff", borderBottom: "1px solid #e8e4dc", padding: "12px 40px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    position: "sticky", top: 0, zIndex: 100,
  },
  navBrand: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  navLogo: { width: 32, height: 32, objectFit: "contain" },
  navName: { fontSize: 14, fontWeight: 700, color: "#1f4d1f" },
  navLinks: { display: "flex", gap: 20 },
  navLink: { fontSize: 13, color: "#555", textDecoration: "none" },
  container: { maxWidth: 760, margin: "0 auto", padding: "40px 20px" },
  header: { textAlign: "center", marginBottom: 40 },
  headerIcon: { fontSize: 48, marginBottom: 12 },
  headerTitle: { fontSize: 32, fontWeight: 700, color: "#111", marginBottom: 10 },
  headerSub: { fontSize: 15, color: "#666", maxWidth: 500, margin: "0 auto" },
  center: { textAlign: "center", padding: 40, color: "#888", fontSize: 14 },
  grid: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 },
  card: {
    background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10,
    padding: "18px 20px", display: "flex", justifyContent: "space-between",
    alignItems: "center", cursor: "pointer", textAlign: "left",
    fontFamily: "inherit", transition: "border-color 0.15s",
  },
  cardTitle: { fontSize: 15, fontWeight: 600, color: "#111" },
  cardArrow: { fontSize: 16, color: "#1f4d1f", fontWeight: 700 },
  relatedBox: {
    background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: "20px 24px",
  },
  relatedTitle: { fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase",
    letterSpacing: 1, marginBottom: 14 },
  relatedLinks: { display: "flex", flexDirection: "column", gap: 10 },
  relatedLink: { fontSize: 14, color: "#1f4d1f", textDecoration: "none", fontWeight: 500 },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  modal: {
    background: "#fff", borderRadius: 12, width: "100%", maxWidth: 640,
    maxHeight: "85vh", display: "flex", flexDirection: "column",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "20px 24px", borderBottom: "1px solid #e8e4dc",
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: "#111", margin: 0, flex: 1, paddingRight: 16 },
  modalClose: {
    background: "none", border: "none", fontSize: 18, cursor: "pointer",
    color: "#888", padding: 0, lineHeight: 1, flexShrink: 0,
  },
  modalBody: { padding: "20px 24px", overflowY: "auto", flex: 1 },
  bodyText: { fontSize: 15, color: "#444", lineHeight: 1.8 },
  footer: {
    borderTop: "1px solid #e8e4dc", padding: "20px 40px",
    display: "flex", justifyContent: "space-between",
    fontSize: 12, color: "#888", flexWrap: "wrap", gap: 8,
  },
  footerLink: { color: "#1f4d1f", textDecoration: "none" },
};