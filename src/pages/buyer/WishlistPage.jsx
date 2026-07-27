import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const LOGO_PATH = "/achoice logo.png";

function Stars({ rating = 0, size = 13 }) {
  const r = Math.round(Number(rating));
  return (
    <span style={{ fontSize: size, lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= r ? "#f0c050" : "#ddd" }}>★</span>
      ))}
    </span>
  );
}

export default function WishlistPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    api
      .get("/wishlist")
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (productId, productName) => {
    setRemovingId(productId);
    try {
      await api.delete(`/wishlist/${productId}`);
      setItems((prev) => prev.filter((item) => {
        const id = item.product_id || item.product?.id || item.id;
        return id !== productId;
      }));
      showToast(`Removed "${productName}" from wishlist`);
    } catch {
      showToast("Failed to remove item");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9f7f3", fontFamily: "inherit" }}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navBrand} onClick={() => navigate("/")}>
          <img src={LOGO_PATH} alt="Achoice" style={s.navLogo} />
          <span style={s.navName}>ACHOICE <span style={{ color: "#f0c050" }}>LIMITED</span></span>
        </div>
        <div style={s.navRight}>
          <button style={s.navBtn} onClick={() => navigate("/products")}>
            ← Continue Shopping
          </button>
        </div>
      </nav>

      <div style={s.container}>
        <div style={s.pageHeader}>
          <div style={s.pageTitle}>❤️ My Wishlist</div>
          {items.length > 0 && (
            <div style={s.pageCount}>{items.length} saved item{items.length !== 1 ? "s" : ""}</div>
          )}
        </div>

        {loading ? (
          <div style={s.center}>Loading your wishlist...</div>
        ) : items.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🤍</div>
            <div style={s.emptyTitle}>Your wishlist is empty</div>
            <p style={s.emptySub}>Save products you love by tapping the heart icon.</p>
            <button style={s.emptyBtn} onClick={() => navigate("/products")}>
              Browse Products
            </button>
          </div>
        ) : (
          <div style={s.grid}>
            {items.map((item) => {
              const p = item.product || item;
              const productId = item.product_id || p.id;
              const img = p.images?.[0]?.image_url || p.images?.[0]?.url || p.image;
              const hasDisc = p.discount_price && Number(p.discount_price) > 0;
              return (
                <div key={productId} style={s.card}>
                  <div style={s.cardImg} onClick={() => navigate(`/product/${p.id}`)}>
                    {img ? (
                      <img src={img} alt={p.name} style={s.cardImgEl} />
                    ) : (
                      <span style={{ fontSize: 40 }}>📦</span>
                    )}
                    {hasDisc && <div style={s.saleBadge}>SALE</div>}
                    {/* Remove from wishlist */}
                    <button
                      style={s.heartBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(productId, p.name);
                      }}
                      disabled={removingId === productId}
                      title="Remove from wishlist"
                    >
                      {removingId === productId ? "..." : "❤️"}
                    </button>
                  </div>
                  <div style={s.cardBody}>
                    <div style={s.cardSeller}>
                      {p.seller?.business_name || "ACHOICE Seller"}
                    </div>
                    <div style={s.cardName} onClick={() => navigate(`/product/${p.id}`)}>
                      {p.name}
                    </div>
                    {(p.reviews_avg_rating !== undefined) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                        <Stars rating={p.reviews_avg_rating || 0} />
                        <span style={{ fontSize: 11, color: "#888" }}>({p.reviews_count || 0})</span>
                      </div>
                    )}
                    <div style={s.cardPrice}>
                      ₦{Number(hasDisc ? p.discount_price : p.price).toLocaleString()}
                    </div>
                    {hasDisc && (
                      <div style={s.cardOrig}>₦{Number(p.price).toLocaleString()}</div>
                    )}
                    <button
                      style={s.viewBtn}
                      onClick={() => navigate(`/product/${p.id}`)}
                    >
                      View Product
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
  navName: { fontSize: 15, fontWeight: 700, color: "#fff" },
  navRight: {},
  navBtn: {
    background: "none", border: "1px solid rgba(255,255,255,0.4)", color: "#fff",
    padding: "8px 16px", borderRadius: 7, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
  },
  container: { maxWidth: 1100, margin: "0 auto", padding: "32px 20px" },
  pageHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: "#111" },
  pageCount: { fontSize: 14, color: "#888" },
  center: { textAlign: "center", padding: "80px 20px", color: "#888" },
  empty: { textAlign: "center", padding: "80px 20px" },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: "#333", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#888", marginBottom: 24 },
  emptyBtn: {
    padding: "12px 28px", background: "#1f4d1f", color: "#fff", border: "none",
    borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer",
  },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20,
  },
  card: {
    background: "#fff", borderRadius: 12, border: "1px solid #e8e4dc", overflow: "hidden",
  },
  cardImg: {
    height: 180, background: "#f5f5f5", display: "flex", alignItems: "center",
    justifyContent: "center", position: "relative", overflow: "hidden", cursor: "pointer",
  },
  cardImgEl: { width: "100%", height: "100%", objectFit: "cover" },
  saleBadge: {
    position: "absolute", top: 8, left: 8, background: "#cc0000", color: "#fff",
    fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
  },
  heartBtn: {
    position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.9)",
    border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 16,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
  },
  cardBody: { padding: 14 },
  cardSeller: { fontSize: 11, color: "#888", marginBottom: 3 },
  cardName: {
    fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 6,
    lineHeight: 1.3, cursor: "pointer",
  },
  cardPrice: { fontSize: 18, fontWeight: 700, color: "#1f4d1f", marginBottom: 2 },
  cardOrig: { fontSize: 11, color: "#bbb", textDecoration: "line-through", marginBottom: 8 },
  viewBtn: {
    width: "100%", padding: "9px", background: "#1f4d1f", color: "#fff", border: "none",
    borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
};