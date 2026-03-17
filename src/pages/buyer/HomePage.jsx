import { useState, useEffect } from 'react';
import { getAllProducts } from '../../services/productService';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllProducts()
      .then((res) => setProducts(res.data))
      .catch(() => setError('Failed to load products. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <span style={styles.logo}>ACHOICE LIMITED</span>
        <div style={styles.navLinks}>
          <a href="/cart" style={styles.navLink}>🛒 Cart</a>
          <a href="/orders" style={styles.navLink}>My Orders</a>
          <a href="/loans/apply" style={styles.navLink}>Apply for Loan</a>
          <a href="/login" style={styles.navLink}>Logout</a>
        </div>
      </div>

      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Fresh Farm Produce</h1>
        <p style={styles.heroSubtitle}>Buy directly from verified sellers across Nigeria</p>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search for products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Products */}
      <div style={styles.container}>
        {loading && <p style={styles.message}>Loading products...</p>}
        {error && <p style={styles.errorMessage}>{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p style={styles.message}>No products found.</p>
        )}
        <div style={styles.grid}>
          {filtered.map((product) => (
            <div key={product.id} style={styles.card}>
              <img
                src={product.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                alt={product.name}
                style={styles.image}
              />
              <div style={styles.cardBody}>
                <h3 style={styles.productName}>{product.name}</h3>
                <p style={styles.productDesc}>{product.description}</p>
                <div style={styles.cardFooter}>
                  <span style={styles.price}>₦{Number(product.price).toLocaleString()}</span>
                  <a href={`/product/${product.id}`} style={styles.viewButton}>
                    View
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f0', fontFamily: 'Arial, sans-serif' },
  navbar: {
    backgroundColor: '#2E5E2E', padding: '14px 32px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  logo: { color: '#ffffff', fontWeight: 'bold', fontSize: '18px' },
  navLinks: { display: 'flex', gap: '20px' },
  navLink: { color: '#ffffff', textDecoration: 'none', fontSize: '14px' },
  hero: {
    backgroundColor: '#1a3d1a', padding: '48px 32px',
    textAlign: 'center',
  },
  heroTitle: { color: '#ffffff', fontSize: '32px', marginBottom: '8px' },
  heroSubtitle: { color: '#a8d5a8', fontSize: '16px', marginBottom: '24px' },
  searchInput: {
    width: '100%', maxWidth: '500px', padding: '12px 16px',
    borderRadius: '6px', border: 'none', fontSize: '15px',
    boxSizing: 'border-box',
  },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#ffffff', borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden',
  },
  image: { width: '100%', height: '180px', objectFit: 'cover' },
  cardBody: { padding: '16px' },
  productName: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' },
  productDesc: { fontSize: '13px', color: '#666', marginBottom: '12px', lineHeight: '1.5' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: '16px', fontWeight: 'bold', color: '#2E5E2E' },
  viewButton: {
    backgroundColor: '#2E5E2E', color: '#ffffff', padding: '7px 16px',
    borderRadius: '5px', textDecoration: 'none', fontSize: '13px',
  },
  message: { textAlign: 'center', color: '#666', fontSize: '15px', padding: '40px' },
  errorMessage: { textAlign: 'center', color: '#cc0000', fontSize: '15px', padding: '40px' },
};