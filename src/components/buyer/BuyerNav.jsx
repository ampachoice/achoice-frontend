import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../../services/productService";
import NotificationBell from "./NotificationBell";
import BuyerDropdown from "./BuyerDropdown";
import CloseAccountModal from "../common/CloseAccountModal";
import useLogout from "../../hooks/useLogout";

const CSS = `
  .bn-search-group { flex:1; max-width:500px; margin:0 10px; display:flex; background:#fff; border-radius:25px; overflow:hidden; border:2px solid #f0c050; min-width:0; }
  .bn-search-group select { padding:8px 10px; border:none; border-right:1px solid #eee; background:#f9f9f9; font-size:13px; outline:none; cursor:pointer; flex-shrink:0; min-width:80px; }
  .bn-search-group input { flex:1; padding:9px 14px; border:none; outline:none; font-size:14px; min-width:0; background:transparent; }

  @media (max-width:900px) {
    .bn-search-group { display:none; }
    .bn-actions-desktop { display:none !important; }
    .bn-hamburger-btn { display:block !important; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// BuyerNav — the single shared desktop/mobile header for every buyer page.
//
// Extracted directly from ProductPage.jsx's nav, which was the one page
// where this actually rendered correctly and consistently. Every other
// buyer page had built its own slightly-different version independently —
// different logo paths (some broken), some missing the cart icon or Become
// a Seller button, some missing BuyerDropdown entirely, some with icons
// overlapping. This component exists so there is exactly one nav to
// maintain instead of six-plus slightly different copies.
//
// Usage: <BuyerNav /> — no props needed, it's fully self-contained.
// Pass showSearch to opt in to the category+search bar (e.g. <BuyerNav showSearch />
// on the products listing page). Defaults to false so it's hidden everywhere else.
// ─────────────────────────────────────────────────────────────────────────────
export default function BuyerNav({ showSearch = false }) {
  const navigate = useNavigate();
  const logout = useLogout();
  const token = localStorage.getItem("token");

  const [cartCount, setCartCount] = useState(0);
  const [categories, setCategories] = useState(["All"]);
  const [selectedCat, setSelectedCat] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  useEffect(() => {
    const sync = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.reduce((a, i) => a + (i.quantity || 0), 0));
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!showSearch) return;
    getCategories()
      .then((res) => setCategories(["All", ...(res.data || [])]))
      .catch(() => {});
  }, [showSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedCat && selectedCat !== "All") params.set("category", selectedCat);
    const qs = params.toString();
    navigate(`/products${qs ? `?${qs}` : ""}`);
  };

  return (
    <>
      <style>{CSS}</style>

      <nav
        style={{
          background: "#1f4d1f",
          padding: "10px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 200,
          gap: 12,
          flexWrap: "nowrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            flexShrink: 0,
          }}
          onClick={() => navigate("/products")}
        >
          <img
            src="/android-chrome-192x192.png"
            alt="Achoice"
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              objectFit: "contain",
            }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>

        {showSearch && (
          <form onSubmit={handleSearchSubmit} className="bn-search-group">
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        )}

        {/* Right side actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 22,
              cursor: "pointer",
              position: "relative",
              color: "#fff",
              display: "flex",
              alignItems: "center",
            }}
            onClick={() => navigate("/cart")}
          >
            🛒
            {cartCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -8,
                  right: -10,
                  background: "#f0c050",
                  color: "#1f4d1f",
                  fontSize: 10,
                  fontWeight: 700,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #1f4d1f",
                }}
              >
                {cartCount}
              </span>
            )}
          </div>
          {token && <NotificationBell />}
          <div
            className="bn-actions-desktop"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <button
              style={{
                padding: "8px 14px",
                border: "1.5px solid #f0c050",
                color: "#f0c050",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                background: "transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
              onClick={() => navigate("/become-a-seller")}
            >
              Become a Seller
            </button>
            {token ? (
              <BuyerDropdown cartCount={cartCount} />
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{
                    padding: "8px 14px",
                    border: "1px solid #fff",
                    color: "#fff",
                    borderRadius: 6,
                    fontSize: 13,
                    background: "transparent",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </button>
                <button
                  style={{
                    padding: "8px 14px",
                    background: "#f0c050",
                    color: "#1a3d1a",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: 700,
                  }}
                  onClick={() => navigate("/register")}
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
          {/* Mobile hamburger — reveals the actions above via the mobile menu below, which already duplicates Become a Seller / Sign In / Get Started */}
          <button
            className="bn-hamburger-btn"
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "#fff",
              padding: 4,
              display: "none",
            }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.5)",
          }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "75%",
              maxWidth: 300,
              background: "#fff",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-4px 0 20px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "#1f4d1f",
                padding: "20px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
                Menu
              </span>
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: 22,
                  cursor: "pointer",
                }}
                onClick={() => setMenuOpen(false)}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {[
                { label: "🛍️ Shop Products", path: "/products" },
                { label: "👤 My Profile", path: "/profile" },
                { label: "🛒 Cart", path: "/cart" },
                { label: "📦 My Orders", path: "/orders" },
                { label: "💰 Apply for Loan", path: "/loans/apply" },
                { label: "📋 My Loans", path: "/loans/repay" },
                { label: "📝 Complaints & Refunds", path: "/complaints" },
                { label: "⭐ Pending Reviews", path: "/reviews/pending" },
                { label: "🔔 Notifications", path: "/notifications" },
                { label: "🏪 Become a Seller", path: "/become-a-seller" },
              ].map((item) => (
                <div
                  key={item.path}
                  style={{
                    padding: "14px 20px",
                    cursor: "pointer",
                    fontSize: 15,
                    color: "#222",
                    borderBottom: "1px solid #f5f5f5",
                  }}
                  onClick={() => {
                    navigate(item.path);
                    setMenuOpen(false);
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
            <div style={{ padding: "16px 20px", borderTop: "1px solid #eee" }}>
              {token ? (
                <>
                  <button
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "none",
                      color: "#a81f1f",
                      border: "1px solid #f3b3b3",
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      marginBottom: 8,
                    }}
                    onClick={() => {
                      setMenuOpen(false);
                      setShowCloseModal(true);
                    }}
                  >
                    ⚠️ Close Account
                  </button>
                  <button
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "#fff0f0",
                      color: "#cc0000",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                  >
                    🚪 Logout
                  </button>
                </>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "#fff",
                      color: "#1f4d1f",
                      border: "1px solid #1f4d1f",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                    onClick={() => {
                      navigate("/login");
                      setMenuOpen(false);
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "#1f4d1f",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                    onClick={() => {
                      navigate("/register");
                      setMenuOpen(false);
                    }}
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <CloseAccountModal onClose={() => setShowCloseModal(false)} />
      )}
    </>
  );
}
