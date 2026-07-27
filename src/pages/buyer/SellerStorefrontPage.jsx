import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

const LOGO_PATH = "/achoice logo.png";

function Stars({ rating = 0, size = 14 }) {
  const r = Math.round(Number(rating));
  return (
    <span style={{ fontSize: size, lineHeight: 1, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= r ? "#f0c050" : "#ddd" }}>★</span>
      ))}
    </span>
  );
}

export default function SellerStorefrontPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [toast, setToast] = useState("");

  const token = localStorage.getItem("token");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    setLoading(true);
    api
      .get(`/sellers/${id}/profile`)
      .then((res) => {
        const data = res.data;
        setSeller(data.seller || data);
        setProducts(data.products?.data || data.products || []);
        setFollowing(data.seller?.is_following ?? data.is_following ?? false);
      })
      .catch(() => setSeller(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFollow = async () => {
    if (!token) { navigate("/login"); return; }
    setFollowBusy(true);
    try {
      if (following) {
        await api.delete(`/sellers/${id}/unfollow`);
        setFollowing(false);
        showToast("Unfollowed seller");
      } else {
        await api.post(`/sellers/${id}/follow`);
        setFollowing(true);
        showToast("Now following " + (seller?.business_name || "seller"));
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Action failed");
    } finally {
      setFollowBusy(false);
    }
  };

  const scoreColor = (label) => ({
    Excellent: "#1a7a3a", Good: "#2e7d32", Fair: "#f57c00",
    "At Risk": "#cc0000", "New Seller": "#1565c0",
  }[label] || "#555");

  return (
    <div style={{ minHeight: "100vh", background: "#f9f7f3", fontFamily: "inherit" }}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navBrand} onClick={() => navigate("/")}>
          <img src={LOGO_PATH} alt="Achoice" style={s.navLogo} />
          <span style={s.navName}>ACHOICE LIMITED</span>
        </div>
        <div style={s.navLinks}>
          <Link to="/products" style={s.navLink}>Shop</Link>
          {token && <Link to="/wishlist" style={s.navLink}>Wishlist</Link>}
        </div>
      </nav>

      <div style={s.container}>
        {loading ? (
          <div style={s.center}>Loading seller profile...</div>
        ) : !seller ? (
          <div style={s.center}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Seller not found</div>
            <button style={s.btn} onClick={() => navigate("/products")}>Browse Products</button>
          </div>
        ) : (
          <>
            {/* Seller header card */}
            <div style={s.profileCard}>
              <div style={s.profileLeft}>
                {seller.logo ? (
                  <img src={seller.logo} alt={seller.business_name} style={s.logo} />
                ) : (
                  <div style={s.logoPlaceholder}>🏪</div>
                )}
                <div>
                  <div style={s.businessName}>{seller.business_name}</div>
                  {seller.state && (
                    <div style={s.meta}>📍 {seller.state}</div>
                  )}
                  {seller.description && (
                    <div style={s.desc}>{seller.description}</div>
                  )}
                  <div style={s.statsRow}>
                    <Stars rating={parseFloat(seller.rating || 0)} size={15} />
                    <span style={s.statLabel}>
                      {parseFloat(seller.rating || 0).toFixed(1)} rating
                    </span>
                    {seller.score_label && (
                      <span style={{
                        ...s.scoreBadge,
                        background: scoreColor(seller.score_label) + "18",
                        color: scoreColor(seller.score_label),
                      }}>
                        {seller.score_label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                style={following ? s.unfollowBtn : s.followBtn}
                onClick={handleFollow}
                disabled={followBusy}
              >
                {followBusy ? "..." : following ? "✓ Following" : "+ Follow"}
              </button>
            </div>

            {/* Products grid */}
            <div style={s.sectionTitle}>
              Products by {seller.business_name}
            </div>

            {products.length === 0 ? (
              <div style={s.center}>No products listed yet.</div>
            ) : (
              <div style={s.grid}>
                {products.map((p) => {
                  const hasDisc = p.discount_price && Number(p.discount_price) > 0;
                  const img = p.images?.[0]?.image_url || p.images?.[0]?.url || p.image;
                  return (
                    <div
                      key={p.id}
                      style={s.card}
                      onClick={() => navigate(`/product/${p.id}`)}
                    >
                      <div style={s.cardImg}>
                        {img ? (
                          <img src={img} alt={p.name} style={s.cardImgEl} />
                        ) : (
                          <span style={{ fontSize: 36 }}>📦</span>
                        )}
                        {hasDisc && <div style={s.saleBadge}>SALE</div>}
                      </div>
                      <div style={s.cardBody}>
                        <div style={s.cardName}>{p.name}</div>
                        <div style={s.cardPrice}>
                          ₦{Number(hasDisc ? p.discount_price : p.price).toLocaleString()}
                        </div>
                        {hasDisc && (
                          <div style={s.cardOrig}>₦{Number(p.price).toLocaleString()}</div>
                        )}
                        <button
                          style={s.addBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/product/${p.id}`);
                          }}
                        >
                          View Product
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  toast: {
    position: "fixed", top: 20, right: 20, background: "#1f4d1f", color: "#fff",
    padding: "12px 24px", borderRadius: 8, fontSize: 14, zIndex: 9999,
  },
  nav: {
    background: "#1f4d1f", padding: "12px 40px", display: "flex",
    alignItems: "center", justifyContent: "space-between",
    position: "sticky", top: 0, zIndex: 100,
  },
  navBrand: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  navLogo: { width: 32, height: 32, objectFit: "contain" },
  navName: { fontSize: 14, fontWeight: 700, color: "#fff" },
  navLinks: { display: "flex", gap: 20 },
  navLink: { fontSize: 13, color: "#a8d5a8", textDecoration: "none" },
  container: { maxWidth: 1100, margin: "0 auto", padding: "32px 20px" },
  center: { textAlign: "center", padding: "80px 20px", color: "#888", fontSize: 15 },
  btn: {
    padding: "10px 24px", background: "#1f4d1f", color: "#fff", border: "none",
    borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 16,
  },
  profileCard: {
    background: "#fff", borderRadius: 14, border: "1px solid #e8e4dc",
    padding: "28px 32px", marginBottom: 32, display: "flex",
    justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap",
  },
  profileLeft: { display: "flex", gap: 20, alignItems: "flex-start" },
  logo: { width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: "1px solid #e8e4dc" },
  logoPlaceholder: {
    width: 72, height: 72, borderRadius: 10, background: "#f0ece4",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
  },
  businessName: { fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 4 },
  meta: { fontSize: 13, color: "#888", marginBottom: 4 },
  desc: { fontSize: 13, color: "#555", maxWidth: 500, marginBottom: 8, lineHeight: 1.6 },
  statsRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  statLabel: { fontSize: 13, color: "#555" },
  scoreBadge: {
    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
  },
  followBtn: {
    padding: "10px 22px", background: "#1f4d1f", color: "#fff", border: "none",
    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
  },
  unfollowBtn: {
    padding: "10px 22px", background: "#fff", color: "#1f4d1f",
    border: "2px solid #1f4d1f", borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: "pointer", whiteSpace: "nowrap",
  },
  sectionTitle: {
    fontSize: 17, fontWeight: 700, color: "#111", marginBottom: 16,
  },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20,
  },
  card: {
    background: "#fff", borderRadius: 12, border: "1px solid #e8e4dc",
    overflow: "hidden", cursor: "pointer", transition: "box-shadow .2s",
  },
  cardImg: {
    height: 160, background: "#f5f5f5", display: "flex", alignItems: "center",
    justifyContent: "center", position: "relative", overflow: "hidden",
  },
  cardImgEl: { width: "100%", height: "100%", objectFit: "cover" },
  saleBadge: {
    position: "absolute", top: 8, right: 8, background: "#cc0000", color: "#fff",
    fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
  },
  cardBody: { padding: 14 },
  cardName: { fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 6, lineHeight: 1.3 },
  cardPrice: { fontSize: 17, fontWeight: 700, color: "#1f4d1f", marginBottom: 2 },
  cardOrig: { fontSize: 11, color: "#bbb", textDecoration: "line-through", marginBottom: 8 },
  addBtn: {
    width: "100%", padding: "9px", background: "#1f4d1f", color: "#fff", border: "none",
    borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
};