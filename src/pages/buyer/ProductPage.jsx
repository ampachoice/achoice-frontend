import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../../services/productService';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    getProduct(id)
      .then((res) => setProduct(res.data))
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div style={s.center}>Loading product...</div>;
  if (error) return <div style={s.center}>{error}</div>;
  if (!product) return null;

  return (
    <div style={s.page}>

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navLogo} onClick={() => navigate('/')}>
          ACHOICE <span style={s.navAccent}>LIMITED</span>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => navigate('/')}>Back to Products</span>
          <span style={s.navLink} onClick={() => navigate('/cart')}>Cart</span>
        </div>
      </nav>

      {/* Product Detail */}
      <div style={s.container}>
        <div style={s.card}>

          {/* Image */}
          <div style={s.imageBox}>
            {product.image_url
              ? <img src={product.image_url} alt={product.name} style={s.image} />
              : <div style={s.imagePlaceholder}>🌿</div>
            }
          </div>

          {/* Info */}
          <div style={s.info}>
            <div style={s.tag}>{product.category}</div>
            <h1 style={s.name}>{product.name}</h1>

            <div style={s.sellerRow}>
              <span style={s.sellerLabel}>Sold by</span>
              <span style={s.sellerName}>
                {product.seller ? product.seller.business_name : 'ACHOICE Seller'}
              </span>
              <span style={s.sellerState}>
                {product.seller ? product.seller.state : ''}
              </span>
            </div>

            <div style={s.price}>
              ₦{Number(product.price).toLocaleString()}
            </div>

            <p style={s.description}>{product.description}</p>

            <div style={s.divider}></div>

            {/* Quantity */}
            <div style={s.quantityRow}>
              <label style={s.quantityLabel}>Quantity</label>
              <div style={s.quantityControl}>
                <button
                  style={s.qBtn}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <span style={s.qNum}>{quantity}</span>
                <button
                  style={s.qBtn}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Total */}
            <div style={s.totalRow}>
              <span style={s.totalLabel}>Total</span>
              <span style={s.totalValue}>
                ₦{(Number(product.price) * quantity).toLocaleString()}
              </span>
            </div>

            {/* Buttons */}
            <button
              style={added ? s.btnAdded : s.btnAdd}
              onClick={handleAddToCart}
            >
              {added ? 'Added to Cart' : 'Add to Cart'}
            </button>

            <button
              style={s.btnCheckout}
              onClick={() => { handleAddToCart(); navigate('/cart'); }}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f7f5f0', fontFamily: 'Arial, sans-serif' },
  nav: { background: '#fff', padding: '18px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e8e4dc' },
  navLogo: { fontSize: 20, fontWeight: 900, color: '#1f4d1f', cursor: 'pointer' },
  navAccent: { color: '#c8860a' },
  navLinks: { display: 'flex', gap: 24, alignItems: 'center' },
  navLink: { color: '#555', fontSize: 14, cursor: 'pointer' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '40px 16px' },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc', display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' },
  imageBox: { background: '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  imagePlaceholder: { fontSize: 120 },
  info: { padding: '40px 36px', display: 'flex', flexDirection: 'column' },
  tag: { fontSize: 11, fontWeight: 500, color: '#1f4d1f', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  name: { fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 16, lineHeight: 1.2 },
  sellerRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 },
  sellerLabel: { fontSize: 12, color: '#999' },
  sellerName: { fontSize: 13, fontWeight: 500, color: '#1f4d1f' },
  sellerState: { fontSize: 12, color: '#999' },
  price: { fontSize: 36, fontWeight: 700, color: '#1f4d1f', marginBottom: 16 },
  description: { fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 20 },
  divider: { height: 1, background: '#eee', marginBottom: 20 },
  quantityRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  quantityLabel: { fontSize: 14, color: '#333', fontWeight: 500 },
  quantityControl: { display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #ddd', borderRadius: 6, padding: '6px 12px' },
  qBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#1f4d1f', fontWeight: 700 },
  qNum: { fontSize: 16, fontWeight: 500, minWidth: 20, textAlign: 'center' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '12px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValue: { fontSize: 22, fontWeight: 700, color: '#111' },
  btnAdd: { width: '100%', padding: '14px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 7, fontSize: 15, fontWeight: 500, cursor: 'pointer', marginBottom: 10, fontFamily: 'inherit' },
  btnAdded: { width: '100%', padding: '14px', background: '#3a8a3a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 15, fontWeight: 500, cursor: 'pointer', marginBottom: 10, fontFamily: 'inherit' },
  btnCheckout: { width: '100%', padding: '14px', background: '#fff', color: '#1f4d1f', border: '2px solid #1f4d1f', borderRadius: 7, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 16, color: '#666' },
};