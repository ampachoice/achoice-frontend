import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, getAllProducts, getProductReviews, submitProductReview } from '../../services/productService';
import BuyerDropdown from '../../components/buyer/BuyerDropdown';

// ⭐ Star rating display
function StarRating({ rating = 0, size = 14 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ color: '#f0c050', fontSize: size }}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return '★';
        if (i === full && half) return '⯨';
        return '☆';
      }).join('')}
    </span>
  );
}

export default function ProductPage() {
  const { id } = useParams(); // undefined on /products, a string on /product/:id
  const navigate = useNavigate();

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  // ── Listing state ─────────────────────────────────────────────────────────
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);

  // ── Detail state ──────────────────────────────────────────────────────────
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  // ── Review form ───────────────────────────────────────────────────────────
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', order_id: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cartCount, setCartCount] = useState(0);

  const categories = ['All', ...new Set(allProducts.map(p => p.category).filter(Boolean))];

  // ── Effect: Listing (/products) ───────────────────────────────────────────
  useEffect(() => {
    if (id) return; // skip — detail page handles this
    setListLoading(true);
    setListError(null);
    getAllProducts()
      .then(res => {
        const data = res.data?.data || res.data || [];
        setAllProducts(data);
        setFilteredProducts(data);
      })
      .catch(() => setListError('Failed to load products. Please try again.'))
      .finally(() => setListLoading(false));
  }, []); // only runs once on mount for listing

  // ── Effect: Detail (/product/:id) ────────────────────────────────────────
  useEffect(() => {
    if (!id) return; // skip — listing page handles this
    setDetailLoading(true);
    setProduct(null);
    setReviews([]);
    setActiveImg(0);
    Promise.all([
      getProduct(id),
      getProductReviews(id),
    ])
      .then(([productRes, reviewsRes]) => {
        setProduct(productRes.data);
        const rd = reviewsRes.data;
        setReviews(rd?.data || rd?.reviews || (Array.isArray(rd) ? rd : []));
        setReviewSummary(rd?.summary || null);
      })
      .catch(() => setProduct(null))
      .finally(() => setDetailLoading(false));
  }, [id]);

  // ── Effect: Cart count ────────────────────────────────────────────────────
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((acc, item) => acc + item.quantity, 0));
  }, []);

  // ── Effect: Filter listing ────────────────────────────────────────────────
  useEffect(() => {
    let results = allProducts;
    if (selectedCategory !== 'All') results = results.filter(p => p.category === selectedCategory);
    if (searchTerm) results = results.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredProducts(results);
  }, [searchTerm, selectedCategory, allProducts]);

  const handleAddToCart = (targetProduct) => {
    if (!targetProduct) return;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex(item => item.id === targetProduct.id);
    if (idx > -1) {
      cart[idx].quantity += 1;
    } else {
      cart.push({
        id: targetProduct.id,
        name: targetProduct.name,
        price: targetProduct.discount_price || targetProduct.price,
        image: targetProduct.images?.[0]?.url || targetProduct.image,
        quantity: 1,
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    setCartCount(cart.reduce((acc, item) => acc + item.quantity, 0));
    navigate('/cart');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      await submitProductReview(id, reviewForm);
      setReviewSuccess(true);
      setReviewForm({ rating: 5, comment: '', order_id: '' });
      const res = await getProductReviews(id);
      const rd = res.data;
      setReviews(rd?.data || rd?.reviews || (Array.isArray(rd) ? rd : []));
      setReviewSummary(rd?.summary || null);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ── Navbar (shared) ───────────────────────────────────────────────────────
  const Navbar = () => (
    <nav style={s.nav}>
      <div style={s.navLeft} onClick={() => navigate('/products')}>
        <img src="/android-chrome-192x192.png" alt="Logo" style={s.logoImg} />
        <div style={s.logoText}>ACHOICE <span style={{ color: '#f0c050' }}>MARKET</span></div>
        
      </div>

      {!id && (
        <div style={s.searchControlGroup}>
          <select style={s.catDropdown} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input
            style={s.searchInput}
            placeholder="Search products..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <div style={s.navRight}>
        <div style={s.cartIcon} onClick={() => navigate('/cart')}>
          🛒
          {cartCount > 0 && <span style={s.badge}>{cartCount}</span>}
        </div>
        <BuyerDropdown cartCount={cartCount} />
      </div>
    </nav>
  );

  // ── Loading / error states ─────────────────────────────────────────────────
  if (!id && listLoading) return (
    <div style={s.page}><Navbar /><div style={s.center}>Loading products...</div></div>
  );
  if (!id && listError) return (
    <div style={s.page}><Navbar /><div style={s.center}>{listError}</div></div>
  );
  if (id && detailLoading) return (
    <div style={s.page}><Navbar /><div style={s.center}>Loading product...</div></div>
  );
  if (id && !product && !detailLoading) return (
    <div style={s.page}><Navbar /><div style={s.center}>Product not found.</div></div>
  );

  // ── Derived detail values ─────────────────────────────────────────────────
  const images = product?.images?.length > 0
    ? product.images.map(img => img.url || img)
    : product?.image ? [product.image] : [];
  const hasDiscount = product?.discount_price && Number(product.discount_price) > 0;
  const displayPrice = hasDiscount ? product.discount_price : product?.price;
  const avgRating = parseFloat(product?.reviews_avg_rating || 0);
  const reviewCount = product?.reviews_count || 0;
  const seller = product?.seller;

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* ══ LISTING PAGE (/products) ══════════════════════════════════════ */}
        {!id && (
          <>
            {filteredProducts.length === 0 ? (
              <p style={s.emptyMsg}>No products found.</p>
            ) : (
              <div style={s.grid}>
                {filteredProducts.map(p => {
                  const pDiscount = p.discount_price && Number(p.discount_price) > 0;
                  const pImg = p.images?.[0]?.url || p.image;
                  return (
                    <div key={p.id} style={s.card}>
                      <div style={s.imgBox} onClick={() => navigate(`/product/${p.id}`)}>
                        {pImg
                          ? <img src={pImg} style={s.img} alt={p.name} />
                          : <span style={{ fontSize: 40 }}>📦</span>
                        }
                        {pDiscount && <div style={s.saleBadge}>SALE</div>}
                      </div>
                      <div style={s.cardBody}>
                        <div style={s.cardName}>{p.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                          <StarRating rating={parseFloat(p.reviews_avg_rating || 0)} />
                          <span style={{ fontSize: 11, color: '#888' }}>({p.reviews_count || 0})</span>
                        </div>
                        <div style={s.cardPrice}>
                          ₦{Number(pDiscount ? p.discount_price : p.price).toLocaleString()}
                        </div>
                        {pDiscount && (
                          <div style={s.cardOriginalPrice}>₦{Number(p.price).toLocaleString()}</div>
                        )}
                        <button style={s.viewBtn} onClick={() => handleAddToCart(p)}>
                          Add & Checkout
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══ DETAIL PAGE (/product/:id) ════════════════════════════════════ */}
        {id && product && (
          <div style={s.detailWrapper}>
            <button onClick={() => navigate('/products')} style={s.backBtn}>← Back to Products</button>

            <div style={s.detailCard}>
              {/* Image Carousel */}
              <div style={s.detailImgSide}>
                <div style={s.mainImgBox}>
                  {images.length > 0
                    ? <img src={images[activeImg]} alt={product.name} style={s.mainImg} />
                    : <div style={s.imgPlaceholder}>🌿</div>
                  }
                  {hasDiscount && <div style={s.detailSaleBadge}>SALE</div>}
                </div>
                {images.length > 1 && (
                  <div style={s.thumbRow}>
                    {images.map((img, i) => (
                      <img
                        key={i} src={img} alt=""
                        style={{ ...s.thumb, border: i === activeImg ? '2px solid #1f4d1f' : '2px solid #eee' }}
                        onClick={() => setActiveImg(i)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={s.detailInfoSide}>
                <div style={s.detailCategory}>{product.category}</div>
                <h1 style={s.detailName}>{product.name}</h1>
                <div style={s.ratingRow}>
                  <StarRating rating={avgRating} size={18} />
                  <span style={s.ratingText}>{avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                </div>
                <div style={s.priceRow}>
                  <div style={s.detailPrice}>₦{Number(displayPrice).toLocaleString()}</div>
                  {hasDiscount && <div style={s.detailOriginalPrice}>₦{Number(product.price).toLocaleString()}</div>}
                </div>
                <p style={s.detailDesc}>{product.description}</p>
                {product.min_order_qty && (
                  <div style={s.infoTag}>Min. order: {product.min_order_qty} units</div>
                )}
                {product.whatsapp_number && (
                  <a
                    href={`https://wa.me/${product.whatsapp_number.replace(/\D/g, '')}?text=Hi, I'm interested in ${encodeURIComponent(product.name)}`}
                    target="_blank" rel="noreferrer" style={s.whatsappBtn}
                  >
                    💬 Chat on WhatsApp
                  </a>
                )}
                <button style={s.addBtn} onClick={() => handleAddToCart(product)}>
                  🛒 Add to Cart
                </button>

                {/* Seller */}
                {seller && (
                  <div style={s.sellerCard}>
                    <div style={s.sellerTitle}>Sold by</div>
                    <div style={s.sellerName}>{seller.business_name}</div>
                    {seller.rating > 0 && (
                      <div style={s.sellerRatingRow}>
                        <StarRating rating={parseFloat(seller.rating)} size={13} />
                        <span style={s.sellerRatingText}>{parseFloat(seller.rating).toFixed(1)}</span>
                      </div>
                    )}
                    <div style={s.sellerMeta}>
                      {seller.total_sales > 0 && <span>🛍 {seller.total_sales} sales</span>}
                      {seller.state && <span>📍 {seller.business_address || seller.state}</span>}
                    </div>
                    {seller.whatsapp_number && (
                      <a href={`https://wa.me/${seller.whatsapp_number.replace(/\D/g, '')}`}
                        target="_blank" rel="noreferrer" style={s.sellerWhatsapp}>
                        💬 Contact Seller
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Reviews */}
            <div style={s.reviewsSection}>
              <h2 style={s.reviewsTitle}>Customer Reviews</h2>
              {reviewSummary && (
                <div style={s.ratingBreakdown}>
                  <div style={s.ratingBig}>
                    <div style={s.ratingBigNum}>{avgRating.toFixed(1)}</div>
                    <StarRating rating={avgRating} size={22} />
                    <div style={s.ratingBigCount}>{reviewCount} reviews</div>
                  </div>
                  <div style={s.ratingBars}>
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviewSummary[star] || 0;
                      const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                      return (
                        <div key={star} style={s.ratingBarRow}>
                          <span style={s.ratingBarLabel}>{star}★</span>
                          <div style={s.ratingBarBg}>
                            <div style={{ ...s.ratingBarFill, width: `${pct}%` }} />
                          </div>
                          <span style={s.ratingBarCount}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {reviews.length > 0 ? (
                <div style={s.reviewList}>
                  {reviews.map((r, i) => (
                    <div key={r.id || i} style={s.reviewItem}>
                      <div style={s.reviewHeader}>
                        <div style={s.reviewAvatar}>{r.user?.name?.charAt(0) || '?'}</div>
                        <div>
                          <div style={s.reviewUser}>{r.user?.name || 'Anonymous'}</div>
                          <StarRating rating={r.rating} size={13} />
                        </div>
                        <div style={s.reviewDate}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        </div>
                      </div>
                      <p style={s.reviewComment}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={s.noReviews}>No reviews yet. Be the first to review this product!</p>
              )}
              {user && (
                <div style={s.reviewFormBox}>
                  <h3 style={s.reviewFormTitle}>Leave a Review</h3>
                  {reviewSuccess && <div style={s.reviewSuccessMsg}>✅ Review submitted! Thank you.</div>}
                  {reviewError && <div style={s.reviewErrorMsg}>{reviewError}</div>}
                  <form onSubmit={handleReviewSubmit}>
                    <div style={s.reviewField}>
                      <label style={s.reviewLabel}>Rating</label>
                      <select style={s.reviewSelect} value={reviewForm.rating}
                        onChange={e => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}>
                        {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Star{n>1?'s':''} {'★'.repeat(n)}</option>)}
                      </select>
                    </div>
                    <div style={s.reviewField}>
                      <label style={s.reviewLabel}>Order ID (optional)</label>
                      <input style={s.reviewInput} type="text" placeholder="Your order ID"
                        value={reviewForm.order_id}
                        onChange={e => setReviewForm({ ...reviewForm, order_id: e.target.value })} />
                    </div>
                    <div style={s.reviewField}>
                      <label style={s.reviewLabel}>Comment</label>
                      <textarea style={s.reviewTextarea} rows={4} required
                        placeholder="Share your experience..."
                        value={reviewForm.comment}
                        onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} />
                    </div>
                    <button type="submit"
                      style={reviewSubmitting ? s.reviewSubmitDisabled : s.reviewSubmit}
                      disabled={reviewSubmitting}>
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#fcfbf7', fontFamily: 'Arial, sans-serif' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#888', fontSize: 16 },
  emptyMsg: { textAlign: 'center', color: '#888', padding: 60, fontSize: 16 },
  nav: { background: '#1f4d1f', padding: '10px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', position: 'sticky', top: 0, zIndex: 100 },
  navLeft: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' },
  logoImg: { width: 35, height: 35, borderRadius: 4 },
  logoText: { fontWeight: 'bold', fontSize: 18 },
  searchControlGroup: { flex: 1, maxWidth: 500, margin: '0 30px', display: 'flex', background: '#fff', borderRadius: 25, overflow: 'hidden', border: '2px solid #f0c050' },
  catDropdown: { padding: '8px 12px', border: 'none', borderRight: '1px solid #eee', background: '#f9f9f9', fontSize: 13, outline: 'none' },
  searchInput: { flex: 1, padding: '10px 15px', border: 'none', outline: 'none', fontSize: 14 },
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  cartIcon: { fontSize: 22, cursor: 'pointer', position: 'relative' },
  badge: { position: 'absolute', top: -8, right: -10, background: '#f0c050', color: '#1f4d1f', fontSize: 10, fontWeight: 'bold', width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1f4d1f' },
  container: { padding: '30px 40px', maxWidth: 1200, margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 24 },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' },
  imgBox: { height: 160, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  saleBadge: { position: 'absolute', top: 8, right: 8, background: '#e53935', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 },
  cardBody: { padding: 14 },
  cardName: { fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 4 },
  cardPrice: { color: '#1f4d1f', fontWeight: 900, fontSize: 18 },
  cardOriginalPrice: { color: '#aaa', fontSize: 12, textDecoration: 'line-through', marginBottom: 6 },
  viewBtn: { width: '100%', padding: 10, background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, marginTop: 8, fontSize: 13 },
  detailWrapper: { maxWidth: 960, margin: '0 auto' },
  backBtn: { background: 'none', border: 'none', color: '#1f4d1f', fontWeight: 700, cursor: 'pointer', marginBottom: 16, fontSize: 14 },
  detailCard: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 40, background: '#fff', padding: 30, borderRadius: 15, marginBottom: 32 },
  detailImgSide: {},
  mainImgBox: { position: 'relative', height: 340, background: '#f5f5f5', borderRadius: 10, overflow: 'hidden', marginBottom: 12 },
  mainImg: { width: '100%', height: '100%', objectFit: 'cover' },
  imgPlaceholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 72 },
  detailSaleBadge: { position: 'absolute', top: 12, right: 12, background: '#e53935', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 4 },
  thumbRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  thumb: { width: 64, height: 64, objectFit: 'cover', borderRadius: 6, cursor: 'pointer' },
  detailInfoSide: {},
  detailCategory: { fontSize: 11, fontWeight: 700, color: '#c8860a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  detailName: { fontSize: 26, fontWeight: 700, color: '#111', margin: '0 0 12px' },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  ratingText: { fontSize: 13, color: '#666' },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 },
  detailPrice: { fontSize: 32, fontWeight: 900, color: '#1f4d1f' },
  detailOriginalPrice: { fontSize: 16, color: '#aaa', textDecoration: 'line-through' },
  detailDesc: { color: '#555', lineHeight: 1.7, fontSize: 14, marginBottom: 16 },
  infoTag: { display: 'inline-block', background: '#f0fff4', color: '#1f4d1f', fontSize: 12, padding: '4px 10px', borderRadius: 4, marginBottom: 16 },
  whatsappBtn: { display: 'block', textAlign: 'center', background: '#25D366', color: '#fff', textDecoration: 'none', padding: '11px 20px', borderRadius: 7, fontWeight: 600, fontSize: 14, marginBottom: 12 },
  addBtn: { width: '100%', padding: 14, background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 20 },
  sellerCard: { background: '#f7f5f0', borderRadius: 10, padding: 16, border: '1px solid #e8e4dc' },
  sellerTitle: { fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  sellerName: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 6 },
  sellerRatingRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
  sellerRatingText: { fontSize: 13, color: '#666' },
  sellerMeta: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#555', marginBottom: 10 },
  sellerWhatsapp: { display: 'inline-block', background: '#25D366', color: '#fff', textDecoration: 'none', padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600 },
  reviewsSection: { background: '#fff', borderRadius: 15, padding: 30 },
  reviewsTitle: { fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 24 },
  ratingBreakdown: { display: 'flex', gap: 40, marginBottom: 32, padding: 20, background: '#f7f5f0', borderRadius: 10 },
  ratingBig: { textAlign: 'center', minWidth: 100 },
  ratingBigNum: { fontSize: 48, fontWeight: 700, color: '#1f4d1f', lineHeight: 1 },
  ratingBigCount: { fontSize: 12, color: '#888', marginTop: 6 },
  ratingBars: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 },
  ratingBarRow: { display: 'flex', alignItems: 'center', gap: 10 },
  ratingBarLabel: { fontSize: 12, color: '#666', width: 24, textAlign: 'right' },
  ratingBarBg: { flex: 1, height: 8, background: '#e8e4dc', borderRadius: 99, overflow: 'hidden' },
  ratingBarFill: { height: '100%', background: '#f0c050', borderRadius: 99 },
  ratingBarCount: { fontSize: 12, color: '#888', width: 20 },
  reviewList: { display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 },
  reviewItem: { borderBottom: '1px solid #f0ece4', paddingBottom: 20 },
  reviewHeader: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  reviewAvatar: { width: 36, height: 36, background: '#1f4d1f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0c050', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  reviewUser: { fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 4 },
  reviewDate: { marginLeft: 'auto', fontSize: 12, color: '#aaa' },
  reviewComment: { fontSize: 14, color: '#555', lineHeight: 1.7, margin: 0 },
  noReviews: { color: '#888', fontSize: 14, textAlign: 'center', padding: '20px 0' },
  reviewFormBox: { background: '#f7f5f0', borderRadius: 10, padding: 24, marginTop: 16 },
  reviewFormTitle: { fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 16 },
  reviewSuccessMsg: { background: '#f0fff4', color: '#1f4d1f', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16 },
  reviewErrorMsg: { background: '#fff0f0', color: '#cc0000', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16 },
  reviewField: { marginBottom: 16 },
  reviewLabel: { display: 'block', fontSize: 13, color: '#333', fontWeight: 500, marginBottom: 6 },
  reviewSelect: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none' },
  reviewInput: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  reviewTextarea: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  reviewSubmit: { padding: '11px 28px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  reviewSubmitDisabled: { padding: '11px 28px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'not-allowed' },
};
