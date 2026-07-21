import { useState, useEffect } from "react";
import SellerLayout from "../../components/seller/SellerLayout";
import { getSellerFollowers } from "../../services/sellerService";

const initials = (name) => (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

export default function SellerFollowersPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSellerFollowers({ page })
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const followers = data?.followers?.data || [];
  const meta = data?.followers;

  return (
    <SellerLayout title="Followers" subtitle="Buyers who follow your store.">
      {loading && !data ? (
        <div style={s.emptyState}>Loading followers...</div>
      ) : (
        <>
          <div style={s.countCard}>
            <div style={s.countValue}>{data?.total_followers ?? 0}</div>
            <div style={s.countLabel}>People following your store</div>
          </div>

          {followers.length === 0 ? (
            <div style={s.emptyState}>No followers yet — buyers can follow your store from your public storefront.</div>
          ) : (
            <div style={s.list}>
              {followers.map((f) => (
                <div key={f.id} style={s.row}>
                  <div style={s.avatar}>{initials(f.user?.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.name}>{f.user?.name || "Buyer"}</div>
                    <div style={s.date}>Following since {new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {meta && meta.last_page > 1 && (
            <div style={s.pagination}>
              <button style={s.pageBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span style={{ fontSize: 12.5, color: "#666" }}>Page {meta.current_page} of {meta.last_page}</span>
              <button style={s.pageBtn} disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </SellerLayout>
  );
}

const s = {
  emptyState: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: 48, textAlign: "center", color: "#888", fontSize: 14 },
  countCard: { background: "#1f4d1f", borderRadius: 14, padding: "24px 28px", marginBottom: 20 },
  countValue: { fontSize: 32, fontWeight: 700, color: "#fff" },
  countLabel: { fontSize: 12.5, color: "#a8d5a8", marginTop: 4 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  row: { display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: "14px 16px" },
  avatar: { width: 40, height: 40, borderRadius: "50%", background: "#f7f5f0", border: "1px solid #e8e4dc", color: "#1f4d1f", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  name: { fontSize: 13.5, fontWeight: 700, color: "#111" },
  date: { fontSize: 11.5, color: "#888", marginTop: 2 },
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 18 },
  pageBtn: { padding: "8px 16px", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
};
