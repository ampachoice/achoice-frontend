import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllProducts } from '../services/productService';
// FIX: Ensure assets folder is inside src/
import farmerImg from '../assets/farmer.jpg'; 
// Accessing logo from C:\xampp\htdocs\achoice-frontend\public
const LOGO_PATH = "/achoice logo.png"; 

export default function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const videoRef = useRef(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    // Fetch featured products
    getAllProducts()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setProducts(data.slice(0, 8)); // Only show first 8 products on landing page
      })
      .catch((err) => {
        setError("Unable to load featured products.");
      })
      .finally(() => setLoading(false));

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.length);
  }, []);

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={s.page}>
      {/* Top Bar */}
      <div style={s.topBar}>
        <div style={s.topBarLeft}>
          <span>📍 No 6 faith avenue off ekenwan Rd Benin City</span>
          <span>✉ support@achoice.ng</span>
        </div>
        <div style={s.topBarRight}>
          <span>📞 09067794991</span>
          <span>Mon - Sat: 07:00am to 06:00pm</span>
        </div>
      </div>

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navBrand} onClick={() => navigate('/')}>
          {/* UPDATED: Replaced placeholder "A" with actual logo */}
          <img src={LOGO_PATH} alt="Achoice Logo" style={s.navLogoImg} />
          <div>
            <div style={s.navLogoName}>ACHOICE LIMITED</div>
            <div style={s.navLogoTag}>Your needs our solutions</div>
          </div>
        </div>

        <div style={s.navLinks}>
          <Link to="/" style={s.navLink}>Home</Link>
          <a href="#how-it-works" style={s.navLink}>How It Works</a>
          <Link to={token ? "/products" : "/login"} style={s.navLink}>Shop Now</Link>
        </div>

        <div style={s.navActions}>
          <div style={s.cartBtn} onClick={() => navigate('/cart')}>
            🛒 {cartCount > 0 && <span style={s.cartBadge}>{cartCount}</span>}
          </div>
          
          {token ? (
            <button style={s.btnSolid} onClick={() => navigate('/products')}>
              Enter Shop
            </button>
          ) : (
            <>
              <button style={s.btnOutline} onClick={() => navigate('/login')}>Sign In</button>
              <button style={s.btnSolid} onClick={() => navigate('/register')}>Get Started</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={s.hero}>
        <div style={s.heroLeft}>
          <div style={s.heroBadge}>Nigeria's Agricultural Marketplace</div>
          <h1 style={s.heroTitle}>
            Fresh Farm Produce,<br />
            <span style={s.heroTitleAccent}>Direct from Farm</span><br />
            to Your Table
          </h1>
          <p style={s.heroSub}>
            Join verified farmers across Nigeria. Access affordable loans 
            and grow your business with ACHOICE.
          </p>
          <div style={s.heroButtons}>
            <button 
              style={s.heroBtnPrimary} 
              onClick={() => navigate(token ? '/products' : '/register')}
            >
              {token ? 'Go to Marketplace' : 'Get Started Free'}
            </button>
            <a href="#video" style={s.heroBtnSecondary}>▶ Watch Our Story</a>
          </div>
        </div>

        <div style={s.heroRight}>
          <img src={farmerImg} alt="Farmer" style={s.heroImg} />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={s.howSection}>
        <div style={s.sectionLabel}>Simple Process</div>
        <h2 style={s.sectionTitle}>How ACHOICE Works</h2>
        <div style={s.howGrid}>
          {[
            { num: '01', icon: '🔍', title: 'Browse Products', desc: 'Search and browse fresh farm produce from verified sellers across Nigeria.' },
            { num: '02', icon: '🛒', title: 'Add to Cart', desc: 'Select your products, choose quantities and add them to your cart.' },
            { num: '03', icon: '💳', title: 'Pay Securely', desc: 'Complete your payment securely via Paystack — card, bank transfer or USSD.' },
            { num: '04', icon: '🚚', title: 'Get Delivered', desc: 'Your fresh produce is delivered directly from the farm to your doorstep.' },
          ].map((step) => (
            <div key={step.num} style={s.howCard}>
              <div style={s.howNum}>{step.num}</div>
              <div style={s.howIcon}>{step.icon}</div>
              <div style={s.howTitle}>{step.title}</div>
              <p style={s.howDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section style={s.catSection}>
        <div style={s.sectionLabel}>Browse by Category</div>
        <h2 style={s.sectionTitle}>What are you looking for?</h2>
        <div style={s.catGrid}>
          {[
            { icon: '🌾', name: 'Grains & Cereals', count: '240+' },
            { icon: '🥬', name: 'Vegetables', count: '185+' },
            { icon: '🍠', name: 'Tubers & Roots', count: '134+' },
            { icon: '🫒', name: 'Oils & Fats', count: '92+' },
            { icon: '🐔', name: 'Livestock', count: '67+' },
          ].map((cat) => (
            <div key={cat.name} style={s.catCard}>
              <div style={s.catIcon}>{cat.icon}</div>
              <div style={s.catName}>{cat.name}</div>
              <div style={s.catCount}>{cat.count} products</div>
            </div>
          ))}
        </div>
      </section>

      {/* Products Section */}
      <section id="products" style={s.productsSection}>
        <div style={s.productsSectionHeader}>
          <div>
            <div style={s.sectionLabel}>Fresh This Week</div>
            <h2 style={s.sectionTitle}>Featured Products</h2>
          </div>
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p style={s.loadingMsg}>Loading products...</p>}
        {error && <p style={s.loadingMsg}>{error}</p>}

        <div style={s.prodGrid}>
          {filtered.map((product) => (
            <div key={product.id} style={s.prodCard}>
              <div style={s.prodImgBox}>
                {product.image
                  ? <img src={product.image} alt={product.name} style={s.prodImg} />
                  : <div style={s.prodImgPlaceholder}>🌿</div>
                }
                <div style={s.prodCategoryBadge}>{product.category}</div>
              </div>
              <div style={s.prodBody}>
                <div style={s.prodName}>{product.name}</div>
                <div style={s.prodSeller}>
                  {product.seller 
                    ? `${product.seller.business_name}, ${product.seller.state}` 
                    : 'ACHOICE Seller'}
                </div>
                <div style={s.prodFooter}>
                  <div style={s.prodPrice}>
                    ₦{Number(product.price).toLocaleString()}
                  </div>
                  <button 
                    style={s.prodBtn} 
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <p style={s.loadingMsg}>No products found.</p>
        )}
      </section>

      {/* Video Advert Section */}
      <section id="video" style={s.videoSection}>
        <div style={s.videoLeft}>
          <div style={{ ...s.sectionLabel, color: '#f0c050' }}>Our Story</div>
          <h2 style={s.videoTitle}>
            See How ACHOICE is Changing Nigerian Agriculture
          </h2>
          <p style={s.videoDesc}>
            Watch how we connect farmers directly to buyers, eliminate middlemen,
            and provide affordable loans to grow the agricultural sector across Nigeria.
          </p>
          <div style={s.videoFeatures}>
            {[
              'Direct farm-to-table supply chain',
              'Verified sellers across all 36 states',
              'Loans disbursed within 24 hours',
              'Secure Paystack-powered payments',
            ].map((feat) => (
              <div key={feat} style={s.videoFeat}>
                <div style={s.videoFeatDot}></div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={s.videoRight}>
          <div style={s.videoPlayerWrapper}>
            <iframe
              ref={videoRef}
              style={s.videoPlayer}
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0"
              title="ACHOICE Limited Our Story"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <div style={s.videoCaption}>
            ACHOICE LIMITED Farm to Table | Nigeria's Agricultural Marketplace
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={s.whySection}>
        <div style={s.sectionLabel}>Why ACHOICE</div>
        <h2 style={s.sectionTitle}>Buy Fresh, Pay Less — Every Time</h2>
        <div style={s.whyGrid}>
          {[
            { icon: '✅', title: 'Farm Fresh Quality', desc: 'All products sourced directly from verified farms. No middlemen, no markup.' },
            { icon: '🔒', title: 'Secure Payments', desc: 'Pay safely via Paystack — card, bank transfer, USSD or mobile money.' },
            { icon: '🚚', title: 'Fast Delivery', desc: 'Efficient logistics ensuring your fresh produce arrives on time, every time.' },
            { icon: '💰', title: 'Farm Loans', desc: 'Access affordable loans from ₦50,000 to ₦5,000,000 with 24-hour decisions.' },
            { icon: '🌍', title: 'Nationwide Coverage', desc: 'Sellers and buyers from all 36 states of Nigeria on one platform.' },
            { icon: '📱', title: '24/7 Support', desc: 'Our customer support team is always ready to help you shop with confidence.' },
          ].map((item) => (
            <div key={item.title} style={s.whyCard}>
              <div style={s.whyIcon}>{item.icon}</div>
              <div style={s.whyTitle}>{item.title}</div>
              <p style={s.whyDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Loan Section */}
      <section id="loans" style={s.loanSection}>
        <div style={s.loanLeft}>
          <div style={s.sectionLabel}>Farm Financing</div>
          <h2 style={s.loanTitle}>Grow Your Farm with an ACHOICE Loan</h2>
          <p style={s.loanDesc}>
            Apply for a farm loan in minutes. Get approved and funded to expand
            your agricultural business, whether you are a buyer stocking up or
            a seller scaling production.
          </p>
          <div style={s.loanStats}>
            {[
              { val: '₦5M', label: 'Max Loan' },
              { val: '24hrs', label: 'Decision' },
              { val: '10%', label: 'Flat Rate' },
              { val: '0', label: 'Hidden Fees' },
            ].map((stat) => (
              <div key={stat.label} style={s.loanStat}>
                <div style={s.loanStatVal}>{stat.val}</div>
                <div style={s.loanStatLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
          <button style={s.loanBtn} onClick={() => navigate('/loans/apply')}>
            Apply for a Loan
          </button>
        </div>
        <div style={s.loanRight}>
          <div style={s.loanCard}>
            <div style={s.loanCardLabel}>Sample Loan Summary</div>
            <div style={s.loanCardAmount}>₦500,000</div>
            <div style={s.loanCardSub}>Farm expansion — 6 months</div>
            <div style={s.loanBarBg}>
              <div style={s.loanBarFill}></div>
            </div>
            <div style={s.loanBarLabel}>
              <span>Disbursed</span><span>65% repaid</span>
            </div>
            {[
              ['Monthly repayment', '₦91,667'],
              ['Interest rate', '10% flat'],
              ['Status', 'Active'],
            ].map(([label, val]) => (
              <div key={label} style={s.loanRow}>
                <span style={s.loanRowLabel}>{label}</span>
                <span style={{ ...s.loanRowVal, color: label === 'Status' ? '#a8d5a8' : '#fff' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={s.testSection}>
        <div style={s.sectionLabel}>Customer Reviews</div>
        <h2 style={s.sectionTitle}>What Our Customers Say</h2>
        <div style={s.testGrid}>
          {[
            { name: 'Chinedu Okafor', location: 'Lagos', text: 'Buying yams and vegetables here has been stress-free and always fresh. Delivery is prompt too.' },
            { name: 'Amina Yusuf', location: 'Kano', text: 'I love how affordable their foodstuff is compared to the market. Great for family shopping.' },
            { name: 'Bola Adeyemi', location: 'Ibadan', text: 'Their produce is very healthy, and I have never had complaints. Highly recommend for bulk buyers.' },
            { name: 'Ngozi Eze', location: 'Enugu', text: 'As a caterer, I rely on them for large orders. The quality and freshness are always consistent.' },
          ].map((t) => (
            <div key={t.name} style={s.testCard}>
              <div style={s.testStars}>★★★★★</div>
              <p style={s.testText}>"{t.text}"</p>
              <div style={s.testAuthor}>
                <div style={s.testAvatar}>{t.name.charAt(0)}</div>
                <div>
                  <div style={s.testName}>{t.name}</div>
                  <div style={s.testLocation}>{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={s.ctaSection}>
        <h2 style={s.ctaTitle}>Ready to Buy Fresh and Pay Less?</h2>
        <p style={s.ctaDesc}>Join thousands of Nigerians already shopping fresh farm produce on ACHOICE.</p>
        <div style={s.ctaButtons}>
          <button style={s.ctaBtnPrimary} onClick={() => navigate('/register')}>
            Create Free Account
          </button>
          <button style={s.ctaBtnSecondary} onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" style={s.footer}>
        <div style={s.footerGrid}>
          <div>
            <div style={s.footerLogoBox}>
              {/* UPDATED: Replaced placeholder icon with actual logo */}
              <img src={LOGO_PATH} alt="Achoice Logo" style={s.footerLogoImg} />
              <div>
                <div style={s.footerLogoName}>ACHOICE LIMITED</div>
                <div style={s.footerLogoTag}>Your needs our solutions</div>
              </div>
            </div>
            <p style={s.footerDesc}>
              ACHOICE LIMITED is designed to bridge the gap between farmers and
              customers looking to buy fresh farm products cheap.
            </p>
            <div style={s.footerSocial}>
              <div style={s.socialBtn}>f</div>
              <div style={s.socialBtn}>t</div>
              <div style={s.socialBtn}>in</div>
              <div style={s.socialBtn}>ig</div>
            </div>
          </div>
          <div>
            <div style={s.footerHeading}>Products</div>
            {['Grains & Cereals', 'Vegetables', 'Tubers & Roots', 'Oils & Fats', 'Livestock'].map((item) => (
              <div key={item} style={s.footerLink}>{item}</div>
            ))}
          </div>
          <div>
            <div style={s.footerHeading}>Explore</div>
            {['About Us', 'How It Works', 'Become a Seller', 'Farm Loans', 'Privacy Policy'].map((item) => (
              <div key={item} style={s.footerLink}>{item}</div>
            ))}
          </div>
          <div>
            <div style={s.footerHeading}>Contact Us</div>
            <div style={s.footerContactItem}>📍 No 6 faith avenue off ekenwan Rd Benin City</div>
            <div style={s.footerContactItem}>✉ support@achoice.ng</div>
            <div style={s.footerContactItem}>📞 09067794991</div>
            <div style={s.newsletterBox}>
              <input style={s.newsletterInput} type="email" placeholder="Your email" />
              <button style={s.newsletterBtn}>Subscribe</button>
            </div>
          </div>
        </div>
        <div style={s.footerBottom}>
          <span>© 2026 ACHOICE LIMITED. All rights reserved.</span>
          <span>Privacy Policy | Terms of Service</span>
        </div>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#fff', fontFamily: 'Arial, sans-serif' },
  topBar: { background: '#1f4d1f', color: '#fff', padding: '8px 60px', display: 'flex', justifyContent: 'space-between', fontSize: 12 },
  topBarLeft: { display: 'flex', gap: 24 },
  topBarRight: { display: 'flex', gap: 24 },

  // Navbar Styles
  nav: { background: '#fff', padding: '14px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100 },
  navBrand: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  navLogoImg: { width: 45, height: 45, objectFit: 'contain' }, // New Style for Logo
  navLogoName: { fontSize: 15, fontWeight: 700, color: '#1f4d1f' },
  navLogoTag: { fontSize: 10, color: '#888' },
  navLinks: { display: 'flex', gap: 28 },
  navLink: { textDecoration: 'none', color: '#333', fontSize: 14 },
  navActions: { display: 'flex', alignItems: 'center', gap: 12 },
  cartBtn: { fontSize: 20, cursor: 'pointer', position: 'relative' },
  cartBadge: { position: 'absolute', top: -6, right: -8, background: '#f0c050', color: '#1a1a1a', fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnOutline: { padding: '9px 20px', border: '1px solid #1f4d1f', color: '#1f4d1f', borderRadius: 6, fontSize: 13, background: '#fff', cursor: 'pointer' },
  btnSolid: { padding: '9px 20px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' },

  // Hero Styles
  hero: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 580, background: '#1a3d1a', overflow: 'hidden' },
  heroLeft: { padding: '70px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  heroBadge: { display: 'inline-block', background: '#f0c050', color: '#1a3d1a', fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 99, marginBottom: 16, width: 'fit-content' },
  heroTitle: { fontFamily: 'Georgia, serif', fontSize: 44, fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 18, letterSpacing: '-0.5px' },
  heroTitleAccent: { color: '#f0c050' },
  heroSub: { fontSize: 15, color: '#a8d5a8', lineHeight: 1.7, marginBottom: 28, maxWidth: 440 },
  heroButtons: { display: 'flex', gap: 14, alignItems: 'center' },
  heroBtnPrimary: { padding: '14px 28px', background: '#f0c050', color: '#1a3d1a', border: 'none', borderRadius: 7, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  heroBtnSecondary: { padding: '14px 24px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 7, fontSize: 15, cursor: 'pointer', textDecoration: 'none' },
  heroRight: { position: 'relative', overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },

  // Sections
  howSection: { padding: '64px 60px', backgroundColor: '#f7f5f0' },
  howGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 },
  howCard: { background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e8e4dc', textAlign: 'center' },
  howNum: { fontSize: 11, fontWeight: 700, color: '#c8860a', letterSpacing: 2, marginBottom: 12 },
  howIcon: { fontSize: 36, marginBottom: 12 },
  howTitle: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 8 },
  howDesc: { fontSize: 13, color: '#666', lineHeight: 1.6 },

  catSection: { padding: '64px 60px', backgroundColor: '#fff' },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 },
  catCard: { background: '#f7f5f0', borderRadius: 12, padding: '28px 16px', textAlign: 'center', border: '1px solid #e8e4dc', cursor: 'pointer' },
  catIcon: { fontSize: 36, marginBottom: 12 },
  catName: { fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 4 },
  catCount: { fontSize: 12, color: '#888' },

  productsSection: { padding: '64px 60px', backgroundColor: '#f7f5f0' },
  productsSectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  searchInput: { padding: '10px 16px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, width: 280, outline: 'none' },
  loadingMsg: { textAlign: 'center', color: '#888', padding: 40 },
  prodGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 },
  prodCard: { background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8e4dc' },
  prodImgBox: { position: 'relative', height: 180, background: '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  prodImg: { width: '100%', height: '100%', objectFit: 'cover' },
  prodImgPlaceholder: { fontSize: 56 },
  prodCategoryBadge: { position: 'absolute', top: 10, left: 10, background: '#1f4d1f', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'capitalize' },
  prodBody: { padding: 16 },
  prodName: { fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 4 },
  prodSeller: { fontSize: 12, color: '#888', marginBottom: 12 },
  prodFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  prodPrice: { fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1f4d1f' },
  prodBtn: { background: '#1f4d1f', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer' },

  videoSection: { padding: '64px 60px', background: '#1a3d1a', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' },
  videoLeft: {},
  videoTitle: { fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 16 },
  videoDesc: { fontSize: 14, color: '#a8d5a8', lineHeight: 1.7, marginBottom: 24 },
  videoFeatures: { display: 'flex', flexDirection: 'column', gap: 12 },
  videoFeat: { display: 'flex', alignItems: 'center', gap: 12, color: '#d4ecd4', fontSize: 14 },
  videoFeatDot: { width: 8, height: 8, background: '#f0c050', borderRadius: '50%', flexShrink: 0 },
  videoRight: {},
  videoPlayerWrapper: { borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  videoPlayer: { width: '100%', height: 300, border: 'none', display: 'block' },
  videoCaption: { color: '#a8d5a8', fontSize: 12, textAlign: 'center' },

  whySection: { padding: '64px 60px', backgroundColor: '#fff' },
  whyGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 },
  whyCard: { padding: 24, borderRadius: 12, border: '1px solid #e8e4dc' },
  whyIcon: { fontSize: 32, marginBottom: 12 },
  whyTitle: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 8 },
  whyDesc: { fontSize: 13, color: '#666', lineHeight: 1.6 },

  loanSection: { padding: '64px 60px', background: '#f7f5f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' },
  loanLeft: {},
  loanTitle: { fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: '#111', lineHeight: 1.2, marginBottom: 16 },
  loanDesc: { fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 28 },
  loanStats: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 },
  loanStat: { background: '#fff', borderRadius: 8, padding: 14, textAlign: 'center', border: '1px solid #e8e4dc' },
  loanStatVal: { fontSize: 20, fontWeight: 700, color: '#1f4d1f' },
  loanStatLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  loanBtn: { padding: '13px 28px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 7, fontSize: 15, cursor: 'pointer' },
  loanRight: {},
  loanCard: { background: '#1f4d1f', borderRadius: 12, padding: 28 },
  loanCardLabel: { fontSize: 12, color: '#a8d5a8', marginBottom: 6 },
  loanCardAmount: { fontFamily: 'Georgia, serif', fontSize: 40, fontWeight: 700, color: '#f0c050', marginBottom: 4 },
  loanCardSub: { fontSize: 13, color: '#a8d5a8', marginBottom: 20 },
  loanBarBg: { background: 'rgba(255,255,255,0.15)', borderRadius: 99, height: 6, marginBottom: 6 },
  loanBarFill: { background: '#f0c050', width: '65%', height: 6, borderRadius: 99 },
  loanBarLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a8d5a8', marginBottom: 20 },
  loanRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  loanRowLabel: { fontSize: 13, color: '#a8d5a8' },
  loanRowVal: { fontSize: 13, fontWeight: 500 },

  testSection: { padding: '64px 60px', backgroundColor: '#fff' },
  testGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 },
  testCard: { background: '#f7f5f0', borderRadius: 12, padding: 24, border: '1px solid #e8e4dc' },
  testStars: { color: '#f0c050', fontSize: 16, marginBottom: 12 },
  testText: { fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' },
  testAuthor: { display: 'flex', alignItems: 'center', gap: 10 },
  testAvatar: { width: 36, height: 36, background: '#1f4d1f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0c050', fontWeight: 700, fontSize: 14 },
  testName: { fontSize: 13, fontWeight: 600, color: '#111' },
  testLocation: { fontSize: 11, color: '#888' },

  ctaSection: { padding: '64px 60px', background: '#1a3d1a', textAlign: 'center' },
  ctaTitle: { fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 14 },
  ctaDesc: { fontSize: 15, color: '#a8d5a8', marginBottom: 32 },
  ctaButtons: { display: 'flex', gap: 14, justifyContent: 'center' },
  ctaBtnPrimary: { padding: '14px 32px', background: '#f0c050', color: '#1a3d1a', border: 'none', borderRadius: 7, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  ctaBtnSecondary: { padding: '14px 32px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 7, fontSize: 15, cursor: 'pointer' },

  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#c8860a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },
  sectionTitle: { fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: '#111', marginBottom: 40, letterSpacing: '-0.3px' },

  // Footer Styles
  footer: { background: '#a8a0a0', padding: '60px 60px 20px' },
  footerGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 },
  footerLogoBox: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  footerLogoImg: { width: 40, height: 40, objectFit: 'contain' }, // Footer Logo Style
  footerLogoName: { fontSize: 14, fontWeight: 700, color: '#fff' },
  footerLogoTag: { fontSize: 10, color: '#a8d5a8' },
  footerDesc: { fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 20 },
  footerSocial: { display: 'flex', gap: 8 },
  socialBtn: { width: 32, height: 32, background: '#222', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 11, cursor: 'pointer' },
  footerHeading: { fontSize: 11, fontWeight: 700, color: '#f0c050', marginBottom: 16, letterSpacing: 2, textTransform: 'uppercase' },
  footerLink: { fontSize: 13, color: '#555', marginBottom: 10, cursor: 'pointer' },
  footerContactItem: { fontSize: 13, color: '#555', marginBottom: 10 },
  newsletterBox: { display: 'flex', marginTop: 16 },
  newsletterInput: { flex: 1, padding: '10px 14px', border: 'none', borderRadius: '6px 0 0 6px', fontSize: 13 },
  newsletterBtn: { padding: '10px 16px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: '0 6px 6px 0', fontSize: 13, cursor: 'pointer' },
  footerBottom: { borderTop: '1px solid #222', paddingTop: 20, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#444' },
};