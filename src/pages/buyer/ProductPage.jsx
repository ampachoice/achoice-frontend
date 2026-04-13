import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, getAllProducts, getProductReviews, submitProductReview } from '../../services/productService';

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
  const { id } = useParams();
  const navigate = useNavigate();

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '👤';

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  // ✅ Image carousel
  const [activeImg, setActiveImg] = useState(0);

  // ✅ Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', order_id: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  const categories = ['All', ...new Set(allProducts.map(p => p.category).filter(Boolean))];

  useEffect(() => {
    setLoading(true);
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(currentCart.reduce((acc, item) => acc + item.quantity, 0));

    if (id) {
      // ✅ Fetch product detail + reviews in parallel
      Promise.all([
        getProduct(id),
        getProductReviews(id),
      ]).then(([productRes, reviewsRes]) => {
        setProduct(productRes.data);
        const reviewData = reviewsRes.data;
        setReviews(reviewData?.data || reviewData?.reviews || reviewData || []);
        setReviewSummary(reviewData?.summary || null);
      }).finally(() => setLoading(false));
    } else {
      getAllProducts().then(res => {
        const data = res.data?.data || res.data || [];
        setAllProducts(data);
        setFilteredProducts(data);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    let results = allProducts;
    if (selectedCategory !== 'All') results = results.filter(p => p.category === selectedCategory);
    if (searchTerm) results = results.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredProducts(results);
  }, [searchTerm, selectedCategory, allProducts]);

  const handleAddToCart = (targetProduct) => {
    if (!targetProduct) return;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex((item) => item.id === targetProduct.id);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
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
    navigate('/cart');
  };

  // ✅ Submit review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      await submitProductReview(id, reviewForm);
      setReviewSuccess(true);
      setReviewForm({ rating: 5, comment: '', order_id: '' });
      // Refresh reviews
      const res = await getProductReviews(id);
      const reviewData = res.data;
      setReviews(reviewData?.data || reviewData?.reviews || reviewData || []);
      setReviewSummary(reviewData?.summary || null);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return <div style={s.center}>Loading ACHOICE Market...</div>;

  // ✅ Derived product values
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
      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navLeft} onClick={() => navigate('/products')}>
          <img src="/android-chrome-192x192.png" alt="Logo" style={s.logoImg} />
          <div style={s.logoText}>ACHOICE <span style={{ color: '#f0c050' }}>MARKET</span></div>
        </div>

        {!id && (
          <div style={s.searchControlGroup}>
            <select style={s.catDropdown} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input style={s.searchInput} placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        )}

        <div style={s.navRight}>
          <div style={s.cartIcon} onClick={() => navigate('/cart')}>
            🛒
            {cartCount > 0 && <span style={s.badge}>{cartCount}</span>}
          </div>
          <div style={s.identityBox}>
            <div style={s.avatar}>{userInitial}</div>
            <div style={s.userMeta}>
              <span style={s.userName}>{user?.name || 'Guest'}</span>
              <span style={s.logoutBtn} onClick={handleLogout}>Logout</span>
            </div>
          </div>
        </div>
      </nav>

      <div style={s.container}>
        {/* ── Product Listing ── */}
        {!id ? (
          <div style={s.grid}>
            {filteredProducts.map(p => {
              const pHasDiscount = p.discount_price && Number(p.discount_price) > 0;
              const pImage = p.images?.[0]?.url || p.image;
              return (
                <div key={p.id} style={s.card}>
                  <div style={s.imgBox} onClick={() => navigate(`/product/${p.id}`)}>
                    {pImage ? <img src={pImage} style={s.img} alt={p.name} /> : <span style={{ fontSize: 40 }}>📦</span>}
                    {pHasDiscount && <div style={s.saleBadge}>SALE</div>}
                  </div>
                  <div style={s.cardBody}>
                    <div style={s.cardName}>{p.name}</div>
                    {/* ✅ Star rating on listing card */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <StarRating rating={parseFloat(p.reviews_avg_rating || 0)} />
                      <span style={{ fontSize: 11, color: '#888' }}>({p.reviews_count || 0})</span>
                    </div>
                    <div style={s.cardPrice}>₦{Number(pHasDiscount ? p.discount_price : p.price).toLocaleString()}</div>
                    {pHasDiscount && (
                      <div style={s.cardOriginalPrice}>₦{Number(p.price).toLocaleString()}</div>
                    )}
                    <button style={s.viewBtn} onClick={() => handleAddToCart(p)}>Add & Checkout</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Product Detail ── */
          <div style={s.detailWrapper}>
            <button onClick={() => navigate('/products')} style={s.backBtn}>← Back to Products</button>

            <div style={s.detailCard}>
              {/* ✅ Image Carousel */}
              <div style={s.detailImgSide}>
                <div style={s.mainImgBox}>
                  {images.length > 0
                    ? <img src={images[activeImg]} alt={product?.name} style={s.mainImg} />
                    : <div style={s.imgPlaceholder}>🌿</div>
                  }
                  {hasDiscount && <div style={s.detailSaleBadge}>SALE</div>}
                </div>
                {images.length > 1 && (
                  <div style={s.thumbRow}>
                    {images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt=""
                        style={{ ...s.thumb, border: i === activeImg ? '2px solid #1f4d1f' : '2px solid #eee' }}
                        onClick={() => setActiveImg(i)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* ── Product Info ── */}
              <div style={s.detailInfoSide}>
                <div style={s.detailCategory}>{product?.category}</div>
                <h1 style={s.detailName}>{product?.name}</h1>

                {/* ✅ Rating summary */}
                <div style={s.ratingRow}>
                  <StarRating rating={avgRating} size={18} />
                  <span style={s.ratingText}>{avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                </div>

                {/* ✅ Price with discount */}
                <div style={s.priceRow}>
                  <div style={s.detailPrice}>₦{Number(displayPrice).toLocaleString()}</div>
                  {hasDiscount && (
                    <div style={s.detailOriginalPrice}>₦{Number(product.price).toLocaleString()}</div>
                  )}
                </div>

                <p style={s.detailDesc}>{product?.description}</p>

                {product?.min_order_qty && (
                  <div style={s.infoTag}>Min. order: {product.min_order_qty} units</div>
                )}

                {/* ✅ WhatsApp button */}
                {product?.whatsapp_number && (
                  <a
                    href={`https://wa.me/${product.whatsapp_number.replace(/\D/g, '')}?text=Hi, I'm interested in ${encodeURIComponent(product.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={s.whatsappBtn}
                  >
                    💬 Chat on WhatsApp
                  </a>
                )}

                <button style={s.addBtn} onClick={() => handleAddToCart(product)}>
                  🛒 Add to Cart
                </button>

                {/* ✅ Seller Profile */}
                {seller && (
                  <div style={s.sellerCard}>
                    <div style={s.sellerTitle}>Sold by</div>
                    <div style={s.sellerName}>{seller.business_name}</div>
                    {seller.rating && (
                      <div style={s.sellerRatingRow}>
                        <StarRating rating={parseFloat(seller.rating)} size={13} />
                        <span style={s.sellerRatingText}>{parseFloat(seller.rating).toFixed(1)}</span>
                      </div>
                    )}
                    <div style={s.sellerMeta}>
                      {seller.total_sales && <span>🛍 {seller.total_sales} sales</span>}
                      {seller.state && <span>📍 {seller.business_address || seller.state}</span>}
                    </div>
                    {seller.whatsapp_number && (
                      <a
                        href={`https://wa.me/${seller.whatsapp_number.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={s.sellerWhatsapp}
                      >
                        💬 Contact Seller
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ✅ Reviews Section */}
            <div style={s.reviewsSection}>
              <h2 style={s.reviewsTitle}>Customer Reviews</h2>

              {/* Rating breakdown */}
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

              {/* Review list */}
              {reviews.length > 0 ? (
                <div style={s.reviewList}>
                  {reviews.map((r, i) => (
                    <div key={r.id || i} style={s.reviewItem}>
                      <div style={s.reviewHeader}>
                        <div style={s.reviewAvatar}>{r.user?.name?.charAt(0) || '👤'}</div>
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

              {/* Submit review form */}
              {user && (
                <div style={s.reviewFormBox}>
                  <h3 style={s.reviewFormTitle}>Leave a Review</h3>
                  {reviewSuccess && <div style={s.reviewSuccessMsg}>✅ Review submitted! Thank you.</div>}
                  {reviewError && <div style={s.reviewErrorMsg}>{reviewError}</div>}
                  <form onSubmit={handleReviewSubmit}>
                    <div style={s.reviewField}>
                      <label style={s.reviewLabel}>Rating</label>
                      <select
                        style={s.reviewSelect}
                        value={reviewForm.rating}
                        onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                      >
                        {[5, 4, 3, 2, 1].map(n => (
                          <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''} {'★'.repeat(n)}</option>
                        ))}
                      </select>
                    </div>
                    <div style={s.reviewField}>
                      <label style={s.reviewLabel}>Order ID (optional)</label>
                      <input
                        style={s.reviewInput}
                        type="text"
                        placeholder="Your order ID"
                        value={reviewForm.order_id}
                        onChange={(e) => setReviewForm({ ...reviewForm, order_id: e.target.value })}
                      />
                    </div>
                    <div style={s.reviewField}>
                      <label style={s.reviewLabel}>Comment</label>
                      <textarea
                        style={s.reviewTextarea}
                        placeholder="Share your experience with this product..."
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        required
                        rows={4}
                      />
                    </div>
                    <button
                      style={reviewSubmitting ? s.reviewSubmitDisabled : s.reviewSubmit}
                      type="submit"
                      disabled={reviewSubmitting}
                    >
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
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#1f4d1f' },
  nav: { background: '#1f4d1f', padding: '10px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', position: 'sticky', top: 0, zIndex: 100 },
  navLeft: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' },
  logoImg: { width: 35, height: 35, borderRadius: 4 },
  logoText: { fontWeight: 'bold', fontSize: 18 },
  searchControlGroup: { flex: 1, maxWidth: 500, margin: '0 30px', display: 'flex', background: '#fff', borderRadius: 25, overflow: 'hidden', border: '2px solid #f0c050' },
  catDropdown: { padding: '8px 12px', border: 'none', borderRight: '1px solid #eee', background: '#f9f9f9', fontSize: 13, outline: 'none' },
  searchInput: { flex: 1, padding: '10px 15px', border: 'none', outline: 'none', fontSize: 14 },
  navRight: { display: 'flex', alignItems: 'center', gap: 20 },
  cartIcon: { fontSize: 22, cursor: 'pointer', position: 'relative' },
  badge: { position: 'absolute', top: -8, right: -10, background: '#f0c050', color: '#1f4d1f', fontSize: 10, fontWeight: 'bold', width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1f4d1f' },
  identityBox: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: 20 },
  avatar: { width: 32, height: 32, borderRadius: '50%', backgroundColor: '#f0c050', color: '#1f4d1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  userMeta: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: 12, fontWeight: 'bold' },
  logoutBtn: { fontSize: 10, color: '#f0c050', cursor: 'pointer' },
  container: { padding: '30px 40px', maxWidth: '1200px', margin: '0 auto' },

  // Listing grid
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 25 },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' },
  imgBox: { height: 160, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  saleBadge: { position: 'absolute', top: 8, right: 8, background: '#e53935', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 },
  cardBody: { padding: 15 },
  cardName: { fontWeight: 'bold', margin: '5px 0', fontSize: 14 },
  cardPrice: { color: '#1f4d1f', fontWeight: 900, fontSize: 18 },
  cardOriginalPrice: { color: '#aaa', fontSize: 12, textDecoration: 'line-through', marginBottom: 8 },
  viewBtn: { width: '100%', padding: 10, background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', marginTop: 8 },

  // Detail view
  detailWrapper: { maxWidth: 1000, margin: '0 auto' },
  backBtn: { background: 'none', border: 'none', color: '#1f4d1f', fontWeight: 'bold', cursor: 'pointer', marginBottom: 15, fontSize: 14 },
  detailCard: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 40, background: '#fff', padding: 30, borderRadius: 15, marginBottom: 32 },

  // Image carousel
  detailImgSide: {},
  mainImgBox: { position: 'relative', height: 340, background: '#f5f5f5', borderRadius: 10, overflow: 'hidden', marginBottom: 12 },
  mainImg: { width: '100%', height: '100%', objectFit: 'cover' },
  imgPlaceholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 72 },
  detailSaleBadge: { position: 'absolute', top: 12, right: 12, background: '#e53935', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 4 },
  thumbRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  thumb: { width: 64, height: 64, objectFit: 'cover', borderRadius: 6, cursor: 'pointer' },

  // Info side
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
  addBtn: { width: '100%', padding: '14px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 20 },

  // Seller card
  sellerCard: { background: '#f7f5f0', borderRadius: 10, padding: 16, border: '1px solid #e8e4dc' },
  sellerTitle: { fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  sellerName: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 6 },
  sellerRatingRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
  sellerRatingText: { fontSize: 13, color: '#666' },
  sellerMeta: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#555', marginBottom: 10 },
  sellerWhatsapp: { display: 'inline-block', background: '#25D366', color: '#fff', textDecoration: 'none', padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600 },

  // Reviews section
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

  // Review form
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
