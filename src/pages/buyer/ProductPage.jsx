import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  getAllProducts,
  getCategories,
  getProduct,
  getProductReviews,
  submitProductReview,
} from "../../services/productService";
import NotificationBell from "../../components/buyer/NotificationBell";
import BuyerDropdown from "../../components/buyer/BuyerDropdown";

// ─────────────────────────────────────────────────────────────────────────────
// CSS constant — injected via <style> tag inside Nav component.
// This avoids useEffect/document.head injection which causes style leaks
// in single-page apps when navigating between pages.
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
  .pp-wrap { min-height:100vh; background:#f7f5f0; font-family:'Segoe UI',Arial,sans-serif; }

  /* ── NAV ── */
  .pp-nav { background:#1f4d1f; padding:10px 40px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:200; gap:14px; }
  .pp-nav-left { display:flex; align-items:center; gap:10px; cursor:pointer; flex-shrink:0; }
  .pp-nav-logo { width:36px; height:36px; border-radius:6px; object-fit:contain; }
  .pp-nav-name { font-weight:700; font-size:17px; color:#fff; white-space:nowrap; }
  .pp-nav-name span { color:#f0c050; }
  .pp-nav-right { display:flex; align-items:center; gap:14px; flex-shrink:0; }
  .pp-cart-btn { font-size:22px; cursor:pointer; position:relative; color:#fff; display:flex; align-items:center; }
  .pp-cart-badge { position:absolute; top:-8px; right:-10px; background:#f0c050; color:#1f4d1f; font-size:10px; font-weight:700; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #1f4d1f; }

  /* ── DESKTOP SEARCH ── */
  .pp-search-group { flex:1; max-width:500px; margin:0 10px; display:flex; background:#fff; border-radius:25px; overflow:hidden; border:2px solid #f0c050; min-width:0; }
  .pp-search-group select { padding:8px 10px; border:none; border-right:1px solid #eee; background:#f9f9f9; font-size:13px; outline:none; cursor:pointer; flex-shrink:0; min-width:80px; }
  .pp-search-group input { flex:1; padding:9px 14px; border:none; outline:none; font-size:14px; min-width:0; background:transparent; }

  /* ── MOBILE SEARCH BAR ── */
  .pp-mobile-bar { display:none; position:sticky; z-index:190; }
  .pp-mobile-bar-inner { padding:10px 12px; display:flex; gap:8px; background:#1a3d1a; border-bottom:3px solid #f0c050; align-items:center; }
  .pp-mobile-bar-inner select { padding:10px 8px; border:none; border-radius:8px; font-size:14px; outline:none; font-family:inherit; background:#fff; color:#333; flex-shrink:0; min-width:80px; max-width:110px; cursor:pointer; }
  .pp-mobile-bar-inner input { flex:1; padding:10px 14px; border:none; border-radius:8px; font-size:16px; outline:none; font-family:inherit; min-width:0; }
  .pp-mobile-bar-clear { background:none; border:none; color:#aaa; font-size:18px; cursor:pointer; padding:0 4px; flex-shrink:0; }
  .pp-mobile-bar-count { padding:5px 14px 8px; background:#1a3d1a; font-size:12px; color:#a8d5a8; }

  /* ── CONTAINER ── */
  .pp-container { padding:28px 40px; max-width:1280px; margin:0 auto; }

  /* ── PRODUCT GRID ── */
  .pp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:22px; }
  .pp-card { background:#fff; border-radius:12px; border:1px solid #e8e4dc; overflow:hidden; transition:box-shadow .2s,transform .15s; cursor:pointer; }
  .pp-card:hover { box-shadow:0 6px 24px rgba(0,0,0,0.12); transform:translateY(-2px); }
  .pp-card-img-box { height:168px; background:#f5f5f5; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; }
  .pp-card-img-box img { width:100%; height:100%; object-fit:cover; transition:transform .3s; }
  .pp-card:hover .pp-card-img-box img { transform:scale(1.04); }
  .pp-sale-badge { position:absolute; top:8px; right:8px; background:#cc0000; color:#fff; font-size:9px; font-weight:700; padding:3px 8px; border-radius:4px; letter-spacing:.5px; }
  .pp-cat-badge { position:absolute; top:8px; left:8px; background:#1f4d1f; color:#fff; font-size:9px; font-weight:700; padding:3px 8px; border-radius:4px; text-transform:capitalize; }
  .pp-card-body { padding:14px; }
  .pp-card-name { font-weight:700; font-size:14px; color:#111; margin-bottom:3px; line-height:1.3; }
  .pp-card-seller { font-size:11px; color:#888; margin-bottom:5px; }
  .pp-stars { display:flex; align-items:center; gap:4px; margin-bottom:6px; }
  .pp-card-price { color:#1f4d1f; font-weight:900; font-size:19px; margin-bottom:2px; }
  .pp-card-orig { color:#bbb; font-size:11px; text-decoration:line-through; margin-bottom:8px; }
  .pp-card-btn { width:100%; padding:10px; background:#1f4d1f; color:#fff; border:none; border-radius:7px; cursor:pointer; font-weight:700; font-size:13px; font-family:inherit; transition:background .2s; }
  .pp-card-btn:hover { background:#174014; }

  /* ── PAGINATION ── */
  .pp-pagination { display:flex; justify-content:center; align-items:center; gap:16px; padding:28px 0; }
  .pp-page-btn { padding:10px 20px; background:#1f4d1f; color:#fff; border:none; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:background .2s; }
  .pp-page-btn:hover { background:#174014; }
  .pp-page-btn:disabled { background:#e8e4dc; color:#aaa; cursor:not-allowed; }
  .pp-page-label { font-size:13px; color:#555; font-weight:500; }

  /* ── STATES ── */
  .pp-empty { text-align:center; color:#888; padding:60px 0; font-size:16px; }
  .pp-loader { text-align:center; color:#888; padding:80px 0; font-size:16px; }
  .pp-error { text-align:center; color:#cc0000; padding:60px 0; font-size:14px; }

  /* ── DETAIL ── */
  .pp-back-btn { background:none; border:none; color:#1f4d1f; font-weight:700; cursor:pointer; font-size:14px; margin-bottom:18px; display:inline-flex; align-items:center; gap:6px; padding:0; font-family:inherit; }
  .pp-detail-card { display:grid; grid-template-columns:1fr 1.1fr; gap:36px; background:#fff; padding:32px; border-radius:14px; margin-bottom:28px; border:1px solid #e8e4dc; }
  .pp-main-img-box { position:relative; height:360px; background:#f5f5f5; border-radius:10px; overflow:hidden; margin-bottom:12px; }
  .pp-main-img-box img { width:100%; height:100%; object-fit:cover; }
  .pp-img-placeholder { display:flex; align-items:center; justify-content:center; height:100%; font-size:80px; color:#ccc; }
  .pp-detail-sale { position:absolute; top:12px; right:12px; background:#cc0000; color:#fff; font-size:11px; font-weight:700; padding:4px 10px; border-radius:4px; }
  .pp-thumbs { display:flex; gap:8px; flex-wrap:wrap; }
  .pp-thumb { width:60px; height:60px; object-fit:cover; border-radius:7px; cursor:pointer; border:2px solid #eee; transition:border-color .2s; }
  .pp-thumb.active { border-color:#1f4d1f; }
  .pp-detail-cat { font-size:11px; font-weight:700; color:#c8860a; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; }
  .pp-detail-name { font-size:26px; font-weight:700; color:#111; margin:0 0 12px; line-height:1.25; }
  .pp-rating-row { display:flex; align-items:center; gap:8px; margin-bottom:16px; font-size:13px; color:#666; }
  .pp-price-row { display:flex; align-items:baseline; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
  .pp-price { font-size:34px; font-weight:900; color:#1f4d1f; }
  .pp-orig-price { font-size:16px; color:#bbb; text-decoration:line-through; }
  .pp-stock-info { font-size:13px; color:#888; margin-bottom:14px; }
  .pp-desc { color:#555; line-height:1.75; font-size:14px; margin-bottom:18px; }
  .pp-info-tag { display:inline-block; background:#f0fff4; color:#1f4d1f; font-size:12px; padding:5px 12px; border-radius:6px; margin-bottom:16px; border:1px solid #a8d5a8; }
  .pp-whatsapp-btn { display:block; text-align:center; background:#25D366; color:#fff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:700; font-size:14px; margin-bottom:12px; }
  .pp-add-btn { width:100%; padding:14px; background:#1f4d1f; color:#fff; border:none; border-radius:9px; font-weight:700; font-size:15px; cursor:pointer; margin-bottom:20px; font-family:inherit; transition:background .2s; }
  .pp-add-btn:hover:not(:disabled) { background:#174014; }
  .pp-add-btn:disabled { background:#ccc; cursor:not-allowed; }

  /* ── SELLER CARD ── */
  .pp-seller-card { background:#f7f5f0; border-radius:10px; padding:16px; border:1px solid #e8e4dc; }
  .pp-seller-label { font-size:10px; color:#888; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:5px; }
  .pp-seller-name { font-size:15px; font-weight:700; color:#111; margin-bottom:4px; }
  .pp-seller-meta { font-size:13px; color:#555; display:flex; flex-direction:column; gap:4px; margin:6px 0 10px; }
  .pp-seller-wa { display:inline-block; background:#25D366; color:#fff; text-decoration:none; padding:8px 16px; border-radius:6px; font-size:13px; font-weight:600; }

  /* ── REVIEWS ── */
  .pp-reviews { background:#fff; border-radius:14px; padding:28px; border:1px solid #e8e4dc; }
  .pp-reviews-title { font-size:20px; font-weight:700; color:#111; margin-bottom:24px; }
  .pp-rating-breakdown { display:flex; gap:36px; margin-bottom:28px; padding:20px; background:#f7f5f0; border-radius:10px; align-items:center; flex-wrap:wrap; }
  .pp-rating-big { text-align:center; min-width:90px; }
  .pp-rating-big-num { font-size:52px; font-weight:700; color:#1f4d1f; line-height:1; }
  .pp-rating-big-count { font-size:12px; color:#888; margin-top:6px; }
  .pp-rating-bars { flex:1; min-width:160px; display:flex; flex-direction:column; gap:8px; }
  .pp-bar-row { display:flex; align-items:center; gap:8px; }
  .pp-bar-label { font-size:12px; color:#666; width:22px; text-align:right; flex-shrink:0; }
  .pp-bar-bg { flex:1; height:8px; background:#e8e4dc; border-radius:99px; overflow:hidden; }
  .pp-bar-fill { height:100%; background:#f0c050; border-radius:99px; }
  .pp-bar-count { font-size:12px; color:#888; width:20px; text-align:right; flex-shrink:0; }
  .pp-review-list { display:flex; flex-direction:column; gap:20px; margin-bottom:28px; }
  .pp-review-item { border-bottom:1px solid #f0ece4; padding-bottom:18px; }
  .pp-review-header { display:flex; align-items:flex-start; gap:10px; margin-bottom:8px; }
  .pp-review-avatar { width:36px; height:36px; background:#1f4d1f; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#f0c050; font-weight:700; font-size:14px; flex-shrink:0; }
  .pp-review-user { font-size:14px; font-weight:600; color:#111; margin-bottom:3px; }
  .pp-review-date { margin-left:auto; font-size:12px; color:#bbb; flex-shrink:0; }
  .pp-review-comment { font-size:14px; color:#555; line-height:1.7; margin:0; }
  .pp-no-reviews { color:#888; font-size:14px; text-align:center; padding:24px 0; }
  .pp-review-form { background:#f7f5f0; border-radius:10px; padding:22px; margin-top:16px; }
  .pp-review-form h3 { font-size:16px; font-weight:700; color:#111; margin:0 0 16px; }
  .pp-review-field { margin-bottom:16px; }
  .pp-review-label { display:block; font-size:13px; color:#333; font-weight:600; margin-bottom:6px; }
  .pp-review-select, .pp-review-input, .pp-review-textarea { width:100%; padding:11px 14px; border:1.5px solid #ddd; border-radius:8px; font-size:14px; outline:none; font-family:inherit; box-sizing:border-box; transition:border-color .2s; }
  .pp-review-select:focus, .pp-review-input:focus, .pp-review-textarea:focus { border-color:#1f4d1f; }
  .pp-review-textarea { resize:vertical; }
  .pp-review-submit { padding:12px 28px; background:#1f4d1f; color:#fff; border:none; border-radius:7px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; transition:background .2s; }
  .pp-review-submit:hover:not(:disabled) { background:#174014; }
  .pp-review-submit:disabled { background:#ccc; cursor:not-allowed; }
  .pp-review-ok { background:#f0fff4; color:#1f4d1f; padding:10px 14px; border-radius:6px; font-size:13px; margin-bottom:14px; border:1px solid #a8d5a8; }
  .pp-review-err { background:#fff0f0; color:#cc0000; padding:10px 14px; border-radius:6px; font-size:13px; margin-bottom:14px; border:1px solid #ffb3b3; }

  /* ── TABLET (≤900px) ── */
  @media (max-width:900px) {
    .pp-nav { padding:10px 20px; }
    .pp-search-group { display:none; }
    .pp-mobile-bar { display:block; top:54px; }
    .pp-container { padding:20px; }
    .pp-detail-card { grid-template-columns:1fr; gap:24px; padding:20px; }
    .pp-main-img-box { height:280px; }
    .pp-detail-name { font-size:22px; }
    .pp-price { font-size:28px; }
    .pp-reviews { padding:20px; }
  }

  /* ── MOBILE (≤600px) ── */
  @media (max-width:600px) {
    .pp-nav { padding:8px 14px; gap:8px; }
    .pp-nav-name { font-size:15px; }
    .pp-nav-logo { width:30px; height:30px; }
    .pp-nav-right { gap:8px; }
    .pp-mobile-bar { top:48px; }
    .pp-mobile-bar-inner { padding:8px 10px; gap:6px; }
    .pp-container { padding:10px; }
    .pp-grid { grid-template-columns:1fr 1fr; gap:10px; }
    .pp-card-img-box { height:130px; }
    .pp-card-body { padding:10px; }
    .pp-card-name { font-size:12px; }
    .pp-card-price { font-size:15px; }
    .pp-card-btn { font-size:11px; padding:8px; }
    .pp-detail-card { padding:14px; gap:14px; border-radius:10px; }
    .pp-main-img-box { height:230px; }
    .pp-detail-name { font-size:19px; }
    .pp-price { font-size:24px; }
    .pp-desc { font-size:13px; }
    .pp-reviews { padding:14px; border-radius:10px; }
    .pp-reviews-title { font-size:17px; }
    .pp-rating-breakdown { flex-direction:column; gap:14px; padding:14px; }
    .pp-rating-big-num { font-size:44px; }
    .pp-review-form { padding:14px; }
    .pp-thumb { width:48px; height:48px; }
  }

  /* ── SMALLEST (≤380px) ── */
  @media (max-width:380px) {
    .pp-grid { grid-template-columns:1fr; }
    .pp-mobile-bar-inner select { display:none; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Star rating helper
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // shared
  const [cartCount, setCartCount]   = useState(0);
  const [categories, setCategories] = useState(["All"]);

  // listing
  const [products, setProducts]       = useState([]);
  const [page, setPage]               = useState(1);
  const [meta, setMeta]               = useState(null);
  const [searchTerm, setSearchTerm]   = useState("");
  // Pre-filter from a landing-page "See all" / category quick-link, e.g. /products?category=grains.
  const [searchParams] = useSearchParams();
  const [selectedCat, setSelectedCat] = useState(searchParams.get("category") || "All");
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError]     = useState(null);

  // detail
  const [product, setProduct]             = useState(null);
  const [reviews, setReviews]             = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeImg, setActiveImg]         = useState(0);

  // review form
  const [reviewForm, setReviewForm]           = useState({ rating: 5, comment: "", order_id: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess]       = useState(false);
  const [reviewError, setReviewError]           = useState(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  })();

  // sync cart count
  useEffect(() => {
    const sync = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.reduce((a, i) => a + (i.quantity || 0), 0));
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // load categories
  useEffect(() => {
    getCategories()
      .then((res) => {
        const raw = res.data?.categories || res.data || [];
        const names = (Array.isArray(raw) ? raw : [])
          .map((c) => (typeof c === "string" ? c : c.slug || c.name || c.category))
          .filter(Boolean);
        setCategories(["All", ...names]);
      })
      .catch(() => {});
  }, []);

  // reset page on filter change
  useEffect(() => { setPage(1); }, [selectedCat, searchTerm]);

  // load product list
  useEffect(() => {
    if (id) return;
    setListLoading(true);
    setListError(null);
    const sellerId = searchParams.get("seller_id");
    getAllProducts({
      page,
      per_page: 20,
      ...(selectedCat !== "All" && { category: selectedCat }),
      ...(searchTerm && { search: searchTerm }),
      ...(sellerId && { seller_id: sellerId }),
    })
      .then((res) => {
        const pData = res.data;
        const data = pData?.data || (Array.isArray(pData) ? pData : []);
        setProducts(data);
        setMeta(pData?.meta || (pData?.last_page ? pData : null));
      })
      .catch(() => setListError("Failed to load products. Please check your connection."))
      .finally(() => setListLoading(false));
  }, [id, page, selectedCat, searchTerm, searchParams]);

  // load product detail
  useEffect(() => {
    if (!id) return;
    setDetailLoading(true);
    setProduct(null);
    setReviews([]);
    setReviewSummary(null);
    setActiveImg(0);
    setReviewSuccess(false);
    setReviewError(null);
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

  // add to cart
  const handleAddToCart = useCallback((p) => {
    if (!p) return;
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = cart.findIndex((item) => item.id === p.id);
    if (idx > -1) {
      cart[idx].quantity += 1;
    } else {
      cart.push({
        id: p.id,
        name: p.name,
        price: Number(p.discount_price || p.price),
        image: p.images?.[0]?.image_url || p.images?.[0]?.url || p.image || "",
        quantity: 1,
        unit: p.unit || "",
        seller: p.seller?.business_name || "",
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    setCartCount(cart.reduce((a, i) => a + (i.quantity || 0), 0));
    navigate("/cart");
  }, [navigate]);

  // submit review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return;
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
      setReviewError(err.response?.data?.message || "Failed to submit review. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "";

  // ── Nav — uses same pattern as HomePage for reliable rendering ─────────────
  const token = localStorage.getItem("token");
  const [menuOpen, setMenuOpen] = useState(false);

  const Nav = () => (
    <>
      <style>{CSS}</style>

      {/* Top bar */}
      <div style={{ background:"#1f4d1f", color:"#fff", fontSize:12, padding:"6px 40px", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:4 }}>
        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          <span>📍 No 6 faith avenue off ekenwan Rd Benin City</span>
          <span>✉ support@achoice.ng</span>
        </div>
        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          <span>📞 09067794991</span>
          <span>Mon - Sat: 07:00am to 06:00pm</span>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ background:"#1f4d1f", padding:"10px 40px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:200, gap:12, flexWrap:"nowrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", flexShrink:0 }} onClick={() => navigate("/products")}>
          <img src="/android-chrome-192x192.png" alt="Achoice"
            style={{ width:36, height:36, borderRadius:6, objectFit:"contain" }}
            onError={(e) => { e.target.style.display = "none"; }} />
          <div style={{ fontWeight:700, fontSize:17, color:"#fff", whiteSpace:"nowrap" }}>
            ACHOICE <span style={{ color:"#f0c050" }}>MARKET</span>
          </div>
        </div>

        {/* Desktop search — hidden on mobile via CSS */}
        {!id && (
          <div className="pp-search-group">
            <select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="search"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {/* Right side actions */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <div style={{ fontSize:22, cursor:"pointer", position:"relative", color:"#fff", display:"flex", alignItems:"center" }}
            onClick={() => navigate("/cart")}>
            🛒
            {cartCount > 0 && (
              <span style={{ position:"absolute", top:-8, right:-10, background:"#f0c050", color:"#1f4d1f", fontSize:10, fontWeight:700, width:18, height:18, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid #1f4d1f" }}>
                {cartCount}
              </span>
            )}
          </div>
          {token && <NotificationBell />}
          {token ? (
            <BuyerDropdown cartCount={cartCount} />
          ) : (
            <div style={{ display:"flex", gap:8 }}>
              <button style={{ padding:"8px 14px", border:"1px solid #fff", color:"#fff", borderRadius:6, fontSize:13, background:"transparent", cursor:"pointer", fontFamily:"inherit" }}
                onClick={() => navigate("/login")}>Sign In</button>
              <button style={{ padding:"8px 14px", background:"#f0c050", color:"#1a3d1a", border:"none", borderRadius:6, fontSize:13, cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}
                onClick={() => navigate("/register")}>Get Started</button>
            </div>
          )}
          {/* Mobile hamburger */}
          <button
            className="pp-hamburger-btn"
            style={{ background:"none", border:"none", fontSize:24, cursor:"pointer", color:"#fff", padding:4, display:"none" }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:999, background:"rgba(0,0,0,0.5)" }} onClick={() => setMenuOpen(false)}>
          <div style={{ position:"absolute", top:0, right:0, bottom:0, width:"75%", maxWidth:300, background:"#fff", display:"flex", flexDirection:"column", boxShadow:"-4px 0 20px rgba(0,0,0,0.2)" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ background:"#1f4d1f", padding:"20px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ color:"#fff", fontWeight:700, fontSize:16 }}>Menu</span>
              <button style={{ background:"none", border:"none", color:"#fff", fontSize:22, cursor:"pointer" }} onClick={() => setMenuOpen(false)}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
              {[
                { label:"🏠 Home", path:"/" },
                { label:"🛍️ Shop Products", path:"/products" },
                { label:"👤 My Profile", path:"/profile" },
                { label:"🛒 Cart", path:"/cart" },
                { label:"📦 My Orders", path:"/orders" },
                { label:"💰 Apply for Loan", path:"/loans/apply" },
                { label:"📋 My Loans", path:"/loans/repay" },
                { label:"📝 Complaints & Refunds", path:"/complaints" },
                { label:"🔔 Notifications", path:"/notifications" },
              ].map((item) => (
                <div key={item.path}
                  style={{ padding:"14px 20px", cursor:"pointer", fontSize:15, color:"#222", borderBottom:"1px solid #f5f5f5" }}
                  onClick={() => { navigate(item.path); setMenuOpen(false); }}>
                  {item.label}
                </div>
              ))}
            </div>
            <div style={{ padding:"16px 20px", borderTop:"1px solid #eee" }}>
              {token ? (
                <button style={{ width:"100%", padding:"12px", background:"#fff0f0", color:"#cc0000", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
                  onClick={() => { localStorage.clear(); navigate("/login"); }}>
                  🚪 Logout
                </button>
              ) : (
                <div style={{ display:"flex", gap:8 }}>
                  <button style={{ flex:1, padding:"12px", background:"#fff", color:"#1f4d1f", border:"1px solid #1f4d1f", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
                    onClick={() => { navigate("/login"); setMenuOpen(false); }}>Sign In</button>
                  <button style={{ flex:1, padding:"12px", background:"#1f4d1f", color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
                    onClick={() => { navigate("/register"); setMenuOpen(false); }}>Get Started</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile search bar */}
      {!id && (
        <div className="pp-mobile-bar">
          <div className="pp-mobile-bar-inner">
            <select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="search"
              placeholder="🔍 Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
            {searchTerm && (
              <button className="pp-mobile-bar-clear" onClick={() => setSearchTerm("")}>✕</button>
            )}
          </div>
          {searchTerm && (
            <div className="pp-mobile-bar-count">
              {products.length} result{products.length !== 1 ? "s" : ""} for &quot;{searchTerm}&quot;
            </div>
          )}
        </div>
      )}
    </>
  );

  // ── Loading / error states ───────────────────────────────────────────────
  if (!id && listLoading)
    return (
      <div className="pp-wrap">
        <Nav />
        <div className="pp-loader">Loading products…</div>
      </div>
    );

  if (!id && listError)
    return (
      <div className="pp-wrap">
        <Nav />
        <div className="pp-error">
          {listError}{" "}
          <button
            onClick={() => { setListError(null); setPage(1); }}
            style={{ marginLeft:8, padding:"6px 14px", background:"#1f4d1f", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}
          >Retry</button>
        </div>
      </div>
    );

  if (id && detailLoading)
    return (
      <div className="pp-wrap">
        <Nav />
        <div className="pp-loader">Loading product…</div>
      </div>
    );

  if (id && !product && !detailLoading)
    return (
      <div className="pp-wrap">
        <Nav />
        <div className="pp-container">
          <button className="pp-back-btn" onClick={() => navigate("/products")}>← Back to Products</button>
          <div className="pp-empty">Product not found.</div>
        </div>
      </div>
    );

  // ── Detail data ──────────────────────────────────────────────────────────
  const images    = product
    ? product.images?.length > 0
      ? product.images.map((img) => img.image_url || img.url || img)
      : product.image ? [product.image] : []
    : [];
  const hasDisc   = product && product.discount_price && Number(product.discount_price) > 0;
  const dispPrice = product ? (hasDisc ? product.discount_price : product.price) : 0;
  const avgRating = parseFloat(product?.reviews_avg_rating || 0);
  const rvCount   = Number(product?.reviews_count || 0);
  const seller    = product?.seller;

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="pp-wrap">
      <Nav />
      <div className="pp-container">

        {/* ════════════════════ LISTING ════════════════════ */}
        {!id && (
          <>
            {products.length === 0 ? (
              <div className="pp-empty">
                {searchTerm
                  ? `No products found for "${searchTerm}"`
                  : "No products available yet."}
              </div>
            ) : (
              <div className="pp-grid">
                {products.map((p) => {
                  const pDisc = p.discount_price && Number(p.discount_price) > 0;
                  const pImg  = p.images?.[0]?.image_url || p.images?.[0]?.url || p.image;
                  return (
                    <div
                      key={p.id}
                      className="pp-card"
                      onClick={() => navigate(`/product/${p.id}`)}
                    >
                      <div className="pp-card-img-box">
                        {pImg
                          ? <img src={pImg} alt={p.name} loading="lazy" />
                          : <span style={{ fontSize: 40 }}>📦</span>}
                        {pDisc && <div className="pp-sale-badge">SALE</div>}
                        {p.category && <div className="pp-cat-badge">{p.category}</div>}
                      </div>
                      <div className="pp-card-body">
                        <div className="pp-card-name">{p.name}</div>
                        <div className="pp-card-seller">
                          {p.seller?.business_name || "ACHOICE Seller"}
                        </div>
                        <div className="pp-stars">
                          <Stars rating={p.reviews_avg_rating || 0} size={12} />
                          <span style={{ fontSize: 11, color: "#888" }}>
                            ({p.reviews_count || 0})
                          </span>
                        </div>
                        <div className="pp-card-price">
                          ₦{Number(pDisc ? p.discount_price : p.price).toLocaleString()}
                        </div>
                        {pDisc && (
                          <div className="pp-card-orig">
                            ₦{Number(p.price).toLocaleString()}
                          </div>
                        )}
                        <button
                          className="pp-card-btn"
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                        >
                          Add &amp; Checkout
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {meta && (meta.last_page || meta.total_pages || 1) > 1 && (
              <div className="pp-pagination">
                <button
                  className="pp-page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >← Prev</button>
                <span className="pp-page-label">
                  Page {page} of {meta.last_page || meta.total_pages || 1}
                </span>
                <button
                  className="pp-page-btn"
                  disabled={page >= (meta.last_page || meta.total_pages || 1)}
                  onClick={() => setPage((p) => p + 1)}
                >Next →</button>
              </div>
            )}
          </>
        )}

        {/* ════════════════════ DETAIL ════════════════════ */}
        {id && product && (
          <>
            <button className="pp-back-btn" onClick={() => navigate("/products")}>
              ← Back to Products
            </button>

            <div className="pp-detail-card">
              {/* Images column */}
              <div>
                <div className="pp-main-img-box">
                  {images.length > 0
                    ? <img src={images[activeImg]} alt={product.name} />
                    : <div className="pp-img-placeholder">🌿</div>}
                  {hasDisc && <div className="pp-detail-sale">SALE</div>}
                </div>
                {images.length > 1 && (
                  <div className="pp-thumbs">
                    {images.map((img, i) => (
                      <img
                        key={i} src={img} alt=""
                        className={`pp-thumb${i === activeImg ? " active" : ""}`}
                        onClick={() => setActiveImg(i)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Info column */}
              <div>
                {product.category && (
                  <div className="pp-detail-cat">{product.category}</div>
                )}
                <h1 className="pp-detail-name">{product.name}</h1>

                <div className="pp-rating-row">
                  <Stars rating={avgRating} size={18} />
                  <span>
                    {avgRating.toFixed(1)} · {rvCount} review{rvCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="pp-price-row">
                  <div className="pp-price">₦{Number(dispPrice).toLocaleString()}</div>
                  {hasDisc && (
                    <div className="pp-orig-price">₦{Number(product.price).toLocaleString()}</div>
                  )}
                </div>

                {product.quantity !== undefined && (
                  <div className="pp-stock-info">
                    {Number(product.quantity) > 0
                      ? `${Number(product.quantity)} ${product.unit || "units"} in stock`
                      : "Currently out of stock"}
                  </div>
                )}

                {product.description && (
                  <p className="pp-desc">{product.description}</p>
                )}

                {product.min_order_qty && (
                  <div className="pp-info-tag">
                    📦 Min. order: {product.min_order_qty} {product.unit || "units"}
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
                  disabled={Number(product.quantity) === 0}
                >
                  🛒 {Number(product.quantity) === 0 ? "Out of Stock" : "Add to Cart"}
                </button>

                {seller && (
                  <div className="pp-seller-card">
                    <div className="pp-seller-label">Sold by</div>
                    <div className="pp-seller-name">{seller.business_name}</div>
                    {parseFloat(seller.rating) > 0 && (
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                        <Stars rating={parseFloat(seller.rating)} size={13} />
                        <span style={{ fontSize:13, color:"#666" }}>
                          {parseFloat(seller.rating).toFixed(1)}
                        </span>
                      </div>
                    )}
                    <div className="pp-seller-meta">
                      {seller.total_sales > 0 && <span>🛍 {seller.total_sales} sales</span>}
                      {(seller.business_address || seller.state) && (
                        <span>📍 {seller.business_address || seller.state}</span>
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

            {/* Reviews section */}
            <div className="pp-reviews">
              <div className="pp-reviews-title">Customer Reviews</div>

              {rvCount > 0 && reviewSummary && (
                <div className="pp-rating-breakdown">
                  <div className="pp-rating-big">
                    <div className="pp-rating-big-num">{avgRating.toFixed(1)}</div>
                    <Stars rating={avgRating} size={22} />
                    <div className="pp-rating-big-count">{rvCount} reviews</div>
                  </div>
                  <div className="pp-rating-bars">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = Number(reviewSummary[star] || 0);
                      const pct   = rvCount > 0 ? Math.round((count / rvCount) * 100) : 0;
                      return (
                        <div key={star} className="pp-bar-row">
                          <span className="pp-bar-label">{star}★</span>
                          <div className="pp-bar-bg">
                            <div className="pp-bar-fill" style={{ width: `${pct}%` }} />
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
                          {r.user?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="pp-review-user">{r.user?.name || "Anonymous"}</div>
                          <Stars rating={r.rating} size={13} />
                        </div>
                        <div className="pp-review-date">{fmtDate(r.created_at)}</div>
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
                    <div className="pp-review-ok">✅ Review submitted! Thank you.</div>
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
                          setReviewForm({ ...reviewForm, rating: Number(e.target.value) })
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
                        <span style={{ color:"#aaa", fontWeight:400 }}>(optional)</span>
                      </label>
                      <input
                        className="pp-review-input"
                        type="text"
                        placeholder="Your order ID e.g. ACH-XXXXXXXX"
                        value={reviewForm.order_id}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, order_id: e.target.value })
                        }
                      />
                    </div>
                    <div className="pp-review-field">
                      <label className="pp-review-label">Your Review</label>
                      <textarea
                        className="pp-review-textarea"
                        rows={4}
                        required
                        placeholder="Share your honest experience with this product…"
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, comment: e.target.value })
                        }
                      />
                    </div>
                    <button
                      type="submit"
                      className="pp-review-submit"
                      disabled={reviewSubmitting || !reviewForm.comment.trim()}
                    >
                      {reviewSubmitting ? "Submitting…" : "Submit Review →"}
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
