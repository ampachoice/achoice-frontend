import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAllProducts } from "../services/productService";
import api from "../services/api";
import farmerImg from "../assets/farmer.jpg";
import NotificationBell from "../components/buyer/NotificationBell";

const LOGO_PATH = "/achoice logo.png";
const PRODUCTS_PER_PAGE = 8;

// Category quick-links / rails — slug must match the backend's product
// `category` enum exactly (grains, vegetables, fruits, tubers, livestock,
// poultry, fishery, dairy, processed) so GET /products/category/{slug} works.
const CATEGORIES = [
  { slug: "grains", label: "Grains", icon: "🌾" },
  { slug: "vegetables", label: "Vegetables", icon: "🥬" },
  { slug: "fruits", label: "Fruits", icon: "🍎" },
  { slug: "tubers", label: "Tubers", icon: "🍠" },
  { slug: "livestock", label: "Livestock", icon: "🐄" },
  { slug: "poultry", label: "Poultry", icon: "🐔" },
  { slug: "fishery", label: "Fishery", icon: "🐟" },
  { slug: "dairy", label: "Dairy", icon: "🥛" },
  { slug: "processed", label: "Processed", icon: "📦" },
];
const RAIL_PRODUCTS_LIMIT = 12;

// Default carousel slides — replaced by admin banner settings
const DEFAULT_SLIDES = [
  {
    image: farmerImg,
    badge: "Nigeria's Agricultural Marketplace",
    title: "Fresh Farm Produce,\nDirect from Farm to Your Table",
    subtitle:
      "Join verified farmers across Nigeria. Access affordable loans and grow your business with ACHOICE.",
    btnText: "Get Started Free",
    btnLink: "/register",
    btnColor: "#f0c050",
  },
  {
    image: farmerImg,
    badge: "Farm Loans Available",
    title: "Grow Your Farm\nWith Affordable Loans",
    subtitle:
      "Apply in minutes. Get approved within 24 hours. No hidden fees, flat interest rate.",
    btnText: "Apply for a Loan",
    btnLink: "/loans/apply",
    btnColor: "#4caf8f",
  },
  {
    image: farmerImg,
    badge: "Fresh This Week",
    title: "Buy Direct From\nVerified Nigerian Farmers",
    subtitle:
      "No middlemen. No markup. Fresh produce from 36 states delivered to your door.",
    btnText: "Shop Now",
    btnLink: "/products",
    btnColor: "#f0c050",
  },
];

const injectCSS = () => {
  if (document.getElementById("homepage-css")) return;
  const style = document.createElement("style");
  style.id = "homepage-css";
  style.textContent = `
    * { box-sizing: border-box; }
    .hp-hamburger { display: none !important; }
    .hp-nav-links { display: flex !important; }
    .hp-nav-actions-desktop { display: flex !important; }
    .hp-topbar-small { display: inline !important; }

    /* Carousel */
    .hp-carousel { position: relative; width: 100%; overflow: hidden; }
    .hp-carousel-track { display: flex; transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94); will-change: transform; }
    .hp-carousel-slide {
      min-width: 100%; position: relative; height: 560px;
      display: flex; align-items: center; overflow: hidden;
    }
    .hp-carousel-slide-bg {
      position: absolute; inset: 0;
      background-size: cover; background-position: center;
      transition: transform 8s ease;
    }
    .hp-carousel-slide-bg::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(90deg, rgba(15,40,15,0.88) 0%, rgba(15,40,15,0.5) 55%, rgba(15,40,15,0.15) 100%);
    }
    .hp-carousel-content {
      position: relative; z-index: 2;
      padding: 0 60px; max-width: 680px;
      animation: slideUp 0.7s ease forwards;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .hp-carousel-badge {
      display: inline-block; background: #f0c050; color: #1a3d1a;
      font-size: 11px; font-weight: 700; padding: 5px 14px;
      border-radius: 99px; margin-bottom: 16px; letter-spacing: 0.5px;
    }
    .hp-carousel-title {
      font-family: Georgia, serif; font-size: 44px; font-weight: 700;
      color: #fff; line-height: 1.15; margin-bottom: 18px;
      white-space: pre-line;
    }
    .hp-carousel-subtitle {
      font-size: 15px; color: #a8d5a8; line-height: 1.7;
      margin-bottom: 28px; max-width: 480px;
    }
    .hp-carousel-buttons { display: flex; gap: 14px; flex-wrap: wrap; }
    .hp-carousel-btn-primary {
      padding: 14px 28px; border: none; border-radius: 7px;
      font-size: 15px; font-weight: 700; cursor: pointer;
      font-family: inherit; transition: opacity 0.2s;
    }
    .hp-carousel-btn-primary:hover { opacity: 0.9; }
    .hp-carousel-btn-secondary {
      padding: 14px 24px; background: rgba(255,255,255,0.1);
      color: #fff; border: 1px solid rgba(255,255,255,0.35);
      border-radius: 7px; font-size: 15px; cursor: pointer;
      font-family: inherit; text-decoration: none;
      display: inline-flex; align-items: center;
    }

    /* Carousel controls */
    .hp-carousel-prev, .hp-carousel-next {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 44px; height: 44px; background: rgba(255,255,255,0.15);
      backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,0.25);
      border-radius: 50%; color: #fff; font-size: 18px;
      cursor: pointer; z-index: 10; display: flex;
      align-items: center; justify-content: center;
      transition: background 0.2s; user-select: none;
    }
    .hp-carousel-prev:hover, .hp-carousel-next:hover { background: rgba(255,255,255,0.3); }
    .hp-carousel-prev { left: 16px; }
    .hp-carousel-next { right: 16px; }

    /* Dots */
    .hp-carousel-dots {
      position: absolute; bottom: 20px; left: 50%;
      transform: translateX(-50%); display: flex; gap: 8px; z-index: 10;
    }
    .hp-carousel-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: rgba(255,255,255,0.4); border: none; cursor: pointer;
      transition: all 0.3s; padding: 0;
    }
    .hp-carousel-dot.active {
      width: 24px; border-radius: 4px;
      background: #f0c050;
    }

    /* Promo strip below carousel */
    .hp-promo-strip {
      display: flex; justify-content: center; gap: 0;
      background: #1f4d1f; flex-wrap: wrap;
    }
    .hp-promo-item {
      display: flex; align-items: center; gap: 10;
      padding: 14px 32px; color: #fff; font-size: 13px;
      border-right: 1px solid rgba(255,255,255,0.15);
      flex-shrink: 0;
    }
    .hp-promo-item:last-child { border-right: none; }
    .hp-promo-icon { font-size: 22px; }

    /* Category quick-links row */
    .hp-cat-row {
      display: flex; overflow-x: auto; gap: 16px; padding: 24px 40px;
      background: #fff; border-bottom: 1px solid #eee; scrollbar-width: none;
    }
    .hp-cat-row::-webkit-scrollbar { display: none; }
    .hp-cat-item {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      flex-shrink: 0; width: 84px; cursor: pointer; text-decoration: none;
    }
    .hp-cat-icon-circle {
      width: 60px; height: 60px; border-radius: 50%; background: #f7f5f0;
      display: flex; align-items: center; justify-content: center; font-size: 26px;
      border: 1px solid #e8e4dc; transition: background 0.2s, transform 0.15s;
    }
    .hp-cat-item:hover .hp-cat-icon-circle { background: #eef6ea; transform: translateY(-2px); }
    .hp-cat-label { font-size: 11.5px; font-weight: 600; color: #333; text-align: center; }

    /* Category rails */
    .hp-rail-section { padding: 40px 40px 8px; }
    .hp-rail-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
    .hp-rail-title { font-family: 'Georgia, serif'; font-size: 19px; font-weight: 700; color: #111; display: flex; align-items: center; gap: 8px; }
    .hp-rail-see-all { font-size: 12.5px; font-weight: 700; color: #1f4d1f; text-decoration: none; white-space: nowrap; }
    .hp-rail-see-all:hover { text-decoration: underline; }
    .hp-rail-track { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 10px; scroll-snap-type: x proximity; }
    .hp-rail-card { flex-shrink: 0; width: 170px; scroll-snap-align: start; }

    /* Flash Sale strip */
    .hp-flash-section { padding: 32px 40px 8px; background: #fff8ec; }
    .hp-flash-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
    .hp-flash-title { display: flex; align-items: center; gap: 8px; font-family: 'Georgia, serif'; font-size: 20px; font-weight: 700; color: #cc0000; }
    .hp-flash-track { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 18px; scroll-snap-type: x proximity; }
    .hp-flash-card {
      flex-shrink: 0; width: 180px; background: #fff; border-radius: 10px; overflow: hidden;
      border: 1px solid #f3d9a8; cursor: pointer; scroll-snap-align: start;
    }
    .hp-flash-discount-badge {
      position: absolute; top: 8px; left: 8px; background: #cc0000; color: #fff;
      font-size: 10px; font-weight: 800; padding: 3px 7px; border-radius: 4px;
    }
    .hp-flash-timer {
      display: flex; align-items: center; justify-content: center; gap: 4px;
      background: #1a1a1a; color: #f0c050; font-size: 11px; font-weight: 700;
      padding: 4px 6px; letter-spacing: 0.5px; font-variant-numeric: tabular-nums;
    }
    .hp-flash-progress-track { height: 6px; background: #eee; border-radius: 4px; overflow: hidden; margin-top: 6px; }
    .hp-flash-progress-fill { height: 100%; background: linear-gradient(90deg, #f0c050, #cc0000); }
    .hp-flash-left-label { font-size: 9.5px; color: #888; margin-top: 3px; }

    /* Top Seller Spotlight */
    .hp-spotlight-section { padding: 48px 40px; background: #f7f5f0; }
    .hp-spotlight-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 16px; }
    .hp-spotlight-card {
      background: #fff; border-radius: 10px; padding: 18px; text-align: center;
      border: 1px solid #e8e4dc; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
    }
    .hp-spotlight-card:hover { transform: translateY(-3px); box-shadow: 0 6px 18px rgba(0,0,0,0.07); }
    .hp-spotlight-logo {
      width: 64px; height: 64px; border-radius: 50%; object-fit: cover; margin: 0 auto 10px;
      display: flex; align-items: center; justify-content: center; background: #1f4d1f;
      color: #fff; font-weight: 700; font-size: 20px;
    }
    .hp-spotlight-badge {
      display: inline-block; font-size: 9.5px; font-weight: 700; padding: 3px 9px;
      border-radius: 20px; margin-top: 8px; letter-spacing: 0.3px;
    }

    @media (max-width: 768px) {
      .hp-hamburger { display: block !important; }
      .hp-nav-links { display: none !important; }
      .hp-nav-actions-desktop { display: flex !important; gap: 8px; }
      .hp-topbar-small { display: none !important; }
      .hp-carousel-slide { height: 420px; }
      .hp-carousel-content { padding: 0 20px; }
      .hp-carousel-title { font-size: 26px !important; }
      .hp-carousel-subtitle { font-size: 13px; }
      .hp-carousel-btn-primary { padding: 12px 20px; font-size: 14px; }
      .hp-section { padding: 36px 16px !important; }
      .hp-section-title { font-size: 22px !important; margin-bottom: 20px !important; }
      .hp-how-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
      .hp-products-header { flex-direction: column !important; align-items: flex-start !important; }
      .hp-search-input { max-width: 100% !important; width: 100% !important; }
      .hp-prod-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
      .hp-video-section { grid-template-columns: 1fr !important; padding: 36px 16px !important; gap: 24px !important; }
      .hp-video-player { height: 200px !important; }
      .hp-why-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
      .hp-loan-section { grid-template-columns: 1fr !important; padding: 36px 16px !important; gap: 24px !important; }
      .hp-loan-stats { grid-template-columns: repeat(2, 1fr) !important; }
      .hp-test-grid { grid-template-columns: 1fr !important; }
      .hp-newsletter-form { flex-direction: column !important; }
      .hp-newsletter-form input, .hp-newsletter-form button { width: 100% !important; }
      .hp-cta-buttons { flex-direction: column !important; align-items: center !important; }
      .hp-cta-title { font-size: 22px !important; }
      .hp-footer-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
      .hp-footer-bottom { flex-direction: column !important; text-align: center !important; gap: 6px !important; }
      .hp-topbar { padding: 6px 16px !important; font-size: 11px !important; }
      .hp-nav { padding: 10px 16px !important; }
      .hp-promo-item { padding: 10px 16px; font-size: 12px; }
      .hp-carousel-prev { left: 8px; }
      .hp-carousel-next { right: 8px; }
      .hp-cat-row { padding: 18px 16px; gap: 12px; }
      .hp-cat-item { width: 68px; }
      .hp-cat-icon-circle { width: 50px; height: 50px; font-size: 22px; }
      .hp-rail-section { padding: 28px 16px 4px !important; }
      .hp-rail-card { width: 148px; }
      .hp-flash-section { padding: 24px 16px 4px !important; }
      .hp-flash-card { width: 150px; }
      .hp-spotlight-section { padding: 32px 16px !important; }
      .hp-spotlight-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
    }

    @media (max-width: 480px) {
      .hp-how-grid { grid-template-columns: 1fr !important; }
      .hp-prod-grid { grid-template-columns: 1fr !important; }
      .hp-why-grid { grid-template-columns: 1fr !important; }
      .hp-carousel-slide { height: 340px; }
      .hp-carousel-title { font-size: 22px !important; }
    }
  `;
  document.head.appendChild(style);
};

export default function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [bannerSetting, setBannerSetting] = useState(null);
  const [videoSetting, setVideoSetting] = useState(null);
  const [siteSetting, setSiteSetting] = useState(null);
  const [newsletter, setNewsletter] = useState({ name: "", email: "" });
  const [newsletterMsg, setNewsletterMsg] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Category rails — { [slug]: { loading, products } }
  const [categoryRails, setCategoryRails] = useState({});

  // Flash sales — fetched with a client timestamp so the countdown can tick
  // locally between polls without drifting (server seconds_remaining is the source of truth).
  const [flashSales, setFlashSales] = useState([]);
  const [flashSalesFetchedAt, setFlashSalesFetchedAt] = useState(null);
  const [tick, setTick] = useState(0); // increments every second to force countdown re-render

  // Top Seller Spotlight
  const [spotlightSellers, setSpotlightSellers] = useState([]);
  const [spotlightLoading, setSpotlightLoading] = useState(true);

  // Genuine admin-curated Featured Products row (GET /products/featured) —
  // distinct from the full searchable catalog section further down the page.
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoPlayRef = useRef(null);

  const token = localStorage.getItem("token");

  // Build slides from banner settings or use defaults
  const slides = (() => {
    if (
      bannerSetting?.slides &&
      Array.isArray(bannerSetting.slides) &&
      bannerSetting.slides.length > 0
    ) {
      return bannerSetting.slides;
    }
    // Single banner setting — make it slide 1, rest are defaults
    const s1 = {
      ...DEFAULT_SLIDES[0],
      image: bannerSetting?.image_url || farmerImg,
      title: bannerSetting?.title || DEFAULT_SLIDES[0].title,
      subtitle: bannerSetting?.subtitle || DEFAULT_SLIDES[0].subtitle,
      btnText: bannerSetting?.button_text || DEFAULT_SLIDES[0].btnText,
      btnLink: bannerSetting?.button_link || DEFAULT_SLIDES[0].btnLink,
    };
    return [s1, DEFAULT_SLIDES[1], DEFAULT_SLIDES[2]];
  })();

  const totalSlides = slides.length;

  const goToSlide = (idx) => {
    setCurrentSlide(((idx % totalSlides) + totalSlides) % totalSlides);
  };

  const startAutoPlay = () => {
    clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
  };

  useEffect(() => {
    injectCSS();

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(cart.length);

    api
      .get("/settings/banner")
      .then((r) => setBannerSetting(r.data))
      .catch(() => {});
    api
      .get("/settings/video")
      .then((r) => setVideoSetting(r.data))
      .catch(() => {
        setVideoSetting({ type: "upload", url: "/advert.mp4" });
      });
    api
      .get("/settings/site")
      .then((r) => setSiteSetting(r.data))
      .catch(() => {});

    // Category rails — fetch each category independently so a slow/empty
    // one never blocks the others; an empty category is simply hidden.
    CATEGORIES.forEach(({ slug }) => {
      setCategoryRails((prev) => ({
        ...prev,
        [slug]: { loading: true, products: [] },
      }));
      api
        .get(`/products/category/${slug}`)
        .then((r) => {
          const data = r.data?.data || (Array.isArray(r.data) ? r.data : []);
          setCategoryRails((prev) => ({
            ...prev,
            [slug]: {
              loading: false,
              products: (Array.isArray(data) ? data : []).slice(
                0,
                RAIL_PRODUCTS_LIMIT,
              ),
            },
          }));
        })
        .catch(() =>
          setCategoryRails((prev) => ({
            ...prev,
            [slug]: { loading: false, products: [] },
          })),
        );
    });

    // Flash sales — poll every 45s (within the 30-60s window) since
    // quantity_left can hit 0 before the countdown does.
    const fetchFlashSales = () => {
      api
        .get("/flash-sales")
        .then((r) => {
          setFlashSales(
            Array.isArray(r.data?.flash_sales) ? r.data.flash_sales : [],
          );
          setFlashSalesFetchedAt(Date.now());
        })
        .catch(() => {});
    };
    fetchFlashSales();
    const flashPollRef = setInterval(fetchFlashSales, 45000);
    const tickRef = setInterval(() => setTick((t) => t + 1), 1000);

    // Top Seller Spotlight
    setSpotlightLoading(true);
    api
      .get("/sellers/spotlight?limit=6")
      .then((r) =>
        setSpotlightSellers(
          Array.isArray(r.data?.spotlight_sellers)
            ? r.data.spotlight_sellers
            : [],
        ),
      )
      .catch(() => {})
      .finally(() => setSpotlightLoading(false));

    // Genuine admin-curated Featured Products (is_featured, no expiry) —
    // separate from Flash Sales and from the full searchable catalog below.
    setFeaturedLoading(true);
    api
      .get("/products/featured")
      .then((r) =>
        setFeaturedProducts(
          Array.isArray(r.data) ? r.data : r.data?.data || [],
        ),
      )
      .catch(() => {})
      .finally(() => setFeaturedLoading(false));

    startAutoPlay();
    return () => {
      clearInterval(autoPlayRef.current);
      clearInterval(flashPollRef);
      clearInterval(tickRef);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAllProducts({
      page: currentPage,
      per_page: PRODUCTS_PER_PAGE,
      search: search || undefined,
    })
      .then((res) => {
        const pData = res.data;
        const data = pData?.data || pData || [];
        setProducts(Array.isArray(data) ? data : []);
        if (pData?.meta || pData?.last_page) setMeta(pData.meta || pData);
      })
      .catch(() => setError("Unable to load products."))
      .finally(() => setLoading(false));
  }, [currentPage, search]);

  // Restart autoplay when slide changes manually
  const handleManualNav = (idx) => {
    goToSlide(idx);
    startAutoPlay();
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletter.name || !newsletter.email) {
      setNewsletterMsg("❌ Please fill name and email");
      return;
    }
    try {
      await api.post("/newsletter/subscribe", newsletter);
      setNewsletterMsg("✅ Thank you for subscribing!");
      setNewsletter({ name: "", email: "" });
    } catch {
      setNewsletterMsg("❌ Subscription failed. Try again.");
    }
    setTimeout(() => setNewsletterMsg(""), 4000);
  };

  // Live countdown for a flash sale: server gave us seconds_remaining as of
  // flashSalesFetchedAt, so we tick it down locally between polls (30-60s cadence)
  // instead of re-deriving it from ends_at, per the "don't calculate client-side" note.
  // Live countdown for a flash sale: server gave us seconds_remaining as of
  // flashSalesFetchedAt, so we tick it down locally between polls (30-60s cadence)
  // instead of re-deriving it from ends_at, per the "don't calculate client-side" note.
  // `tick` (incremented every second) is the dependency that drives the re-render.
  const liveFlashSales = useMemo(() => {
    return flashSales
      .map((sale) => {
        const elapsed = flashSalesFetchedAt
          ? Math.floor((Date.now() - flashSalesFetchedAt) / 1000)
          : 0;
        return {
          ...sale,
          _liveSecondsRemaining: Math.max(0, sale.seconds_remaining - elapsed),
        };
      })
      .filter(
        (sale) => sale._liveSecondsRemaining > 0 && sale.quantity_left > 0,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashSales, flashSalesFetchedAt, tick]);

  const formatCountdown = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const sec = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  };

  const initials = (name) =>
    (name || "?")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");

  const scoreBadgeColors = {
    Excellent: { bg: "#e6f4ea", color: "#1f4d1f" },
    Good: { bg: "#eaf2fb", color: "#1a5fa8" },
    Fair: { bg: "#fff4de", color: "#a86a00" },
    "At Risk": { bg: "#fbe9e9", color: "#a81f1f" },
  };

  const renderStars = (rating) => {
    const r = Math.round(Number(rating) || 0);
    return "★".repeat(r) + "☆".repeat(5 - r);
  };

  // Compact product card used inside the horizontal category rails.
  const renderRailCard = (product) => {
    const imageUrl =
      product.images?.[0]?.image_url ||
      product.images?.[0]?.url ||
      product.image;
    const price = Number(product.discount_price || product.price);
    const originalPrice = Number(product.price);
    const hasDiscount = product.discount_price && price < originalPrice;
    return (
      <div
        key={product.id}
        className="hp-rail-card"
        style={s.prodCard}
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <div
          style={{
            position: "relative",
            height: 130,
            background: "#f7f5f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ fontSize: 36 }}>🌿</div>
          )}
          {hasDiscount && (
            <div
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                background: "#cc0000",
                color: "#fff",
                fontSize: 8,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              SALE
            </div>
          )}
        </div>
        <div style={{ padding: 10 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#111",
              marginBottom: 3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {product.name}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#888",
              marginBottom: 5,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {product.seller?.business_name || "ACHOICE Seller"}
          </div>
          {hasDiscount ? (
            <>
              <div
                style={{
                  fontSize: 9,
                  color: "#999",
                  textDecoration: "line-through",
                }}
              >
                ₦{originalPrice.toLocaleString()}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#cc0000" }}>
                ₦{price.toLocaleString()}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1f4d1f" }}>
              ₦{price.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const totalPages = meta?.last_page || meta?.total_pages || 1;
  const paginated = products;
  const handleSearch = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const renderVideo = () => {
    if (!videoSetting)
      return (
        <video
          className="hp-video-player"
          style={s.videoPlayer}
          controls
          poster={farmerImg}
        >
          <source src="/advert.mp4" type="video/mp4" />
        </video>
      );
    if (videoSetting.type === "youtube" && videoSetting.url) {
      let embedUrl = videoSetting.url;
      const match = videoSetting.url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      );
      if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
      return (
        <iframe
          className="hp-video-player"
          style={s.videoPlayer}
          src={embedUrl}
          title="ACHOICE Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    return (
      <video
        className="hp-video-player"
        style={s.videoPlayer}
        controls
        poster={farmerImg}
      >
        <source src={videoSetting.url || "/advert.mp4"} type="video/mp4" />
      </video>
    );
  };

  const phone = siteSetting?.contact_phone || "09067794991";
  const email = siteSetting?.contact_email || "support@achoice.ng";
  const address =
    siteSetting?.address || "No 6 faith avenue off ekenwan Rd Benin City";
  const workingHours = siteSetting?.working_hours || "Mon-Sat: 07:00am-06:00pm";
  const siteName = siteSetting?.site_name || "ACHOICE LIMITED";
  const tagline = siteSetting?.tagline || "Your needs our solutions";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Navbar */}
      <nav className="hp-nav" style={s.nav}>
        <div style={s.navBrand} onClick={() => navigate("/")}>
          <img src={LOGO_PATH} alt="Achoice" style={s.navLogoImg} />
          <div>
            <div style={s.navLogoName}>{siteName}</div>
            <div style={s.navLogoTag}>{tagline}</div>
          </div>
        </div>
        <div className="hp-nav-links" style={s.navLinks}>
          <Link to="/" style={s.navLink}>
            Home
          </Link>
          <a href="#how-it-works" style={s.navLink}>
            How It Works
          </a>
          <a href="#products" style={s.navLink}>
            Shop Now
          </a>
          <a href="#loans" style={s.navLink}>
            Loans
          </a>
          <a href="#contact" style={s.navLink}>
            Contact
          </a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{ ...s.cartBtn, position: "relative" }}
            onClick={() => navigate("/cart")}
          >
            🛒 {cartCount > 0 && <span style={s.cartBadge}>{cartCount}</span>}
          </div>
          {token && <NotificationBell />}
          <div
            className="hp-nav-actions-desktop"
            style={{ display: "flex", gap: 8 }}
          >
            <button
              style={s.btnSeller}
              onClick={() => navigate("/become-a-seller")}
            >
              Become a Seller
            </button>
            {token ? (
              <button style={s.btnSolid} onClick={() => navigate("/orders")}>
                My Account
              </button>
            ) : (
              <>
                <button style={s.btnOutline} onClick={() => navigate("/login")}>
                  Sign In
                </button>
                <button
                  style={s.btnSolid}
                  onClick={() => navigate("/register")}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
          <button
            className="hp-hamburger"
            style={s.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={s.mobileMenu}>
          {[
            { label: "Home", href: "/" },
            { label: "Shop Now", href: "#products" },
            { label: "Loans", href: "#loans" },
            { label: "Contact", href: "#contact" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={s.mobileMenuItem}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div style={{ display: "flex", gap: 10, padding: "10px 20px 20px" }}>
            <button
              style={{ ...s.btnSeller, flex: 1 }}
              onClick={() => {
                navigate("/become-a-seller");
                setMenuOpen(false);
              }}
            >
              Become a Seller
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
            {token ? (
              <button
                style={{ ...s.btnSolid, flex: 1 }}
                onClick={() => {
                  navigate("/orders");
                  setMenuOpen(false);
                }}
              >
                My Account
              </button>
            ) : (
              <>
                <button
                  style={{ ...s.btnOutline, flex: 1 }}
                  onClick={() => {
                    navigate("/login");
                    setMenuOpen(false);
                  }}
                >
                  Sign In
                </button>
                <button
                  style={{ ...s.btnSolid, flex: 1 }}
                  onClick={() => {
                    navigate("/register");
                    setMenuOpen(false);
                  }}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ✅ HERO CAROUSEL — Auto-slides every 5 seconds */}
      <div className="hp-carousel">
        <div
          className="hp-carousel-track"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <div key={idx} className="hp-carousel-slide">
              <div
                className="hp-carousel-slide-bg"
                style={{ backgroundImage: `url(${slide.image || farmerImg})` }}
              />
              <div className="hp-carousel-content">
                <div className="hp-carousel-badge">{slide.badge}</div>
                <h1 className="hp-carousel-title">{slide.title}</h1>
                <p className="hp-carousel-subtitle">{slide.subtitle}</p>
                <div className="hp-carousel-buttons">
                  <button
                    className="hp-carousel-btn-primary"
                    style={{
                      background: slide.btnColor || "#f0c050",
                      color: "#1a3d1a",
                    }}
                    onClick={() =>
                      navigate(
                        token ? "/products" : slide.btnLink || "/register",
                      )
                    }
                  >
                    {token && idx === 0 ? "Go to Marketplace" : slide.btnText}
                  </button>
                  <a href="#video" className="hp-carousel-btn-secondary">
                    ▶ Watch Our Story
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Prev / Next arrows */}
        <button
          className="hp-carousel-prev"
          onClick={() => handleManualNav(currentSlide - 1)}
        >
          ‹
        </button>
        <button
          className="hp-carousel-next"
          onClick={() => handleManualNav(currentSlide + 1)}
        >
          ›
        </button>

        {/* Dots */}
        <div className="hp-carousel-dots">
          {slides.map((_, idx) => (
            <button
              key={idx}
              className={`hp-carousel-dot${idx === currentSlide ? " active" : ""}`}
              onClick={() => handleManualNav(idx)}
            />
          ))}
        </div>
      </div>

      {/* Promo Strip */}
      <div className="hp-promo-strip">
        {[
          { icon: "🚚", text: "Free Delivery on Orders above ₦50,000" },
          { icon: "✅", text: "Verified Nigerian Farmers Only" },
          { icon: "💰", text: "Farm Loans — 24hr Decision" },
          { icon: "🔒", text: "Secure Paystack Payments" },
        ].map((item) => (
          <div key={item.text} className="hp-promo-item">
            <span className="hp-promo-icon">{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Flash Sales — hidden entirely if none are currently active */}
      {liveFlashSales.length > 0 && (
        <section className="hp-flash-section">
          <div className="hp-flash-header">
            <div className="hp-flash-title">⚡ Flash Sales</div>
            <div style={{ fontSize: 11.5, color: "#a86a00" }}>
              Grab them before they're gone
            </div>
          </div>
          <div className="hp-flash-track">
            {liveFlashSales.map((sale) => {
              const soldPct = Math.min(
                100,
                Math.round((sale.quantity_sold / sale.quantity_limit) * 100),
              );
              const imageUrl = sale.product?.image;
              return (
                <div
                  key={sale.id}
                  className="hp-flash-card"
                  onClick={() => navigate(`/product/${sale.product.id}`)}
                >
                  <div
                    style={{
                      position: "relative",
                      height: 120,
                      background: "#f7f5f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={sale.product.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: 34 }}>🌿</div>
                    )}
                    <div className="hp-flash-discount-badge">
                      -{sale.discount_percent}%
                    </div>
                  </div>
                  <div className="hp-flash-timer">
                    ⏱ {formatCountdown(sale._liveSecondsRemaining)}
                  </div>
                  <div style={{ padding: "10px 10px 12px" }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#111",
                        marginBottom: 4,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {sale.product.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#cc0000",
                        }}
                      >
                        ₦{Number(sale.sale_price).toLocaleString()}
                      </div>
                      <div
                        style={{
                          fontSize: 10.5,
                          color: "#999",
                          textDecoration: "line-through",
                        }}
                      >
                        ₦{Number(sale.original_price).toLocaleString()}
                      </div>
                    </div>
                    <div className="hp-flash-progress-track">
                      <div
                        className="hp-flash-progress-fill"
                        style={{ width: `${soldPct}%` }}
                      />
                    </div>
                    <div className="hp-flash-left-label">
                      {sale.quantity_left} left of {sale.quantity_limit}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Category Quick-Links */}
      <div className="hp-cat-row">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.slug}
            className="hp-cat-item"
            onClick={() => navigate(`/products?category=${cat.slug}`)}
          >
            <div className="hp-cat-icon-circle">{cat.icon}</div>
            <div className="hp-cat-label">{cat.label}</div>
          </div>
        ))}
      </div>

      {/* Top Seller Spotlight */}
      {!spotlightLoading && spotlightSellers.length > 0 && (
        <section className="hp-spotlight-section">
          <div style={s.sectionLabel}>Trusted Farmers</div>
          <h2 className="hp-section-title" style={s.sectionTitle}>
            Top Seller Spotlight
          </h2>
          <div className="hp-spotlight-grid">
            {spotlightSellers.map((seller) => {
              const badgeColors = scoreBadgeColors[seller.score_label] || {
                bg: "#eee",
                color: "#555",
              };
              return (
                <div
                  key={seller.id}
                  className="hp-spotlight-card"
                  onClick={() => navigate(`/products?seller_id=${seller.id}`)}
                >
                  {seller.logo ? (
                    <img
                      src={seller.logo}
                      alt={seller.business_name}
                      className="hp-spotlight-logo"
                    />
                  ) : (
                    <div className="hp-spotlight-logo">
                      {initials(seller.business_name)}
                    </div>
                  )}
                  <div
                    style={{ fontSize: 13.5, fontWeight: 700, color: "#111" }}
                  >
                    {seller.business_name}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                    {seller.state}
                    {seller.lga ? `, ${seller.lga}` : ""}
                  </div>
                  <div
                    className="hp-spotlight-badge"
                    style={{
                      background: badgeColors.bg,
                      color: badgeColors.color,
                    }}
                  >
                    {seller.score_label} Seller
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section
        id="how-it-works"
        className="hp-section"
        style={{ padding: "56px 40px", backgroundColor: "#f7f5f0" }}
      >
        <div style={s.sectionLabel}>Simple Process</div>
        <h2 className="hp-section-title" style={s.sectionTitle}>
          How It Works
        </h2>
        <div className="hp-how-grid" style={s.howGrid}>
          {[
            {
              num: "01",
              icon: "🔍",
              title: "Browse Products",
              desc: "Find fresh farm produce from verified sellers across Nigeria.",
            },
            {
              num: "02",
              icon: "🛒",
              title: "Add to Cart",
              desc: "Select your products and quantities, then proceed to checkout.",
            },
            {
              num: "03",
              icon: "💳",
              title: "Pay Securely",
              desc: "Pay via Paystack — card, bank transfer, USSD or mobile money.",
            },
            {
              num: "04",
              icon: "🚚",
              title: "Get Delivered",
              desc: "Fresh produce delivered to your doorstep across Nigeria.",
            },
          ].map((item) => (
            <div key={item.num} style={s.howCard}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#c8860a",
                  letterSpacing: 2,
                  marginBottom: 10,
                }}
              >
                {item.num}
              </div>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{item.icon}</div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#111",
                  marginBottom: 7,
                }}
              >
                {item.title}
              </div>
              <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section
        id="products"
        className="hp-section"
        style={{ padding: "56px 40px", backgroundColor: "#fff" }}
      >
        <div
          className="hp-products-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div>
            <div style={s.sectionLabel}>Fresh This Week</div>
            <h2
              className="hp-section-title"
              style={{ ...s.sectionTitle, marginBottom: 0 }}
            >
              Browse All Products
            </h2>
          </div>
          <input
            className="hp-search-input"
            style={s.searchInput}
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {loading && (
          <p style={{ textAlign: "center", color: "#888", padding: 40 }}>
            Loading products...
          </p>
        )}
        {error && (
          <p style={{ textAlign: "center", color: "#cc0000", padding: 20 }}>
            {error}
          </p>
        )}

        <div className="hp-prod-grid" style={s.prodGrid}>
          {paginated.map((product) => {
            const imageUrl =
              product.images?.[0]?.image_url ||
              product.images?.[0]?.url ||
              product.image;
            const price = Number(product.discount_price || product.price);
            const originalPrice = Number(product.price);
            const hasDiscount = product.discount_price && price < originalPrice;
            return (
              <div
                key={product.id}
                style={s.prodCard}
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div
                  style={{
                    position: "relative",
                    height: 170,
                    background: "#f7f5f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 48 }}>🌿</div>
                  )}
                  {hasDiscount && (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "#cc0000",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 4,
                      }}
                    >
                      SALE
                    </div>
                  )}
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      background: "#1f4d1f",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 4,
                      textTransform: "capitalize",
                    }}
                  >
                    {product.category}
                  </div>
                </div>
                <div style={{ padding: 13 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#111",
                      marginBottom: 3,
                    }}
                  >
                    {product.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
                    {product.seller?.business_name || "ACHOICE Seller"}
                  </div>
                  {product.reviews_avg_rating > 0 && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#f0c050",
                        marginBottom: 6,
                      }}
                    >
                      {renderStars(product.reviews_avg_rating)}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      {hasDiscount ? (
                        <>
                          <div
                            style={{
                              fontSize: 10,
                              color: "#999",
                              textDecoration: "line-through",
                            }}
                          >
                            ₦{originalPrice.toLocaleString()}
                          </div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: "#cc0000",
                            }}
                          >
                            ₦{price.toLocaleString()}
                          </div>
                        </>
                      ) : (
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#1f4d1f",
                          }}
                        >
                          ₦{price.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <button
                      style={s.prodBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${product.id}`);
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginTop: 28,
              flexWrap: "wrap",
            }}
          >
            <button
              style={currentPage === 1 ? s.pageButtonDisabled : s.pageButton}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                style={page === currentPage ? s.pageNumberActive : s.pageNumber}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              style={
                currentPage === totalPages ? s.pageButtonDisabled : s.pageButton
              }
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button style={s.viewAllBtn} onClick={() => navigate("/products")}>
            View All Products →
          </button>
        </div>
      </section>

      {/* Featured Products — admin-curated (is_featured), no expiry, distinct from Flash Sales */}
      {!featuredLoading && featuredProducts.length > 0 && (
        <section className="hp-rail-section">
          <div className="hp-rail-header">
            <div className="hp-rail-title">
              <span>🌟</span> Featured Products
            </div>
            <span style={{ fontSize: 11.5, color: "#888" }}>
              Handpicked by ACHOICE
            </span>
          </div>
          <div className="hp-rail-track">
            {featuredProducts.map(renderRailCard)}
          </div>
        </section>
      )}

      {/* Category Rails — one shelf per category, hidden if that category has no products yet */}
      {CATEGORIES.map((cat) => {
        const rail = categoryRails[cat.slug];
        if (!rail || rail.loading || rail.products.length === 0) return null;
        return (
          <section key={cat.slug} className="hp-rail-section">
            <div className="hp-rail-header">
              <div className="hp-rail-title">
                <span>{cat.icon}</span> {cat.label}
              </div>
              <a
                className="hp-rail-see-all"
                href={`/products?category=${cat.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/products?category=${cat.slug}`);
                }}
              >
                See all →
              </a>
            </div>
            <div className="hp-rail-track">
              {rail.products.map(renderRailCard)}
            </div>
          </section>
        );
      })}

      {/* Video */}
      <section id="video" className="hp-video-section" style={s.videoSection}>
        <div>
          <div style={{ ...s.sectionLabel, color: "#f0c050" }}>Our Story</div>
          <h2
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 26,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.2,
              marginBottom: 14,
            }}
          >
            See How ACHOICE is Changing Nigerian Agriculture
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#a8d5a8",
              lineHeight: 1.7,
              marginBottom: 20,
            }}
          >
            Watch how we connect farmers directly to buyers, eliminate
            middlemen, and provide affordable loans to grow the agricultural
            sector.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Direct farm-to-table supply chain",
              "Verified sellers across all 36 states",
              "Loans disbursed within 24 hours",
              "Secure Paystack-powered payments",
            ].map((feat) => (
              <div
                key={feat}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "#d4ecd4",
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    background: "#f0c050",
                    borderRadius: "50%",
                    flexShrink: 0,
                  }}
                />
                {feat}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div
            style={{ borderRadius: 12, overflow: "hidden", marginBottom: 8 }}
          >
            {renderVideo()}
          </div>
          <div style={{ color: "#a8d5a8", fontSize: 11, textAlign: "center" }}>
            {videoSetting?.title ||
              "ACHOICE LIMITED — Farm to Table | Nigeria's Agricultural Marketplace"}
          </div>
        </div>
      </section>

      {/* Why */}
      <section
        className="hp-section"
        style={{ padding: "56px 40px", backgroundColor: "#fff" }}
      >
        <div style={s.sectionLabel}>Why ACHOICE</div>
        <h2 className="hp-section-title" style={s.sectionTitle}>
          Buy Fresh, Pay Less Every Time
        </h2>
        <div className="hp-why-grid" style={s.whyGrid}>
          {[
            {
              icon: "✅",
              title: "Farm Fresh Quality",
              desc: "All products sourced directly from verified farms. No middlemen, no markup.",
            },
            {
              icon: "🔒",
              title: "Secure Payments",
              desc: "Pay safely via Paystack — card, bank transfer, USSD or mobile money.",
            },
            {
              icon: "🚚",
              title: "Fast Delivery",
              desc: "Efficient logistics ensuring your fresh produce arrives on time.",
            },
            {
              icon: "💰",
              title: "Farm Loans",
              desc: "Access affordable loans with 24-hour decisions.",
            },
            {
              icon: "🌍",
              title: "Nationwide Coverage",
              desc: "Sellers and buyers from all 36 states of Nigeria on one platform.",
            },
            {
              icon: "📱",
              title: "24/7 Support",
              desc: "Our customer support team is always ready to help you shop with confidence.",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                padding: 20,
                borderRadius: 10,
                border: "1px solid #e8e4dc",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#111",
                  marginBottom: 6,
                }}
              >
                {item.title}
              </div>
              <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Loan */}
      <section id="loans" className="hp-loan-section" style={s.loanSection}>
        <div>
          <div style={s.sectionLabel}>Farm Financing</div>
          <h2
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 26,
              fontWeight: 700,
              color: "#111",
              lineHeight: 1.2,
              marginBottom: 14,
            }}
          >
            Grow Your Farm with an ACHOICE Loan
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#666",
              lineHeight: 1.7,
              marginBottom: 24,
            }}
          >
            Apply for a farm loan in minutes. Get approved and funded to expand
            your agricultural business.
          </p>
          <div
            className="hp-loan-stats"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 10,
              marginBottom: 24,
            }}
          >
            {[
              ["₦5M", "Max Loan"],
              ["24hrs", "Decision"],
              ["10%", "Flat Rate"],
              ["0", "Hidden Fees"],
            ].map(([val, label]) => (
              <div
                key={label}
                style={{
                  background: "#fff",
                  borderRadius: 8,
                  padding: "12px 8px",
                  textAlign: "center",
                  border: "1px solid #e8e4dc",
                }}
              >
                <div
                  style={{ fontSize: 16, fontWeight: 700, color: "#1f4d1f" }}
                >
                  {val}
                </div>
                <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
          <button style={s.loanBtn} onClick={() => navigate("/loans/apply")}>
            Apply for a Loan
          </button>
        </div>
        <div style={{ background: "#1f4d1f", borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 12, color: "#a8d5a8", marginBottom: 6 }}>
            Sample Loan Summary
          </div>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 32,
              fontWeight: 700,
              color: "#f0c050",
              marginBottom: 4,
            }}
          >
            ₦500,000
          </div>
          <div style={{ fontSize: 13, color: "#a8d5a8", marginBottom: 18 }}>
            Farm expansion — 6 months
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: 99,
              height: 6,
              marginBottom: 5,
            }}
          >
            <div
              style={{
                background: "#f0c050",
                width: "65%",
                height: 6,
                borderRadius: 99,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "#a8d5a8",
              marginBottom: 18,
            }}
          >
            <span>Disbursed</span>
            <span>65% repaid</span>
          </div>
          {[
            ["Monthly repayment", "₦91,667"],
            ["Interest rate", "10% flat"],
            ["Status", "Active"],
          ].map(([label, val]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span style={{ fontSize: 13, color: "#a8d5a8" }}>{label}</span>
              <span
                style={{
                  fontSize: 13,
                  color: label === "Status" ? "#a8d5a8" : "#fff",
                  fontWeight: 500,
                }}
              >
                {val}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section
        className="hp-section"
        style={{ padding: "56px 40px", backgroundColor: "#f7f5f0" }}
      >
        <div style={s.sectionLabel}>Customer Reviews</div>
        <h2 className="hp-section-title" style={s.sectionTitle}>
          What Our Customers Say
        </h2>
        <div className="hp-test-grid" style={s.testGrid}>
          {[
            {
              name: "Chinedu Okafor",
              location: "Lagos",
              text: "Buying yams and vegetables here has been stress-free and always fresh. Delivery is prompt too.",
            },
            {
              name: "Amina Yusuf",
              location: "Kano",
              text: "I love how affordable their foodstuff is compared to the market. Great for family shopping.",
            },
            {
              name: "Bola Adeyemi",
              location: "Ibadan",
              text: "Their produce is very healthy, and I have never had complaints. Highly recommend for bulk buyers.",
            },
            {
              name: "Ngozi Eze",
              location: "Enugu",
              text: "As a caterer, I rely on them for large orders. The quality and freshness are always consistent.",
            },
          ].map((t) => (
            <div
              key={t.name}
              style={{
                background: "#fff",
                borderRadius: 10,
                padding: 20,
                border: "1px solid #e8e4dc",
              }}
            >
              <div style={{ color: "#f0c050", fontSize: 14, marginBottom: 10 }}>
                ★★★★★
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "#555",
                  lineHeight: 1.7,
                  marginBottom: 14,
                  fontStyle: "italic",
                }}
              >
                "{t.text}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    background: "#1f4d1f",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#f0c050",
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#888" }}>
                    {t.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section
        className="hp-section"
        style={{
          padding: "56px 40px",
          background: "#1f4d1f",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ ...s.sectionLabel, color: "#f0c050" }}>
            Stay Updated
          </div>
          <h2
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 26,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 12,
            }}
          >
            Subscribe to Our Newsletter
          </h2>
          <p style={{ fontSize: 14, color: "#a8d5a8", marginBottom: 24 }}>
            Get the latest farm produce deals, loan offers and agricultural
            news.
          </p>
          {newsletterMsg && (
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "#f0c050",
                padding: "10px 20px",
                borderRadius: 6,
                marginBottom: 14,
                fontSize: 14,
              }}
            >
              {newsletterMsg}
            </div>
          )}
          <form
            className="hp-newsletter-form"
            onSubmit={handleNewsletterSubmit}
            style={{
              display: "flex",
              gap: 8,
              maxWidth: 500,
              margin: "0 auto",
              flexWrap: "wrap",
            }}
          >
            <input
              style={{
                flex: 1,
                minWidth: 120,
                padding: "11px 14px",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontFamily: "inherit",
                outline: "none",
              }}
              type="text"
              placeholder="Your name"
              value={newsletter.name}
              onChange={(e) =>
                setNewsletter({ ...newsletter, name: e.target.value })
              }
              required
            />
            <input
              style={{
                flex: 2,
                minWidth: 160,
                padding: "11px 14px",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontFamily: "inherit",
                outline: "none",
              }}
              type="email"
              placeholder="Your email address"
              value={newsletter.email}
              onChange={(e) =>
                setNewsletter({ ...newsletter, email: e.target.value })
              }
              required
            />
            <button
              type="submit"
              style={{
                padding: "11px 20px",
                background: "#f0c050",
                color: "#1a3d1a",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* CTA */}
      <section
        className="hp-section"
        style={{
          padding: "56px 40px",
          background: "#1a3d1a",
          textAlign: "center",
        }}
      >
        <h2
          className="hp-cta-title"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 30,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 12,
          }}
        >
          Ready to Buy Fresh and Pay Less?
        </h2>
        <p style={{ fontSize: 14, color: "#a8d5a8", marginBottom: 28 }}>
          Join thousands of Nigerians already shopping fresh farm produce on
          ACHOICE.
        </p>
        <div
          className="hp-cta-buttons"
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              padding: "13px 28px",
              background: "#f0c050",
              color: "#1a3d1a",
              border: "none",
              borderRadius: 7,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onClick={() => navigate("/register")}
          >
            Create Free Account
          </button>
          <button
            style={{
              padding: "13px 28px",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 7,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        style={{ background: "#111", padding: "48px 40px 0" }}
      >
        <div
          className="hp-footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 32,
            marginBottom: 40,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <img
                src={LOGO_PATH}
                alt="Achoice"
                style={{ width: 36, height: 36, objectFit: "contain" }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  {siteName}
                </div>
                <div style={{ fontSize: 10, color: "#a8d5a8" }}>{tagline}</div>
              </div>
            </div>
            <p
              style={{
                fontSize: 12,
                color: "#555",
                lineHeight: 1.7,
                marginBottom: 16,
              }}
            >
              ACHOICE LIMITED bridges the gap between farmers and customers
              looking to buy fresh farm products cheap.
            </p>
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#f0c050",
                marginBottom: 14,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Products
            </div>
            {[
              "Grains & Cereals",
              "Vegetables",
              "Tubers & Roots",
              "Oils & Fats",
              "Livestock",
            ].map((item) => (
              <div
                key={item}
                style={{
                  fontSize: 12,
                  color: "#555",
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                {item}
              </div>
            ))}
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#f0c050",
                marginBottom: 14,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Explore
            </div>
            {[
              "About Us",
              "How It Works",
              "Become a Seller",
              "Farm Loans",
              "Privacy Policy",
            ].map((item) => (
              <div
                key={item}
                style={{
                  fontSize: 12,
                  color: "#555",
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                {item}
              </div>
            ))}
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#f0c050",
                marginBottom: 14,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Contact Us
            </div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>
              📍 {address}
            </div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>
              ✉ {email}
            </div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>
              📞 {phone}
            </div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>
              🕐 {workingHours}
            </div>
          </div>
        </div>
        <div
          className="hp-footer-bottom"
          style={{
            borderTop: "1px solid #222",
            padding: "16px 0",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "#444",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <span>© 2026 {siteName}. All rights reserved.</span>
          <span>Privacy Policy | Terms of Service</span>
        </div>
      </footer>
    </div>
  );
}

const s = {
  topBar: {
    background: "#1f4d1f",
    color: "#fff",
    padding: "7px 40px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    flexWrap: "wrap",
    gap: 4,
  },
  nav: {
    background: "#fff",
    padding: "12px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #eee",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    cursor: "pointer",
    flexShrink: 0,
  },
  navLogoImg: { width: 40, height: 40, objectFit: "contain" },
  navLogoName: { fontSize: 14, fontWeight: 700, color: "#1f4d1f", display: "none" },
  navLogoTag: { fontSize: 10, color: "#888", display: "none" },
  navLinks: { display: "flex", gap: 32, alignItems: "center" },
  navLink: { textDecoration: "none", color: "#333", fontSize: 14 },
  cartBtn: { fontSize: 20, cursor: "pointer" },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    background: "#f0c050",
    color: "#1a1a1a",
    fontSize: 10,
    fontWeight: 700,
    borderRadius: "50%",
    width: 16,
    height: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutline: {
    padding: "8px 14px",
    border: "1px solid #1f4d1f",
    color: "#1f4d1f",
    borderRadius: 6,
    fontSize: 13,
    background: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnSolid: {
    padding: "8px 14px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnSeller: {
    padding: "8px 14px",
    background: "#f0c050",
    color: "#1a3d1a",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  hamburger: {
    background: "none",
    border: "none",
    fontSize: 24,
    cursor: "pointer",
    color: "#1f4d1f",
    padding: 4,
  },
  mobileMenu: {
    background: "#fff",
    borderBottom: "2px solid #eee",
    display: "flex",
    flexDirection: "column",
    zIndex: 99,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  mobileMenuItem: {
    padding: "14px 20px",
    color: "#333",
    textDecoration: "none",
    fontSize: 15,
    borderBottom: "1px solid #f5f5f5",
    display: "block",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#c8860a",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: "Georgia, serif",
    fontSize: 28,
    fontWeight: 700,
    color: "#111",
    marginBottom: 28,
    textAlign: "center",
  },
  howGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 24,
    maxWidth: 1000,
    margin: "0 auto",
  },
  howCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 28,
    border: "1px solid #e8e4dc",
    textAlign: "center",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  howCardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1f4d1f",
    marginBottom: 12,
  },
  howCardText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 1.6,
  },
  searchInput: {
    padding: "10px 16px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 14,
    width: "100%",
    maxWidth: 280,
    outline: "none",
    fontFamily: "inherit",
  },
  prodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 16,
  },
  prodCard: {
    background: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #e8e4dc",
    cursor: "pointer",
  },
  prodBtn: {
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    padding: "7px 12px",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  pageButton: {
    padding: "9px 18px",
    background: "#fff",
    color: "#1f4d1f",
    border: "1px solid #1f4d1f",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  pageButtonDisabled: {
    padding: "9px 18px",
    background: "#f5f5f5",
    color: "#ccc",
    border: "1px solid #eee",
    borderRadius: 6,
    fontSize: 13,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  pageNumber: {
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    color: "#555",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  pageNumberActive: {
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1f4d1f",
    color: "#fff",
    border: "1px solid #1f4d1f",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 700,
  },
  viewAllBtn: {
    padding: "12px 28px",
    background: "#f0c050",
    color: "#1a3d1a",
    border: "none",
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  videoSection: {
    padding: "56px 40px",
    background: "#1a3d1a",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 40,
    alignItems: "center",
  },
  videoPlayer: {
    width: "100%",
    height: 260,
    border: "none",
    display: "block",
    objectFit: "cover",
  },
  whyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: 18,
  },
  loanSection: {
    padding: "56px 40px",
    background: "#f7f5f0",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 40,
    alignItems: "center",
  },
  loanBtn: {
    padding: "12px 24px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  testGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16,
  },
};
