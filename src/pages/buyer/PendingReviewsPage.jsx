import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { submitProductReview } from '../../services/productService';
import BuyerNav from '../../components/buyer/BuyerNav';

export default function PendingReviewsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null); // item being reviewed
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  useEffect(() => {
    api.get('/reviews/pending')
      .then((res) => {
        // Backend shape: { pending_reviews: [{ product_id, order_id, product_name, product_image, order_number, delivered_at }] }
        const data = res.data?.pending_reviews || [];
        setPending(Array.isArray(data) ? data : []);
        // Auto-open if navigated here from a notification with ?product_id=X
        const pid = searchParams.get('product_id');
        if (pid) {
          const match = data.find((item) => String(item.product_id) === String(pid));
          if (match) setActiveItem(match);
        }
      })
      .catch(() => setPending([]))
      .finally(() => setLoading(false));
  }, []);

  const openForm = (item) => {
    setActiveItem(item);
    setForm({ rating: 5, title: '', comment: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.comment.trim()) { setError('Please write a comment.'); return; }
    setSubmitting(true);
    setError('');
    const productId = activeItem.product_id;
    const orderId = activeItem.order_id;
    try {
      await submitProductReview(productId, {
        order_id: orderId,
        rating: form.rating,
        title: form.title,
        comment: form.comment,
      });
      setActiveItem(null);
      showToast('✅ Review submitted! It will appear after approval.');
      // Remove from list
      setPending((prev) => prev.filter(
        (item) => !(item.product_id === productId && item.order_id === orderId)
      ));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f0', fontFamily: 'Arial, sans-serif' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff',
          padding: '12px 24px', borderRadius: 8, fontSize: 14, zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>{toast}</div>
      )}

      <BuyerNav />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>
            ⭐ Pending Reviews
          </h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
            Share your experience with products you've received.
          </p>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading...</div>}

        {!loading && pending.length === 0 && (
          <div style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc',
            padding: '60px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 6 }}>
              All caught up!
            </div>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
              You have no pending reviews. Reviews are available after your order is delivered.
            </p>
            <button
              style={{
                padding: '10px 24px', background: '#1f4d1f', color: '#fff',
                border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
              onClick={() => navigate('/orders')}
            >
              View My Orders
            </button>
          </div>
        )}

        {!loading && pending.map((item) => {
          const productId = item.product_id;
          const img = item.product_image;
          const isActive = activeItem && activeItem.product_id === productId && activeItem.order_id === item.order_id;

          return (
            <div key={`${productId}-${item.order_id}`} style={{
              background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc',
              marginBottom: 14, overflow: 'hidden',
            }}>
              {/* Product row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 8, background: '#f5f5f5',
                  overflow: 'hidden', flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>
                  {img ? <img src={img} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 2 }}>
                    {item.product_name || 'Product'}
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    Order {item.order_number || `#${item.order_id}`}
                    {item.delivered_at && ` · Delivered ${new Date(item.delivered_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`}
                  </div>
                </div>
                <button
                  style={{
                    padding: '8px 18px', background: isActive ? '#f0f0f0' : '#1f4d1f',
                    color: isActive ? '#555' : '#fff', border: 'none', borderRadius: 7,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    flexShrink: 0,
                  }}
                  onClick={() => isActive ? setActiveItem(null) : openForm(item)}
                >
                  {isActive ? 'Cancel' : 'Review'}
                </button>
              </div>

              {/* Review form — expands inline */}
              {isActive && (
                <div style={{ borderTop: '1px solid #f0ece4', padding: '18px 18px 20px', background: '#f9f7f3' }}>
                  <form onSubmit={handleSubmit}>
                    {/* Star rating */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 8 }}>
                        Rating
                      </label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            style={{
                              fontSize: 28, background: 'none', border: 'none',
                              cursor: 'pointer', padding: 2, lineHeight: 1,
                              color: n <= form.rating ? '#f0c050' : '#ddd',
                            }}
                            onClick={() => setForm({ ...form, rating: n })}
                          >
                            ★
                          </button>
                        ))}
                        <span style={{ fontSize: 13, color: '#888', alignSelf: 'center', marginLeft: 4 }}>
                          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][form.rating]}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
                        Title <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span>
                      </label>
                      <input
                        style={{
                          width: '100%', padding: '10px 14px', border: '1.5px solid #ddd',
                          borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
                          boxSizing: 'border-box', outline: 'none',
                        }}
                        type="text"
                        placeholder="e.g. Great quality!"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        maxLength={100}
                      />
                    </div>

                    {/* Comment */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
                        Your Review *
                      </label>
                      <textarea
                        style={{
                          width: '100%', padding: '10px 14px', border: '1.5px solid #ddd',
                          borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
                          boxSizing: 'border-box', outline: 'none', resize: 'vertical',
                        }}
                        rows={4}
                        placeholder="Share your honest experience with this product…"
                        value={form.comment}
                        onChange={(e) => setForm({ ...form, comment: e.target.value })}
                        required
                      />
                    </div>

                    {error && (
                      <div style={{
                        background: '#fff0f0', color: '#cc0000', padding: '10px 14px',
                        borderRadius: 6, fontSize: 13, marginBottom: 12,
                        border: '1px solid #ffb3b3',
                      }}>⚠️ {error}</div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        style={{
                          padding: '10px 20px', background: '#f0f0f0', color: '#333',
                          border: 'none', borderRadius: 7, fontSize: 13,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                        onClick={() => setActiveItem(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{
                          padding: '10px 24px',
                          background: submitting ? '#ccc' : '#1f4d1f',
                          color: '#fff', border: 'none', borderRadius: 7,
                          fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit',
                        }}
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting…' : 'Submit Review →'}
                      </button>
                    </div>

                    <p style={{ fontSize: 11, color: '#aaa', marginTop: 10 }}>
                      Reviews are reviewed by our team before being published.
                    </p>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}