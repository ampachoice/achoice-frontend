import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const EMPTY_FORM = { subject: '', body: '' };

export default function AdminNewsletterPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [subscriberCount, setSubscriberCount] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [sending, setSending]     = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const fetchCampaigns = () => {
    setLoading(true);
    api.get('/admin/newsletter/campaigns')
      .then((res) => {
        setCampaigns(res.data?.data || res.data?.campaigns || res.data || []);
        setSubscriberCount(res.data?.active_subscriber_count ?? null);
      })
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleReviewSend = (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) {
      setFormError('Subject and body are required.');
      return;
    }
    setFormError('');
    setConfirmSend(true);
  };

  const handleConfirmedSend = async () => {
    setSending(true);
    setFormError('');
    try {
      const res = await api.post('/admin/newsletter/send', {
        subject: form.subject,
        body: form.body,
      });
      showToast(`✅ Newsletter sent to ${res.data?.recipient_count ?? subscriberCount ?? 'all'} subscribers`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setConfirmSend(false);
      fetchCampaigns();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to send newsletter.');
      setConfirmSend(false);
    } finally {
      setSending(false);
    }
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) : '';

  return (
    <AdminLayout>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Confirm-send modal — sending to potentially hundreds of real
          inboxes should never be a single accidental click */}
      {confirmSend && (
        <div style={s.modalOverlay} onClick={() => !sending && setConfirmSend(false)}>
          <div style={s.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Send this newsletter?</h3>
            <p style={s.modalText}>
              This will email <strong>{subscriberCount ?? 'all active'}</strong> subscriber
              {subscriberCount === 1 ? '' : 's'} right now. This cannot be undone or recalled.
            </p>
            <div style={s.modalPreview}>
              <div style={s.modalPreviewSubject}>{form.subject}</div>
              <div style={s.modalPreviewBody}>{form.body}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                type="button"
                style={s.cancelBtn}
                onClick={() => setConfirmSend(false)}
                disabled={sending}
              >
                Go back
              </button>
              <button
                type="button"
                style={sending ? s.sendBtnDisabled : s.sendBtn}
                onClick={handleConfirmedSend}
                disabled={sending}
              >
                {sending ? 'Sending...' : `📧 Yes, send to ${subscriberCount ?? 'all'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={s.container}>
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>📧 Newsletter</h1>
            <p style={s.pageSub}>
              Email every active subscriber at once.
              {subscriberCount !== null && (
                <> Currently <strong>{subscriberCount}</strong> active subscriber{subscriberCount === 1 ? '' : 's'}.</>
              )}
            </p>
          </div>
          <button style={s.newBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Newsletter'}
          </button>
        </div>

        {/* Compose form */}
        {showForm && (
          <div style={s.formCard}>
            <h2 style={s.formTitle}>Compose Newsletter</h2>
            <form onSubmit={handleReviewSend}>
              <div style={s.field}>
                <label style={s.label}>Subject *</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="e.g. This Week's Fresh Deals on ACHOICE"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                  maxLength={150}
                />
                <div style={s.charCount}>{form.subject.length}/150</div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Body *</label>
                <textarea
                  style={s.textarea}
                  rows={8}
                  placeholder="Write the newsletter content..."
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  required
                  maxLength={5000}
                />
                <div style={s.charCount}>{form.body.length}/5000</div>
              </div>

              {formError && <div style={s.formError}>⚠️ {formError}</div>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="button"
                  style={s.cancelBtn}
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(''); }}
                >
                  Cancel
                </button>
                <button type="submit" style={s.sendBtn}>
                  Review &amp; Send →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Campaign history */}
        <div style={s.sectionTitle}>Sent Newsletters</div>

        {loading ? (
          <div style={s.center}>Loading...</div>
        ) : campaigns.length === 0 ? (
          <div style={s.empty}>No newsletters sent yet.</div>
        ) : (
          <div style={s.list}>
            {campaigns.map((c) => (
              <div key={c.id} style={s.campaignCard}>
                <div style={s.cardTop}>
                  <div style={s.cardTitle}>{c.subject}</div>
                  <span style={s.recipientBadge}>
                    {c.recipient_count ?? '—'} recipients
                  </span>
                </div>
                <div style={s.cardMessage}>{c.body}</div>
                <div style={s.cardMeta}>
                  <span>🕐 {fmtDate(c.sent_at || c.created_at)}</span>
                  {c.sent_by_name && <span>👤 Sent by {c.sent_by_name}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

const s = {
  toast: {
    position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff',
    padding: '12px 24px', borderRadius: 8, fontSize: 14, zIndex: 9999,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  container: { maxWidth: 900, margin: '0 auto', padding: '32px 20px' },
  pageHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 28, flexWrap: 'wrap', gap: 12,
  },
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#111', margin: '0 0 4px' },
  pageSub: { fontSize: 13, color: '#888', margin: 0 },
  newBtn: {
    padding: '10px 20px', background: '#1f4d1f', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  formCard: {
    background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc',
    padding: '24px', marginBottom: 28,
  },
  formTitle: { fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 },
  input: {
    width: '100%', padding: '11px 14px', border: '1.5px solid #ddd', borderRadius: 8,
    fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
  },
  textarea: {
    width: '100%', padding: '11px 14px', border: '1.5px solid #ddd', borderRadius: 8,
    fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'vertical',
  },
  charCount: { fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 4 },
  formError: {
    background: '#fff0f0', color: '#cc0000', padding: '10px 14px',
    borderRadius: 6, fontSize: 13, marginBottom: 12, border: '1px solid #ffb3b3',
  },
  cancelBtn: {
    padding: '10px 20px', background: '#f0f0f0', color: '#333', border: 'none',
    borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  sendBtn: {
    padding: '10px 20px', background: '#1f4d1f', color: '#fff', border: 'none',
    borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  sendBtnDisabled: {
    padding: '10px 20px', background: '#aaa', color: '#fff', border: 'none',
    borderRadius: 7, fontSize: 13, cursor: 'not-allowed', fontFamily: 'inherit',
  },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 14 },
  center: { textAlign: 'center', padding: '40px', color: '#888' },
  empty: { textAlign: 'center', padding: '40px', color: '#aaa', fontSize: 14 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  campaignCard: {
    background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: '18px 20px',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#111' },
  recipientBadge: {
    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
    background: '#e3f2fd', color: '#1565c0', whiteSpace: 'nowrap',
  },
  cardMessage: {
    fontSize: 13, color: '#555', marginBottom: 10, lineHeight: 1.6,
    whiteSpace: 'pre-wrap', maxHeight: 100, overflow: 'hidden',
  },
  cardMeta: { display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#888' },

  // Confirm-send modal
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modalCard: {
    background: '#fff', borderRadius: 12, padding: 28, maxWidth: 480, width: '100%',
    boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 10px' },
  modalText: { fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 16 },
  modalPreview: {
    background: '#f7f5f0', borderRadius: 8, padding: '14px 16px',
    border: '1px solid #e8e4dc', maxHeight: 160, overflowY: 'auto',
  },
  modalPreviewSubject: { fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 6 },
  modalPreviewBody: { fontSize: 12.5, color: '#555', whiteSpace: 'pre-wrap', lineHeight: 1.6 },
};