import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const TARGET_ROLES = [
  { value: 'all',    label: 'Everyone (all users)' },
  { value: 'buyer',  label: 'Buyers only' },
  { value: 'seller', label: 'Sellers only' },
  { value: 'staff',  label: 'Staff only' },
];

const EMPTY_FORM = { title: '', message: '', target_role: 'all', action_url: '' };

export default function AdminBroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [sending, setSending]       = useState(false);
  const [formError, setFormError]   = useState('');
  const [toast, setToast]           = useState('');
  const [showForm, setShowForm]     = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const fetchBroadcasts = () => {
    setLoading(true);
    api.get('/admin/broadcasts')
      .then((res) => setBroadcasts(res.data?.data || res.data || []))
      .catch(() => setBroadcasts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBroadcasts(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setFormError('Title and message are required.');
      return;
    }
    setSending(true);
    setFormError('');
    try {
      const payload = {
        title: form.title,
        message: form.message,
        target_role: form.target_role,
        ...(form.action_url.trim() && { action_url: form.action_url.trim() }),
      };
      await api.post('/admin/broadcasts', payload);
      showToast(`✅ Broadcast sent to ${TARGET_ROLES.find(r => r.value === form.target_role)?.label}`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchBroadcasts();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to send broadcast.');
    } finally {
      setSending(false);
    }
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) : '';

  const roleColor = (role) => ({
    all:    { bg: '#e3f2fd', color: '#1565c0' },
    buyer:  { bg: '#e8f5e9', color: '#2e7d32' },
    seller: { bg: '#fff8e7', color: '#f57c00' },
    staff:  { bg: '#f3e5f5', color: '#7b1fa2' },
  }[role] || { bg: '#f5f5f5', color: '#555' });

  return (
    <AdminLayout>
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.container}>
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>📢 Broadcasts</h1>
            <p style={s.pageSub}>Send announcements to users — delivers to each matching user's inbox instantly.</p>
          </div>
          <button style={s.newBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Broadcast'}
          </button>
        </div>

        {/* Compose form */}
        {showForm && (
          <div style={s.formCard}>
            <h2 style={s.formTitle}>Compose Broadcast</h2>
            <form onSubmit={handleSend}>
              <div style={s.field}>
                <label style={s.label}>Title *</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="e.g. New Feature: Address Book is Live"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  maxLength={120}
                />
                <div style={s.charCount}>{form.title.length}/120</div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Message *</label>
                <textarea
                  style={s.textarea}
                  rows={4}
                  placeholder="Write the announcement message..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  maxLength={1000}
                />
                <div style={s.charCount}>{form.message.length}/1000</div>
              </div>

              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.label}>Send to</label>
                  <select
                    style={s.input}
                    value={form.target_role}
                    onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                  >
                    {TARGET_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>
                    Action URL <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="e.g. /products or /loans/apply"
                    value={form.action_url}
                    onChange={(e) => setForm({ ...form, action_url: e.target.value })}
                  />
                </div>
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
                <button
                  type="submit"
                  style={sending ? s.sendBtnDisabled : s.sendBtn}
                  disabled={sending}
                >
                  {sending ? 'Sending...' : '📢 Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Broadcast history */}
        <div style={s.sectionTitle}>Sent Broadcasts</div>

        {loading ? (
          <div style={s.center}>Loading...</div>
        ) : broadcasts.length === 0 ? (
          <div style={s.empty}>No broadcasts sent yet.</div>
        ) : (
          <div style={s.list}>
            {broadcasts.map((b) => {
              const rc = roleColor(b.target_role);
              return (
                <div key={b.id} style={s.broadcastCard}>
                  <div style={s.cardTop}>
                    <div style={s.cardTitle}>{b.title}</div>
                    <span style={{ ...s.roleBadge, background: rc.bg, color: rc.color }}>
                      {TARGET_ROLES.find(r => r.value === b.target_role)?.label || b.target_role}
                    </span>
                  </div>
                  <div style={s.cardMessage}>{b.message}</div>
                  <div style={s.cardMeta}>
                    <span>👥 {b.recipient_count ?? '—'} recipients</span>
                    <span>🕐 {fmtDate(b.created_at)}</span>
                    {b.action_url && (
                      <span style={{ color: '#1565c0' }}>🔗 {b.action_url}</span>
                    )}
                  </div>
                </div>
              );
            })}
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
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
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
  broadcastCard: {
    background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: '18px 20px',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#111' },
  roleBadge: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 },
  cardMessage: { fontSize: 13, color: '#555', marginBottom: 10, lineHeight: 1.6 },
  cardMeta: { display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#888' },
};