import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../../components/seller/SellerLayout";
import { getSellerProfile, getPublicSellerProfile, getPublicSellerProducts } from "../../services/sellerService";

const SCORE_COLORS = {
  Excellent: { bg: "#e6f4ea", color: "#1f4d1f" },
  Good: { bg: "#eaf2fb", color: "#1a5fa8" },
  Fair: { bg: "#fff4de", color: "#a86a00" },
  "At Risk": { bg: "#fbe9e9", color: "#a81f1f" },
};

const initials = (name) => (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

export default function SellerStorePreviewPage() {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [publicProfile, setPublicProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSellerProfile()
      .then((res) => {
        setSeller(res.data);
        if (res.data.status === "active") {
          Promise.all([
            getPublicSellerProfile(res.data.id),
            getPublicSellerProducts(res.data.id, { per_page: 12 }),
          ])
            .then(([profileRes, productsRes]) => {
              setPublicProfile(profileRes.data);
              const pData = productsRes.data;
              setProducts(pData?.data || (Array.isArray(pData) ? pData : []));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const storeUrl = seller ? `${window.location.origin}/products?seller_id=${seller.id}` : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy your store link:", storeUrl);
    }
  };

  if (loading) {
    return (
      <SellerLayout title="Preview Store">
        <div style={s.emptyState}>Loading your store preview...</div>
      </SellerLayout>
    );
  }

  if (seller?.status !== "active") {
    return (
      <SellerLayout title="Preview Store">
        <div style={s.emptyState}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>🏪</div>
          Your storefront preview will be available once your seller account is approved.
        </div>
      </SellerLayout>
    );
  }

  const colors = SCORE_COLORS[publicProfile?.score_label] || { bg: "#eee", color: "#555" };

  return (
    <SellerLayout title="Preview Store" subtitle="This is what buyers see when they visit your store.">
      <div style={s.linkRow}>
        <input style={s.linkInput} readOnly value={storeUrl} onClick={(e) => e.target.select()} />
        <button style={s.copyBtn} onClick={handleCopyLink}>{copied ? "Copied ✓" : "Copy Store Link"}</button>
        <a style={s.openBtn} href={storeUrl} target="_blank" rel="noreferrer">Open in New Tab ↗</a>
      </div>

      {publicProfile && (
        <div style={s.profileCard}>
          <div style={s.logoCircle}>
            {publicProfile.logo ? <img src={publicProfile.logo} alt="" style={s.logoImg} /> : initials(publicProfile.business_name)}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#111" }}>{publicProfile.business_name}</div>
            <div style={{ fontSize: 12.5, color: "#888", margin: "3px 0 8px" }}>
              {publicProfile.state}{publicProfile.lga ? `, ${publicProfile.lga}` : ""}
            </div>
            {publicProfile.description && <div style={{ fontSize: 13, color: "#444", marginBottom: 10 }}>{publicProfile.description}</div>}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ ...s.scoreBadge, background: colors.bg, color: colors.color }}>{publicProfile.score_label} Seller</span>
              <span style={{ fontSize: 13, color: "#666" }}>★ {Number(publicProfile.rating || 0).toFixed(1)}</span>
              <span style={{ fontSize: 13, color: "#666" }}>{publicProfile.total_sales} sales</span>
            </div>
          </div>
        </div>
      )}

      <div style={s.sectionTitle}>Your Products ({products.length})</div>
      {products.length === 0 ? (
        <div style={s.emptyState}>No available products showing on your storefront yet.</div>
      ) : (
        <div style={s.grid}>
          {products.map((p) => (
            <div key={p.id} style={s.card} onClick={() => navigate(`/product/${p.id}`)}>
              <div style={s.cardImage}>
                {p.image ? <img src={p.image} alt={p.name} style={s.cardImageImg} /> : <span style={{ fontSize: 30 }}>🌿</span>}
              </div>
              <div style={{ padding: 10 }}>
                <div style={s.cardName}>{p.name}</div>
                <div style={{ fontWeight: 700, color: "#1f4d1f", fontSize: 13 }}>₦{Number(p.discount_price || p.price).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SellerLayout>
  );
}

const s = {
  emptyState: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: 48, textAlign: "center", color: "#888", fontSize: 14 },
  linkRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 },
  linkInput: { flex: 1, minWidth: 220, padding: "11px 14px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 12.5, color: "#666", fontFamily: "inherit", background: "#f7f5f0" },
  copyBtn: { padding: "11px 20px", background: "#1f4d1f", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  openBtn: { padding: "11px 20px", background: "#fff", color: "#1f4d1f", border: "1.5px solid #1f4d1f", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", whiteSpace: "nowrap" },
  profileCard: { display: "flex", gap: 20, alignItems: "flex-start", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: 22, marginBottom: 26, flexWrap: "wrap" },
  logoCircle: { width: 72, height: 72, borderRadius: "50%", background: "#1f4d1f", color: "#fff", fontWeight: 700, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 },
  logoImg: { width: "100%", height: "100%", objectFit: "cover" },
  scoreBadge: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 14 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 },
  card: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, overflow: "hidden", cursor: "pointer" },
  cardImage: { height: 110, background: "#f7f5f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  cardImageImg: { width: "100%", height: "100%", objectFit: "cover" },
  cardName: { fontSize: 12.5, fontWeight: 600, color: "#111", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
};
