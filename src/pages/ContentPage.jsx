import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const LOGO_PATH = "/achoice logo.png";

export default function ContentPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get(`/content-pages/${slug}`)
      .then((res) => setPage(res.data))
      .catch(() => setError("This page could not be found."))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div style={{ minHeight: "100vh", background: "#f9f7f3", fontFamily: "inherit" }}>
      {/* Minimal nav */}
      <nav style={s.nav}>
        <div style={s.navBrand} onClick={() => navigate("/")}>
          <img src={LOGO_PATH} alt="Achoice" style={s.navLogo} />
          <span style={s.navName}>ACHOICE LIMITED</span>
        </div>
        <div style={s.navLinks}>
          <Link to="/" style={s.navLink}>Home</Link>
          <Link to="/products" style={s.navLink}>Shop</Link>
          <Link to="/help" style={s.navLink}>Help Center</Link>
        </div>
      </nav>

      <div style={s.container}>
        {loading ? (
          <div style={s.center}>Loading...</div>
        ) : error ? (
          <div style={s.center}>
            <div style={s.errorIcon}>📄</div>
            <div style={s.errorTitle}>Page not found</div>
            <p style={s.errorSub}>{error}</p>
            <button style={s.backBtn} onClick={() => navigate("/")}>Go Home</button>
          </div>
        ) : (
          <div style={s.card}>
            <button style={s.backLink} onClick={() => navigate(-1)}>
              ← Back
            </button>
            <h1 style={s.title}>{page.title}</h1>
            {page.applies_to_category && (
              <div style={s.badge}>Applies to: {page.applies_to_category}</div>
            )}
            <div
              style={s.body}
              dangerouslySetInnerHTML={{ __html: page.body?.replace(/\n/g, "<br/>") }}
            />
          </div>
        )}
      </div>

      {/* Minimal footer */}
      <footer style={s.footer}>
        <span>© 2026 ACHOICE LIMITED. All rights reserved.</span>
        <span>
          <Link to="/pages/return-refund-policy" style={s.footerLink}>Return Policy</Link>
          {" · "}
          <Link to="/pages/delivery-timeline" style={s.footerLink}>Delivery Info</Link>
          {" · "}
          <Link to="/help" style={s.footerLink}>Help Center</Link>
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
  center: { textAlign: "center", padding: "80px 20px" },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: 700, color: "#333", marginBottom: 8 },
  errorSub: { fontSize: 14, color: "#888", marginBottom: 24 },
  backBtn: {
    padding: "10px 24px", background: "#1f4d1f", color: "#fff", border: "none",
    borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  card: {
    background: "#fff", borderRadius: 12, border: "1px solid #e8e4dc", padding: "32px 40px",
  },
  backLink: {
    background: "none", border: "none", color: "#1f4d1f", fontSize: 13,
    cursor: "pointer", padding: 0, marginBottom: 20, display: "block",
  },
  title: { fontSize: 28, fontWeight: 700, color: "#111", marginBottom: 12, lineHeight: 1.3 },
  badge: {
    display: "inline-block", background: "#eafaf0", color: "#1a7a3a", fontSize: 12,
    fontWeight: 600, padding: "4px 12px", borderRadius: 99, marginBottom: 20,
  },
  body: { fontSize: 15, color: "#444", lineHeight: 1.8 },
  footer: {
    borderTop: "1px solid #e8e4dc", padding: "20px 40px", display: "flex",
    justifyContent: "space-between", fontSize: 12, color: "#888", flexWrap: "wrap", gap: 8,
  },
  footerLink: { color: "#1f4d1f", textDecoration: "none" },
};