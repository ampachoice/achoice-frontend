import { useState, useEffect, useCallback } from "react";
import SellerLayout from "../../components/seller/SellerLayout";
import { getSellerReviews, replyToReview, deleteReviewReply } from "../../services/sellerService";

const stars = (rating) => "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));

export default function SellerReviewsPage() {
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState({}); // { [reviewId]: text }
  const [replyingId, setReplyingId] = useState(null);
  const [editingReplyId, setEditingReplyId] = useState(null);

  const loadReviews = useCallback(() => {
    setLoading(true);
    getSellerReviews({ page, ...(ratingFilter && { rating: ratingFilter }) })
      .then((res) => {
        setSummary(res.data?.summary);
        setReviews(res.data?.reviews?.data || []);
        setMeta(res.data?.reviews);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, ratingFilter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    setPage(1);
  }, [ratingFilter]);

  const handleSubmitReply = async (review) => {
    const text = (replyDrafts[review.id] || "").trim();
    if (!text) return;
    setReplyingId(review.id);
    try {
      await replyToReview(review.id, text);
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, seller_reply: text, seller_replied_at: new Date().toISOString() } : r)));
      setEditingReplyId(null);
      setReplyDrafts((prev) => ({ ...prev, [review.id]: "" }));
    } catch {
      // leave the draft in place so nothing typed is lost
    } finally {
      setReplyingId(null);
    }
  };

  const handleDeleteReply = async (review) => {
    if (!window.confirm("Remove your reply to this review?")) return;
    try {
      await deleteReviewReply(review.id);
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, seller_reply: null, seller_replied_at: null } : r)));
    } catch {
      // no-op — the reply just stays visible if this fails
    }
  };

  return (
    <SellerLayout title="Reviews" subtitle="What buyers are saying about your products.">
      {summary && (
        <div style={s.summaryCard}>
          <div>
            <div style={s.summaryRating}>{summary.average_rating || 0}</div>
            <div style={{ color: "#f0c050", fontSize: 18 }}>{stars(summary.average_rating || 0)}</div>
            <div style={{ fontSize: 12.5, color: "#888", marginTop: 4 }}>{summary.total_reviews} review{summary.total_reviews === 1 ? "" : "s"}</div>
          </div>
          <div style={s.filterRow}>
            {["", "5", "4", "3", "2", "1"].map((r) => (
              <button key={r || "all"} style={ratingFilter === r ? s.tabActive : s.tab} onClick={() => setRatingFilter(r)}>
                {r ? `${r} ★` : "All"}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={s.emptyState}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div style={s.emptyState}>{ratingFilter ? `No ${ratingFilter}-star reviews.` : "No reviews yet."}</div>
      ) : (
        <div style={s.list}>
          {reviews.map((r) => (
            <div key={r.id} style={s.reviewCard}>
              <div style={s.reviewHeader}>
                <div>
                  <span style={{ fontWeight: 700, color: "#111", fontSize: 13.5 }}>{r.user?.name || "Anonymous"}</span>
                  <span style={{ color: "#888", fontSize: 12, marginLeft: 8 }}>on {r.product?.name}</span>
                </div>
                <span style={{ color: "#f0c050", fontSize: 14 }}>{stars(r.rating)}</span>
              </div>
              {r.comment && <div style={s.reviewComment}>{r.comment}</div>}
              <div style={s.reviewDate}>{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>

              {r.seller_reply && editingReplyId !== r.id ? (
                <div style={s.replyBox}>
                  <div style={s.replyLabel}>Your reply</div>
                  <div style={s.replyText}>{r.seller_reply}</div>
                  <div style={s.replyActions}>
                    <button style={s.replyLinkBtn} onClick={() => { setEditingReplyId(r.id); setReplyDrafts((prev) => ({ ...prev, [r.id]: r.seller_reply })); }}>Edit</button>
                    <button style={{ ...s.replyLinkBtn, color: "#a81f1f" }} onClick={() => handleDeleteReply(r)}>Delete</button>
                  </div>
                </div>
              ) : (
                <div style={s.replyForm}>
                  <textarea
                    style={s.replyInput}
                    placeholder="Reply to this review..."
                    maxLength={1000}
                    value={replyDrafts[r.id] ?? ""}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  />
                  <div style={s.replyActions}>
                    {editingReplyId === r.id && (
                      <button style={s.replyLinkBtn} onClick={() => setEditingReplyId(null)}>Cancel</button>
                    )}
                    <button
                      style={s.replySubmitBtn}
                      disabled={replyingId === r.id || !(replyDrafts[r.id] || "").trim()}
                      onClick={() => handleSubmitReply(r)}
                    >
                      {replyingId === r.id ? "Saving..." : "Reply"}
                    </button>
                  </div>
                </div>
              )}
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
    </SellerLayout>
  );
}

const s = {
  summaryCard: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: "20px 24px", marginBottom: 20 },
  summaryRating: { fontSize: 30, fontWeight: 700, color: "#111" },
  filterRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  tab: { padding: "7px 13px", background: "#f7f5f0", border: "1px solid #e8e4dc", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#555", cursor: "pointer", fontFamily: "inherit" },
  tabActive: { padding: "7px 13px", background: "#1f4d1f", border: "1px solid #1f4d1f", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: "inherit" },
  emptyState: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: 48, textAlign: "center", color: "#888", fontSize: 14 },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  reviewCard: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: "16px 18px" },
  reviewHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  reviewComment: { fontSize: 13, color: "#333", lineHeight: 1.5, marginBottom: 8 },
  reviewDate: { fontSize: 11, color: "#aaa" },
  replyBox: { background: "#f7fbf7", border: "1px solid #cfe8cf", borderRadius: 8, padding: "10px 12px", marginTop: 10 },
  replyLabel: { fontSize: 10.5, fontWeight: 700, color: "#1f4d1f", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 },
  replyText: { fontSize: 12.5, color: "#333", lineHeight: 1.5 },
  replyForm: { marginTop: 10 },
  replyInput: { width: "100%", minHeight: 60, padding: "9px 11px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 12.5, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" },
  replyActions: { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 6 },
  replyLinkBtn: { background: "none", border: "none", color: "#1f4d1f", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", padding: 0 },
  replySubmitBtn: { padding: "7px 16px", background: "#1f4d1f", color: "#fff", border: "none", borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 18 },
  pageBtn: { padding: "8px 16px", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
};
