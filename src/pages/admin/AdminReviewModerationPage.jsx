import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminReviewModerationPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'flagged'
  const [busyId, setBusyId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const fetchReviews = (f = filter) => {
    setLoading(true);
    const params = f === 'flagged' ? { flagged: 1 } : {};
    api.get('/admin/reviews/pending', { params })
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setReviews(Array.isArray(data) ? data : []);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleFilter = (f) => { setFilter(f); fetchReviews(f); };

  const handleApprove = async (id) => {
    setBusyId(id);
    try {
      await api.patch(`/admin/reviews/${id}/approve`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast('✅ Review approved and published.');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to approve.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setBusyId(rejectId);
    try {
      await api.patch(`/admin/reviews/${rejectId}/reject`, { reason: rejectReason });
      setReviews((prev) => prev.filter((r) => r.id !== rejectId));
      setRejectId(null);
      setRejectReason('');
      showToast('Review rejected.');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to reject.');
    } finally {
      setBusyId(null);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : '';

  const Stars = ({ rating }) => (
    <span style={{ color: '#f0c050', fontSize: 14 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );

  return (
    <AdminLayout>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff',
          padding: '12px 24px', borderRadius: 8, fontSize: 14, zIndex: 9999,
        }}>{toast}</div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 420, width: '100%' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Reject Review</div>
            <textarea
              style={{
                width: '100%', padding: '10px 14px', border: '1.5px solid #ddd',
                borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
                boxSizing: 'border-box', resize: 'vertical', outline: 'none', marginBottom: 14,
              }}
              rows={3}
              placeholder="Reason for rejection (required)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                style={{
                  padding: '9px 18px', background: '#f0f0f0', color: '#333',
                  border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}
                onClick={() => { setRejectId(null); setRejectReason(''); }}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: '9px 18px', background: busyId ? '#ccc' : '#cc0000',
                  color: '#fff', border: 'none', borderRadius: 7, fontSize: 13,
                  fontWeight: 600, cursor: busyId ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}
                onClick={handleReject}
                disabled={!!busyId || !rejectReason.trim()}
              >
                {busyId ? 'Rejecting...' : 'Reject Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
              Review Moderation
            </h1>
            <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
              Approve or reject customer reviews before they go live.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'flagged'].map((f) => (
              <button
                key={f}
                style={{
                  padding: '8px 16px', borderRadius: 99, fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: filter === f ? 700 : 400,
                  background: filter === f ? (f === 'flagged' ? '#cc0000' : '#1f4d1f') : '#f0f0f0',
                  color: filter === f ? '#fff' : '#555', border: 'none',
                }}
                onClick={() => handleFilter(f)}
              >
                {f === 'flagged' ? '🚩 Flagged Only' : 'All Pending'}
              </button>
            ))}
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading reviews...</div>}

        {!loading && reviews.length === 0 && (
          <div style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc',
            padding: '60px 20px', textAlign: 'center', color: '#888', fontSize: 14,
          }}>
            {filter === 'flagged' ? '🎉 No flagged reviews.' : '🎉 No pending reviews.'}
          </div>
        )}

        {!loading && reviews.map((review) => (
          <div
            key={review.id}
            style={{
              background: '#fff', borderRadius: 12, marginBottom: 14,
              border: review.flagged_reason ? '2px solid #ffb3b3' : '1px solid #e8e4dc',
              overflow: 'hidden',
            }}
          >
            {/* Flagged banner */}
            {review.flagged_reason && (
              <div style={{
                background: '#fff0f0', borderBottom: '1px solid #ffb3b3',
                padding: '8px 18px', fontSize: 12, color: '#cc0000', fontWeight: 600,
              }}>
                🚩 Auto-flagged: {review.flagged_reason}
              </div>
            )}

            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <Stars rating={review.rating} />
                    {review.title && (
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{review.title}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    By <strong>{review.user?.name || 'Anonymous'}</strong>
                    {' · '}
                    {review.product?.name && <span>on <strong>{review.product.name}</strong>{' · '}</span>}
                    {fmtDate(review.created_at)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    style={{
                      padding: '7px 16px', background: busyId === review.id ? '#ccc' : '#1f4d1f',
                      color: '#fff', border: 'none', borderRadius: 7, fontSize: 13,
                      fontWeight: 600, cursor: busyId === review.id ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                    onClick={() => handleApprove(review.id)}
                    disabled={busyId === review.id}
                  >
                    {busyId === review.id ? '...' : '✓ Approve'}
                  </button>
                  <button
                    style={{
                      padding: '7px 16px', background: '#fff', color: '#cc0000',
                      border: '1.5px solid #cc0000', borderRadius: 7, fontSize: 13,
                      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                    onClick={() => { setRejectId(review.id); setRejectReason(''); }}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0 }}>
                {review.comment}
              </p>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
