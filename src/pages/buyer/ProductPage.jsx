import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProduct,
  getAllProducts,
  getProductReviews,
  submitProductReview,
} from "../../services/productService";
import NotificationBell from '../../components/buyer/NotificationBell';
import BuyerDropdown from "../../components/buyer/BuyerDropdown";

function StarRating({ rating = 0, size = 14 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ color: "#f0c050", fontSize: size }}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return "★";
        if (i === full && half) return "⯨";
        return "☆";
      }).join("")}
    </span>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
    order_id: "",
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const categories = [
    "All",
    ...new Set(allProducts.map((p) => p.category).filter(Boolean)),
  ];

  useEffect(() => {
    if (document.getElementById("pp-style")) return;
    const el = document.createElement("style");
    el.id = "pp-style";
    el.textContent = `
      body { margin:0; }
      .pp-wrap { min-height:100vh; background:#f7f5f0; font-family:Arial,sans-serif; }

      /* ── NAV ── */
      .pp-nav { background:#1f4d1f; padding:10px 40px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:200; gap:12px; }
      .pp-nav-left { display:flex; align-items:center; gap:10px; cursor:pointer; flex-shrink:0; }
      .pp-nav-logo { width:36px; height:36px; border-radius:6px; }
      .pp-nav-name { font-weight:700; font-size:17px; color:#fff; }
      .pp-nav-name span { color:#f0c050; }
      .pp-search-group { flex:1; max-width:500px; margin:0 20px; display:flex; background:#fff; border-radius:25px; overflow:hidden; border:2px solid #f0c050; }
      .pp-search-group select { padding:8px 12px; border:none; border-right:1px solid #eee; background:#f9f9f9; font-size:13px; outline:none; cursor:pointer; }
      .pp-search-group input  { flex:1; padding:9px 14px; border:none; outline:none; font-size:14px; min-width:0; }
      .pp-nav-right { display:flex; align-items:center; gap:14px; flex-shrink:0; }
      .pp-cart-btn  { font-size:22px; cursor:pointer; position:relative; color:#fff; }
      .pp-cart-badge { position:absolute; top:-8px; right:-10px; background:#f0c050; color:#1f4d1f; font-size:10px; font-weight:700; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #1f4d1f; }
      .pp-hamburger { display:none; }

      /* ── MOBILE SEARCH BAR — always visible below nav on mobile ── */
      .pp-mobile-searchbar { display:none; }
      .pp-mobile-searchbar-inner { padding:10px 12px; display:flex; gap:8px; background:#1a3d1a; border-bottom:3px solid #f0c050; }
      .pp-mobile-searchbar-inner select { padding:10px 8px; border:none; border-radius:8px; font-size:13px; outline:none; font-family:inherit; background:#fff; color:#333; flex-shrink:0; max-width:110px; cursor:pointer; }
      .pp-mobile-searchbar-inner input  { flex:1; padding:10px 14px; border:none; border-radius:8px; font-size:15px; outline:none; font-family:inherit; min-width:0; }
      .pp-mobile-searchbar-count { padding:5px 14px 8px; background:#1a3d1a; font-size:12px; color:#a8d5a8; }

      /* ── CONTAINER ── */
      .pp-container { padding:28px 40px; max-width:1200px; margin:0 auto; }

      /* ── PRODUCT GRID ── */
      .pp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:22px; }
      .pp-card { background:#fff; border-radius:12px; border:1px solid #e8e4dc; overflow:hidden; transition:box-shadow .2s; }
      .pp-card:hover { box-shadow:0 4px 20px rgba(0,0,0,0.1); }
      .pp-card-img-box { height:168px; background:#f5f5f5; display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative; overflow:hidden; }
      .pp-card-img-box img { width:100%; height:100%; object-fit:cover; }
      .pp-sale-badge { position:absolute; top:8px; right:8px; background:#cc0000; color:#fff; font-size:9px; font-weight:700; padding:3px 8px; border-radius:4px; }
      .pp-cat-badge  { position:absolute; top:8px; left:8px; background:#1f4d1f; color:#fff; font-size:9px; font-weight:700; padding:3px 8px; border-radius:4px; text-transform:capitalize; }
      .pp-card-body  { padding:14px; }
      .pp-card-name  { font-weight:700; font-size:14px; color:#111; margin-bottom:4px; }
      .pp-card-seller { font-size:11px; color:#888; margin-bottom:5px; }
      .pp-card-price  { color:#1f4d1f; font-weight:900; font-size:19px; }
      .pp-card-orig   { color:#bbb; font-size:11px; text-decoration:line-through; margin-bottom:8px; }
      .pp-card-btn    { width:100%; padding:10px; background:#1f4d1f; color:#fff; border:none; border-radius:7px; cursor:pointer; font-weight:700; font-size:13px; font-family:inherit; }

      /* ── DETAIL ── */
      .pp-back-btn { background:none; border:none; color:#1f4d1f; font-weight:700; cursor:pointer; font-size:14px; margin-bottom:18px; display:flex; align-items:center; gap:6px; padding:0; }
      .pp-detail-card { display:grid; grid-template-columns:1fr 1.1fr; gap:36px; background:#fff; padding:32px; border-radius:14px; margin-bottom:28px; border:1px solid #e8e4dc; }
      .pp-main-img-box { position:relative; height:360px; background:#f5f5f5; border-radius:10px; overflow:hidden; margin-bottom:12px; }
      .pp-main-img-box img { width:100%; height:100%; object-fit:cover; }
      .pp-img-placeholder { display:flex; align-items:center; justify-content:center; height:100%; font-size:72px; }
      .pp-detail-sale { position:absolute; top:12px; right:12px; background:#cc0000; color:#fff; font-size:11px; font-weight:700; padding:4px 10px; border-radius:4px; }
      .pp-thumbs { display:flex; gap:8px; flex-wrap:wrap; }
      .pp-thumb  { width:62px; height:62px; object-fit:cover; border-radius:7px; cursor:pointer; transition:border .2s; }
      .pp-detail-cat   { font-size:11px; font-weight:700; color:#c8860a; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; }
      .pp-detail-name  { font-size:26px; font-weight:700; color:#111; margin:0 0 12px; line-height:1.2; }
      .pp-rating-row   { display:flex; align-items:center; gap:8px; margin-bottom:16px; font-size:13px; color:#666; }
      .pp-price-row    { display:flex; align-items:baseline; gap:12px; margin-bottom:16px; }
      .pp-price        { font-size:34px; font-weight:900; color:#1f4d1f; }
      .pp-orig-price   { font-size:16px; color:#bbb; text-decoration:line-through; }
      .pp-desc         { color:#555; line-height:1.75; font-size:14px; margin-bottom:18px; }
      .pp-info-tag     { display:inline-block; background:#f0fff4; color:#1f4d1f; font-size:12px; padding:5px 12px; border-radius:6px; margin-bottom:16px; border:1px solid #a8d5a8; }
      .pp-whatsapp-btn { display:block; text-align:center; background:#25D366; color:#fff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:700; font-size:14px; margin-bottom:12px; }
      .pp-add-btn      { width:100%; padding:14px; background:#1f4d1f; color:#fff; border:none; border-radius:9px; font-weight:700; font-size:15px; cursor:pointer; margin-bottom:20px; font-family:inherit; }
      .pp-seller-card  { background:#f7f5f0; border-radius:10px; padding:16px; border:1px solid #e8e4dc; }
      .pp-seller-label { font-size:10px; color:#888; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:5px; }
      .pp-seller-name  { font-size:15px; font-weight:700; color:#111; margin-bottom:6px; }
      .pp-seller-meta  { font-size:13px; color:#555; display:flex; flex-direction:column; gap:4px; margin:8px 0 10px; }
      .pp-seller-wa    { display:inline-block; background:#25D366; color:#fff; text-decoration:none; padding:8px 16px; border-radius:6px; font-size:13px; font-weight:600; }

      /* ── REVIEWS ── */
      .pp-reviews { background:#fff; border-radius:14px; padding:28px; border:1px solid #e8e4dc; }
      .pp-reviews-title { font-size:20px; font-weight:700; color:#111; margin-bottom:24px; }
      .pp-rating-breakdown { display:flex; gap:36px; margin-bottom:28px; padding:20px; background:#f7f5f0; border-radius:10px; align-items:center; flex-wrap:wrap; }
      .pp-rating-big     { text-align:center; min-width:90px; }
      .pp-rating-big-num { font-size:52px; font-weight:700; color:#1f4d1f; line-height:1; }
      .pp-rating-big-count { font-size:12px; color:#888; margin-top:6px; }
      .pp-rating-bars    { flex:1; min-width:160px; display:flex; flex-direction:column; gap:8px; }
      .pp-bar-row        { display:flex; align-items:center; gap:8px; }
      .pp-bar-label      { font-size:12px; color:#666; width:22px; text-align:right; }
      .pp-bar-bg         { flex:1; height:8px; background:#e8e4dc; border-radius:99px; overflow:hidden; }
      .pp-bar-fill       { height:100%; background:#f0c050; border-radius:99px; }
      .pp-bar-count      { font-size:12px; color:#888; width:20px; }
      .pp-review-list    { display:flex; flex-direction:column; gap:20px; margin-bottom:28px; }
      .pp-review-item    { border-bottom:1px solid #f0ece4; padding-bottom:18px; }
      .pp-review-header  { display:flex; align-items:flex-start; gap:10px; margin-bottom:8px; }
      .pp-review-avatar  { width:36px; height:36px; background:#1f4d1f; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#f0c050; font-weight:700; font-size:14px; flex-shrink:0; }
      .pp-review-user    { font-size:14px; font-weight:600; color:#111; margin-bottom:3px; }
      .pp-review-date    { margin-left:auto; font-size:12px; color:#bbb; }
      .pp-review-comment { font-size:14px; color:#555; line-height:1.7; margin:0; }
      .pp-no-reviews     { color:#888; font-size:14px; text-align:center; padding:24px 0; }
      .pp-review-form    { background:#f7f5f0; border-radius:10px; padding:22px; margin-top:16px; }
      .pp-review-form h3 { font-size:16px; font-weight:700; color:#111; margin:0 0 16px; }
      .pp-review-field   { margin-bottom:16px; }
      .pp-review-label   { display:block; font-size:13px; color:#333; font-weight:600; margin-bottom:6px; }
      .pp-review-select, .pp-review-input, .pp-review-textarea {
        width:100%; padding:11px 14px; border:1.5px solid #ddd; border-radius:8px;
        font-size:14px; outline:none; font-family:inherit; box-sizing:border-box; transition:border .2s;
      }
      .pp-review-select:focus, .pp-review-input:focus, .pp-review-textarea:focus { border-color:#1f4d1f; }
      .pp-review-textarea { resize:vertical; }
      .pp-review-submit     { padding:12px 28px; background:#1f4d1f; color:#fff; border:none; border-radius:7px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
      .pp-review-submit-dis { padding:12px 28px; background:#ccc; color:#fff; border:none; border-radius:7px; font-size:14px; cursor:not-allowed; }
      .pp-review-ok  { background:#f0fff4; color:#1f4d1f; padding:10px 14px; border-radius:6px; font-size:13px; margin-bottom:14px; border:1px solid #a8d5a8; }
      .pp-review-err { background:#fff0f0; color:#cc0000; padding:10px 14px; border-radius:6px; font-size:13px; margin-bottom:14px; border:1px solid #ffb3b3; }
      .pp-empty { text-align:center; color:#888; padding:60px 0; font-size:16px; }

      /* ── TABLET ── */
      @media (max-width:900px) {
        .pp-nav { padding:10px 20px; }
        .pp-search-group { display:none; }
        .pp-mobile-searchbar { display:block; position:sticky; top:56px; z-index:190; }
        .pp-container { padding:20px; }
        .pp-detail-card { grid-template-columns:1fr; gap:24px; padding:20px; }
        .pp-main-img-box { height:280px; }
        .pp-detail-name { font-size:22px; }
        .pp-price { font-size:28px; }
      }

      /* ── MOBILE ── */
      @media (max-width:600px) {
        .pp-nav { padding:8px 14px; }
        .pp-nav-name { font-size:15px; }
        .pp-nav-logo { width:32px; height:32px; }
        .pp-mobile-searchbar { display:block; position:sticky; top:50px; z-index:190; }
        .pp-mobile-searchbar-inner { padding:8px 12px; gap:7px; }
        .pp-mobile-searchbar-inner select { font-size:13px; padding:10px 7px; max-width:100px; }
        .pp-mobile-searchbar-inner input  { font-size:15px; padding:10px 12px; }
        .pp-container { padding:12px; }
        .pp-grid { grid-template-columns:1fr 1fr; gap:12px; }
        .pp-card-img-box { height:140px; }
        .pp-card-name { font-size:13px; }
        .pp-card-price { font-size:16px; }
        .pp-card-btn { font-size:12px; padding:9px; }
        .pp-detail-card { padding:16px; gap:16px; border-radius:10px; }
        .pp-main-img-box { height:240px; }
        .pp-detail-name { font-size:19px; }
        .pp-price { font-size:26px; }
        .pp-desc { font-size:13px; }
        .pp-reviews { padding:16px; border-radius:10px; }
        .pp-reviews-title { font-size:17px; }
        .pp-rating-breakdown { flex-direction:column; gap:16px; padding:14px; }
        .pp-rating-big-num { font-size:44px; }
        .pp-review-form { padding:16px; }
        .pp-thumb { width:50px; height:50px; }
      }

      @media (max-width:380px) {
        .pp-grid { grid-template-columns:1fr; }
        .pp-mobile-searchbar-inner select { display:none; }
      }
    `;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    if (id) return;
    setListLoading(true);
    setListError(null);
    getAllProducts()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setAllProducts(data);
        setFilteredProducts(data);
      })
      .catch(() => setListError("Failed to load products. Please try again."))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    if (!id) return;
    setDetailLoading(true);
    setProduct(null);
    setReviews([]);
    setActiveImg(0);
    Promise.all([getProduct(id), getProductReviews(id)])
      .then(([pRes, rRes]) => {
        setProduct(pRes.data);
        const rd = rRes.data;
        setReviews(rd?.data || rd?.reviews || (Array.isArray(rd) ? rd : []));
        setReviewSummary(rd?.summary || null);
      })
      .catch(() => setProduct(null))
      .finally(() => setDetailLoading(false));
  }, [id]);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(cart.reduce((acc, item) => acc + item.quantity, 0));
  }, []);

  useEffect(() => {
    let results = allProducts;
    if (selectedCategory !== "All")
      results = results.filter((p) => p.category === selectedCategory);
    if (searchTerm)
      results = results.filter((p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    setFilteredProducts(results);
  }, [searchTerm, selectedCategory, allProducts]);

  const handleAddToCart = (p) => {
    if (!p) return;
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = cart.findIndex((item) => item.id === p.id);
    if (idx > -1) cart[idx].quantity += 1;
    else
      cart.push({
        id: p.id,
        name: p.name,
        price: p.discount_price || p.price,
        image: p.images?.[0]?.image_url || p.images?.[0]?.url || p.image,
        quantity: 1,
      });
    localStorage.setItem("cart", JSON.stringify(cart));
    setCartCount(cart.reduce((acc, item) => acc + item.quantity, 0));
    navigate("/cart");
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      await submitProductReview(id, reviewForm);
      setReviewSuccess(true);
      setReviewForm({ rating: 5, comment: "", order_id: "" });
      const res = await getProductReviews(id);
      const rd = res.data;
      setReviews(rd?.data || rd?.reviews || (Array.isArray(rd) ? rd : []));
      setReviewSummary(rd?.summary || null);
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "";

  // ── NAV ──────────────────────────────────────────────────────────────────
  const Navbar = () => (
    <>
      <nav className="pp-nav">
        <div className="pp-nav-left" onClick={() => navigate("/products")}>
          <img
            src="/android-chrome-192x192.png"
            alt="Logo"
            className="pp-nav-logo"
          />
          <div className="pp-nav-name">
            ACHOICE <span>MARKET</span>
          </div>
        </div>

        {/* Desktop search — only on listing page */}
        {!id && (
          <div className="pp-search-group">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        <div className="pp-nav-right">
          <div className="pp-cart-btn" onClick={() => navigate("/cart")}>
            🛒
            {cartCount > 0 && (
              <span className="pp-cart-badge">{cartCount}</span>
            )}
          </div>
          <NotificationBell />
          <BuyerDropdown cartCount={cartCount} />
        </div>
      </nav>

      {/* ✅ Mobile search bar — always visible below nav on listing page */}
      {!id && (
        <div className="pp-mobile-searchbar">
          <div className="pp-mobile-searchbar-inner">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="🔍 Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  fontSize: 18,
                  cursor: "pointer",
                  padding: "0 4px",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="pp-mobile-searchbar-count">
              {filteredProducts.length} result
              {filteredProducts.length !== 1 ? "s" : ""} for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </>
  );

  // ── LOADING / ERROR ───────────────────────────────────────────────────────
  if (!id && listLoading)
    return (
      <div className="pp-wrap">
        <Navbar />
        <div
          style={{
            textAlign: "center",
            color: "#888",
            padding: 80,
            fontSize: 16,
          }}
        >
          Loading products...
        </div>
      </div>
    );
  if (!id && listError)
    return (
      <div className="pp-wrap">
        <Navbar />
        <div
          style={{
            textAlign: "center",
            color: "#cc0000",
            padding: 80,
            fontSize: 14,
          }}
        >
          {listError}
        </div>
      </div>
    );
  if (id && detailLoading)
    return (
      <div className="pp-wrap">
        <Navbar />
        <div
          style={{
            textAlign: "center",
            color: "#888",
            padding: 80,
            fontSize: 16,
          }}
        >
          Loading product...
        </div>
      </div>
    );
  if (id && !product && !detailLoading)
    return (
      <div className="pp-wrap">
        <Navbar />
        <div
          style={{
            textAlign: "center",
            color: "#888",
            padding: 80,
            fontSize: 16,
          }}
        >
          Product not found.
        </div>
      </div>
    );

  // ── DETAIL DATA ───────────────────────────────────────────────────────────
  const images =
    product?.images?.length > 0
      ? product.images.map((img) => img.image_url || img.url || img)
      : product?.image
        ? [product.image]
        : [];
  const hasDiscount =
    product?.discount_price && Number(product.discount_price) > 0;
  const displayPrice = hasDiscount ? product.discount_price : product?.price;
  const avgRating = parseFloat(product?.reviews_avg_rating || 0);
  const reviewCount = product?.reviews_count || 0;
  const seller = product?.seller;

  return (
    <div className="pp-wrap">
      <Navbar />
      <div className="pp-container">
        {/* ══ LISTING ══════════════════════════════════════════════════════ */}
        {!id &&
          (filteredProducts.length === 0 ? (
            <p className="pp-empty">No products found.</p>
          ) : (
            <div className="pp-grid">
              {filteredProducts.map((p) => {
                const pDiscount =
                  p.discount_price && Number(p.discount_price) > 0;
                const pImg =
                  p.images?.[0]?.image_url || p.images?.[0]?.url || p.image;
                return (
                  <div key={p.id} className="pp-card">
                    <div
                      className="pp-card-img-box"
                      onClick={() => navigate(`/product/${p.id}`)}
                    >
                      {pImg ? (
                        <img src={pImg} alt={p.name} />
                      ) : (
                        <span style={{ fontSize: 40 }}>📦</span>
                      )}
                      {pDiscount && <div className="pp-sale-badge">SALE</div>}
                      {p.category && (
                        <div className="pp-cat-badge">{p.category}</div>
                      )}
                    </div>
                    <div className="pp-card-body">
                      <div className="pp-card-name">{p.name}</div>
                      <div className="pp-card-seller">
                        {p.seller?.business_name || "ACHOICE Seller"}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginBottom: 6,
                        }}
                      >
                        <StarRating
                          rating={parseFloat(p.reviews_avg_rating || 0)}
                        />
                        <span style={{ fontSize: 11, color: "#888" }}>
                          ({p.reviews_count || 0})
                        </span>
                      </div>
                      <div className="pp-card-price">
                        ₦
                        {Number(
                          pDiscount ? p.discount_price : p.price,
                        ).toLocaleString()}
                      </div>
                      {pDiscount && (
                        <div className="pp-card-orig">
                          ₦{Number(p.price).toLocaleString()}
                        </div>
                      )}
                      <button
                        className="pp-card-btn"
                        onClick={() => handleAddToCart(p)}
                      >
                        Add & Checkout
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

        {/* ══ DETAIL ═══════════════════════════════════════════════════════ */}
        {id && product && (
          <>
            <button
              className="pp-back-btn"
              onClick={() => navigate("/products")}
            >
              ← Back to Products
            </button>

            <div className="pp-detail-card">
              {/* Images */}
              <div>
                <div className="pp-main-img-box">
                  {images.length > 0 ? (
                    <img src={images[activeImg]} alt={product.name} />
                  ) : (
                    <div className="pp-img-placeholder">🌿</div>
                  )}
                  {hasDiscount && <div className="pp-detail-sale">SALE</div>}
                </div>
                {images.length > 1 && (
                  <div className="pp-thumbs">
                    {images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt=""
                        className="pp-thumb"
                        style={{
                          border:
                            i === activeImg
                              ? "2.5px solid #1f4d1f"
                              : "2px solid #eee",
                        }}
                        onClick={() => setActiveImg(i)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                <div className="pp-detail-cat">{product.category}</div>
                <h1 className="pp-detail-name">{product.name}</h1>
                <div className="pp-rating-row">
                  <StarRating rating={avgRating} size={18} />
                  <span>
                    {avgRating.toFixed(1)} ({reviewCount} review
                    {reviewCount !== 1 ? "s" : ""})
                  </span>
                </div>
                <div className="pp-price-row">
                  <div className="pp-price">
                    ₦{Number(displayPrice).toLocaleString()}
                  </div>
                  {hasDiscount && (
                    <div className="pp-orig-price">
                      ₦{Number(product.price).toLocaleString()}
                    </div>
                  )}
                </div>
                <p className="pp-desc">{product.description}</p>
                {product.min_order_qty && (
                  <div className="pp-info-tag">
                    📦 Min. order: {product.min_order_qty} units
                  </div>
                )}
                {product.whatsapp_number && (
                  <a
                    href={`https://wa.me/${product.whatsapp_number.replace(/\D/g, "")}?text=Hi, I'm interested in ${encodeURIComponent(product.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="pp-whatsapp-btn"
                  >
                    💬 Chat on WhatsApp
                  </a>
                )}
                <button
                  className="pp-add-btn"
                  onClick={() => handleAddToCart(product)}
                >
                  🛒 Add to Cart
                </button>

                {seller && (
                  <div className="pp-seller-card">
                    <div className="pp-seller-label">Sold by</div>
                    <div className="pp-seller-name">{seller.business_name}</div>
                    {seller.rating > 0 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          margin: "4px 0 6px",
                        }}
                      >
                        <StarRating
                          rating={parseFloat(seller.rating)}
                          size={13}
                        />
                        <span style={{ fontSize: 13, color: "#666" }}>
                          {parseFloat(seller.rating).toFixed(1)}
                        </span>
                      </div>
                    )}
                    <div className="pp-seller-meta">
                      {seller.total_sales > 0 && (
                        <span>🛍 {seller.total_sales} sales</span>
                      )}
                      {seller.state && (
                        <span>
                          📍 {seller.business_address || seller.state}
                        </span>
                      )}
                    </div>
                    {seller.whatsapp_number && (
                      <a
                        href={`https://wa.me/${seller.whatsapp_number.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="pp-seller-wa"
                      >
                        💬 Contact Seller
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Reviews */}
            <div className="pp-reviews">
              <div className="pp-reviews-title">Customer Reviews</div>

              {reviewSummary && (
                <div className="pp-rating-breakdown">
                  <div className="pp-rating-big">
                    <div className="pp-rating-big-num">
                      {avgRating.toFixed(1)}
                    </div>
                    <StarRating rating={avgRating} size={22} />
                    <div className="pp-rating-big-count">
                      {reviewCount} reviews
                    </div>
                  </div>
                  <div className="pp-rating-bars">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviewSummary[star] || 0;
                      const pct =
                        reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                      return (
                        <div key={star} className="pp-bar-row">
                          <span className="pp-bar-label">{star}★</span>
                          <div className="pp-bar-bg">
                            <div
                              className="pp-bar-fill"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="pp-bar-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {reviews.length > 0 ? (
                <div className="pp-review-list">
                  {reviews.map((r, i) => (
                    <div key={r.id || i} className="pp-review-item">
                      <div className="pp-review-header">
                        <div className="pp-review-avatar">
                          {r.user?.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div className="pp-review-user">
                            {r.user?.name || "Anonymous"}
                          </div>
                          <StarRating rating={r.rating} size={13} />
                        </div>
                        <div className="pp-review-date">
                          {fmtDate(r.created_at)}
                        </div>
                      </div>
                      <p className="pp-review-comment">{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pp-no-reviews">
                  No reviews yet. Be the first to review this product!
                </p>
              )}

              {user && (
                <div className="pp-review-form">
                  <h3>Leave a Review</h3>
                  {reviewSuccess && (
                    <div className="pp-review-ok">
                      ✅ Review submitted! Thank you.
                    </div>
                  )}
                  {reviewError && (
                    <div className="pp-review-err">⚠️ {reviewError}</div>
                  )}
                  <form onSubmit={handleReviewSubmit}>
                    <div className="pp-review-field">
                      <label className="pp-review-label">Rating</label>
                      <select
                        className="pp-review-select"
                        value={reviewForm.rating}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            rating: Number(e.target.value),
                          })
                        }
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} Star{n > 1 ? "s" : ""} {"★".repeat(n)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="pp-review-field">
                      <label className="pp-review-label">
                        Order ID{" "}
                        <span style={{ color: "#aaa", fontWeight: 400 }}>
                          (optional)
                        </span>
                      </label>
                      <input
                        className="pp-review-input"
                        type="text"
                        placeholder="Your order ID"
                        value={reviewForm.order_id}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            order_id: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="pp-review-field">
                      <label className="pp-review-label">Your Review</label>
                      <textarea
                        className="pp-review-textarea"
                        rows={4}
                        required
                        placeholder="Share your experience with this product..."
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            comment: e.target.value,
                          })
                        }
                      />
                    </div>
                    <button
                      type="submit"
                      className={
                        reviewSubmitting
                          ? "pp-review-submit-dis"
                          : "pp-review-submit"
                      }
                      disabled={reviewSubmitting}
                    >
                      {reviewSubmitting ? "Submitting..." : "Submit Review →"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


