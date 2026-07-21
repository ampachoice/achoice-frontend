import { useNavigate } from "react-router-dom";
import NotificationBell from "../buyer/NotificationBell";
import BuyerDropdown from "../buyer/BuyerDropdown";

/**
 * The loan pages (LoanApplyPage, LoansListPage, LoanDetailPage,
 * LoanLiquidatePage, LoanSchedulePage) are shared between buyers and
 * sellers — both roles can reach /loans/* — but their header actions
 * (cart icon, BuyerDropdown with buyer-only links like "My Orders" →
 * /orders and "My Profile" → /profile) were hardcoded for a buyer session.
 *
 * This swaps that block for something seller-appropriate when a seller is
 * logged in, and renders the exact original buyer chrome otherwise — so
 * buyer behavior is completely unchanged.
 */
export default function LoanHeaderActions({ cartCount = 0 }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (user.role === "seller") {
    const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    };
    return (
      <div style={s.sellerActions}>
        <button style={s.backBtn} onClick={() => navigate("/seller/dashboard")}>← Seller Dashboard</button>
        <NotificationBell />
        <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div style={s.buyerActions}>
      <div style={s.cartIcon} onClick={() => navigate("/cart")}>
        🛒 {cartCount > 0 && <span style={s.cartBadge}>{cartCount}</span>}
      </div>
      <NotificationBell />
      <BuyerDropdown cartCount={cartCount} />
    </div>
  );
}

const s = {
  sellerActions: { display: "flex", alignItems: "center", gap: 16 },
  backBtn: { background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  logoutBtn: { background: "none", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  buyerActions: { display: "flex", alignItems: "center", gap: 16 },
  cartIcon: { position: "relative", cursor: "pointer", color: "#fff", fontSize: 18 },
  cartBadge: { position: "absolute", top: -8, right: -10, background: "#f0c050", color: "#1a3d1a", fontSize: 10, fontWeight: 700, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
};
