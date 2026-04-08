import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, getAllProducts } from '../../services/productService';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // User Identity
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '👤';

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Cart Count for Badge
  const [cartCount, setCartCount] = useState(0);

  const categories = ['All', ...new Set(allProducts.map(p => p.category).filter(Boolean))];

  useEffect(() => {
    setLoading(true);
    // Update cart count on mount
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(currentCart.reduce((acc, item) => acc + item.quantity, 0));

    if (id) {
      getProduct(id).then(res => setProduct(res.data)).finally(() => setLoading(false));
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

  // --- UPDATED ADD TO CART (WITH REDIRECT) ---
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
        price: targetProduct.price,
        image: targetProduct.image,
        quantity: 1
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    
    // DIRECT TO CART PAGE
    navigate('/cart');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return <div style={s.center}>Loading ACHOICE Market...</div>;

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.navLeft} onClick={() => navigate('/products')}>
          <img src="/android-chrome-192x192.png" alt="Logo" style={s.logoImg} />
          <div style={s.logoText}>ACHOICE <span style={{color: '#f0c050'}}>MARKET</span></div>
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
              <span style={s.userName}>{user?.name || "Guestuser"}</span>
              <span style={s.logoutBtn} onClick={handleLogout}>Logout</span>
            </div>
          </div>
        </div>
      </nav>

      <div style={s.container}>
        {!id ? (
          <div style={s.grid}>
            {filteredProducts.map(p => (
              <div key={p.id} style={s.card}>
                <div style={s.imgBox} onClick={() => navigate(`/product/${p.id}`)}>
                  {p.image ? <img src={p.image} style={s.img} alt=""/> : '📦'}
                </div>
                <div style={s.cardBody}>
                  <div style={s.cardName}>{p.name}</div>
                  <div style={s.cardPrice}>₦{Number(p.price).toLocaleString()}</div>
                  <button style={s.viewBtn} onClick={() => handleAddToCart(p)}>Add & Checkout</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={s.detailWrapper}>
            <button onClick={() => navigate('/products')} style={s.backBtn}>← Back</button>
            <div style={s.detailCard}>
              <div style={s.detailImgSide}>
                {product?.image ? <img src={product.image} style={s.img} alt=""/> : '🌿'}
              </div>
              <div style={s.detailInfoSide}>
                <h1 style={{color: '#1f4d1f', marginTop: 0}}>{product?.name}</h1>
                <div style={s.detailPrice}>₦{Number(product?.price).toLocaleString()}</div>
                <p style={s.detailDesc}>{product?.description}</p>
                <button style={s.addBtn} onClick={() => handleAddToCart(product)}>
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#fcfbf7', fontFamily: 'Arial, sans-serif' },
  nav: { background: '#1f4d1f', padding: '10px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', position: 'sticky', top: 0, zIndex: 100 },
  navLeft: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' },
  logoImg: { width: '35px', height: '35px', borderRadius: '4px' },
  logoText: { fontWeight: 'bold', fontSize: '18px' },
  searchControlGroup: { flex: 1, maxWidth: '500px', margin: '0 30px', display: 'flex', background: '#fff', borderRadius: '25px', overflow: 'hidden', border: '2px solid #f0c050' },
  catDropdown: { padding: '8px 12px', border: 'none', borderRight: '1px solid #eee', background: '#f9f9f9', fontSize: '13px', outline: 'none' },
  searchInput: { flex: 1, padding: '10px 15px', border: 'none', outline: 'none', fontSize: '14px' },
  navRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  cartIcon: { fontSize: '22px', cursor: 'pointer', position: 'relative' },
  badge: { position: 'absolute', top: -8, right: -10, background: '#f0c050', color: '#1f4d1f', fontSize: '10px', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1f4d1f' },
  identityBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '20px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0c050', color: '#1f4d1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  userMeta: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '12px', fontWeight: 'bold' },
  logoutBtn: { fontSize: '10px', color: '#f0c050', cursor: 'pointer' },
  container: { padding: '30px 40px', maxWidth: '1200px', margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '25px' },
  card: { background: '#fff', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden' },
  imgBox: { height: '160px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  cardBody: { padding: '15px' },
  cardName: { fontWeight: 'bold', margin: '5px 0' },
  cardPrice: { color: '#1f4d1f', fontWeight: '900', fontSize: '18px' },
  viewBtn: { width: '100%', padding: '10px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  detailWrapper: { maxWidth: '1000px', margin: '0 auto' },
  backBtn: { background: 'none', border: 'none', color: '#1f4d1f', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' },
  detailCard: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px', background: '#fff', padding: '30px', borderRadius: '15px' },
  detailPrice: { fontSize: '32px', fontWeight: 'bold', color: '#f0c050', marginBottom: '20px' },
  detailDesc: { color: '#666', lineHeight: '1.7', marginBottom: '30px' },
  addBtn: { padding: '15px 45px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#1f4d1f' }
};