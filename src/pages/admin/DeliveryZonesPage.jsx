import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const LOGO_PATH = '/achoice logo.png';

export default function DeliveryZonesPage() {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(null);
  const [savedIds, setSavedIds] = useState([]);
  const [freeThreshold, setFreeThreshold] = useState('');
  const [defaultFee, setDefaultFee] = useState('');
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [editedZones, setEditedZones] = useState({});

  useEffect(() => {
    api.get('/delivery-zones')
      .then((res) => {
        const data = res.data;
        setZones(data.zones || []);
        setFreeThreshold(String(data.free_threshold || '50000'));
        setDefaultFee(String(data.default_fee || '1500'));
      })
      .catch(() => showToast('Failed to load delivery zones.'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleZoneChange = (id, field, value) => {
    setEditedZones(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
    setSavedIds(prev => prev.filter(sid => sid !== id));
  };

  const getZoneValue = (zone, field) => {
    if (editedZones[zone.id] && editedZones[zone.id][field] !== undefined) {
      return editedZones[zone.id][field];
    }
    return field === 'fee' ? zone.fee : zone.estimated_days;
  };

  const handleSaveZone = async (zone) => {
    setSaving(zone.id);
    try {
      const payload = {
        fee: Number(getZoneValue(zone, 'fee')),
        estimated_days: Number(getZoneValue(zone, 'estimated_days')),
      };
      await api.put(`/admin/delivery-zones/${zone.id}`, payload);
      setZones(zones.map(z =>
        z.id === zone.id
          ? { ...z, fee: payload.fee, estimated_days: payload.estimated_days }
          : z
      ));
      setSavedIds(prev => [...prev, zone.id]);
      showToast(`${zone.state} delivery zone updated successfully!`);
    } catch (err) {
      showToast('Failed to update zone. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveThreshold = async () => {
    setSavingThreshold(true);
    try {
      await api.post('/admin/settings', {
        settings: [
          { key: 'delivery_free_threshold', value: String(freeThreshold) }
        ]
      });
      showToast('Free delivery threshold updated successfully!');
    } catch (err) {
      showToast('Failed to update threshold. Please try again.');
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleSaveAll = async () => {
    const editedIds = Object.keys(editedZones);
    if (editedIds.length === 0) {
      showToast('No changes to save.');
      return;
    }
    setSaving('all');
    let successCount = 0;
    for (const id of editedIds) {
      const zone = zones.find(z => z.id === Number(id));
      if (!zone) continue;
      try {
        const payload = {
          fee: Number(editedZones[id].fee || zone.fee),
          estimated_days: Number(editedZones[id].estimated_days || zone.estimated_days),
        };
        await api.put(`/admin/delivery-zones/${id}`, payload);
        setZones(prev => prev.map(z =>
          z.id === Number(id) ? { ...z, ...payload } : z
        ));
        setSavedIds(prev => [...prev, Number(id)]);
        successCount++;
      } catch {}
    }
    setSaving(null);
    setEditedZones({});
    showToast(`${successCount} zone${successCount !== 1 ? 's' : ''} updated successfully!`);
  };

  const filtered = zones.filter(z =>
    z.state.toLowerCase().includes(search.toLowerCase())
  );

  const pendingChanges = Object.keys(editedZones).length;

  const stats = {
    total: zones.length,
    cheapest: zones.length ? Math.min(...zones.map(z => Number(z.fee))) : 0,
    mostExpensive: zones.length ? Math.max(...zones.map(z => Number(z.fee))) : 0,
  };

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <img src={LOGO_PATH} alt="Achoice" style={s.logoImg} />
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Admin Panel</div>
          </div>
        </div>
        <nav style={s.sidebarNav}>
          {[
            { icon: '📊', label: 'Dashboard', path: '/admin/dashboard' },
            { icon: '🏪', label: 'Sellers', path: '/admin/sellers' },
            { icon: '🌾', label: 'Products', path: '/admin/products' },
            { icon: '📦', label: 'Orders', path: '/admin/orders' },
            { icon: '💰', label: 'Loans', path: '/admin/loans' },
            { icon: '⚙️', label: 'Loan Settings', path: '/admin/loan-settings' },
            { icon: '🚚', label: 'Delivery Zones', path: '/admin/delivery-zones', active: true },
          ].map(item => (
            <div key={item.label}
              style={{ ...s.sidebarItem, ...(item.active ? s.sidebarItemActive : {}) }}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
        <div style={s.sidebarFooter}>
          <button style={s.logoutBtn} onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/admin');
          }}>Logout</button>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>Delivery Zone Settings</h1>
            <p style={s.headerSub}>Edit delivery fees and estimated days per state. Changes apply immediately to checkout.</p>
          </div>
          {pendingChanges > 0 && (
            <button
              style={saving === 'all' ? s.saveAllBtnDisabled : s.saveAllBtn}
              onClick={handleSaveAll}
              disabled={saving === 'all'}
            >
              {saving === 'all' ? 'Saving...' : `Save All Changes (${pendingChanges})`}
            </button>
          )}
        </div>

        {/* Stats */}
        <div style={s.statsGrid}>
          <div style={s.statCard}>
            <div style={s.statLabel}>Total Zones</div>
            <div style={s.statValue}>{stats.total}</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statLabel}>Cheapest Fee</div>
            <div style={{ ...s.statValue, color: '#1a7a3a' }}>₦{stats.cheapest.toLocaleString()}</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statLabel}>Most Expensive</div>
            <div style={{ ...s.statValue, color: '#cc0000' }}>₦{stats.mostExpensive.toLocaleString()}</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statLabel}>Free Delivery Above</div>
            <div style={{ ...s.statValue, color: '#1f4d1f' }}>₦{Number(freeThreshold).toLocaleString()}</div>
          </div>
        </div>

        {/* Free Threshold */}
        <div style={s.thresholdCard}>
          <div style={s.thresholdLeft}>
            <div style={s.thresholdTitle}>Free Delivery Threshold</div>
            <div style={s.thresholdSub}>
              Orders above this amount get free delivery. Currently: ₦{Number(freeThreshold).toLocaleString()}
            </div>
          </div>
          <div style={s.thresholdRight}>
            <div style={s.thresholdInputWrapper}>
              <span style={s.thresholdCurrency}>₦</span>
              <input
                style={s.thresholdInput}
                type="number"
                value={freeThreshold}
                onChange={e => setFreeThreshold(e.target.value)}
                placeholder="e.g. 50000"
              />
            </div>
            <button
              style={savingThreshold ? s.thresholdBtnDisabled : s.thresholdBtn}
              onClick={handleSaveThreshold}
              disabled={savingThreshold}
            >
              {savingThreshold ? 'Saving...' : 'Update Threshold'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={s.searchRow}>
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search state..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {pendingChanges > 0 && (
            <div style={s.pendingBadge}>
              {pendingChanges} unsaved change{pendingChanges !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {loading && <p style={s.message}>Loading delivery zones...</p>}

        {/* Zones Table */}
        {!loading && (
          <div style={s.tableCard}>
            <table style={s.table}>
              <thead>
                <tr style={s.tableHead}>
                  <th style={s.th}>State</th>
                  <th style={s.th}>Delivery Fee (₦)</th>
                  <th style={s.th}>Estimated Days</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(zone => {
                  const isEdited = editedZones[zone.id] !== undefined;
                  const isSaved = savedIds.includes(zone.id);
                  const isSaving = saving === zone.id;
                  const fee = getZoneValue(zone, 'fee');
                  const days = getZoneValue(zone, 'estimated_days');

                  return (
                    <tr key={zone.id} style={{
                      ...s.tableRow,
                      background: isEdited ? '#fffdf0' : '#fff',
                    }}>
                      <td style={s.td}>
                        <div style={s.stateName}>{zone.state}</div>
                      </td>
                      <td style={s.td}>
                        <div style={s.inputWrapper}>
                          <span style={s.currency}>₦</span>
                          <input
                            style={s.feeInput}
                            type="number"
                            value={fee}
                            onChange={e => handleZoneChange(zone.id, 'fee', e.target.value)}
                          />
                        </div>
                      </td>
                      <td style={s.td}>
                        <div style={s.daysWrapper}>
                          <input
                            style={s.daysInput}
                            type="number"
                            min="1"
                            max="14"
                            value={days}
                            onChange={e => handleZoneChange(zone.id, 'estimated_days', e.target.value)}
                          />
                          <span style={s.daysLabel}>days</span>
                        </div>
                      </td>
                      <td style={s.td}>
                        {isSaved && !isEdited ? (
                          <span style={s.savedBadge}>✓ Saved</span>
                        ) : isEdited ? (
                          <span style={s.pendingBadgeSmall}>Unsaved</span>
                        ) : (
                          <span style={s.unchangedBadge}>Unchanged</span>
                        )}
                      </td>
                      <td style={s.td}>
                        <button
                          style={isSaving ? s.saveBtnDisabled : isEdited ? s.saveBtn : s.saveBtnInactive}
                          onClick={() => handleSaveZone(zone)}
                          disabled={isSaving || !isEdited}
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={s.empty}>No zones found matching "{search}"</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif' },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999 },
  sidebar: { width: 240, background: '#1f4d1f', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: 10, padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoImg: { width: 40, height: 40, objectFit: 'contain' },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: '#fff' },
  sidebarLogoSub: { fontSize: 10, color: '#a8d5a8' },
  sidebarNav: { flex: 1, padding: '16px 0' },
  sidebarItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', color: '#a8d5a8', fontSize: 14, cursor: 'pointer' },
  sidebarItemActive: { background: 'rgba(255,255,255,0.15)', color: '#fff', borderLeft: '3px solid #f0c050' },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  logoutBtn: { width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  main: { flex: 1, marginLeft: 240, padding: '32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 4 },
  headerSub: { fontSize: 14, color: '#888' },
  saveAllBtn: { padding: '12px 24px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  saveAllBtnDisabled: { padding: '12px 24px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'not-allowed', fontFamily: 'inherit' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 },
  statCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 18 },
  statLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: 700, color: '#111' },
  thresholdCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 20, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 },
  thresholdLeft: {},
  thresholdTitle: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 },
  thresholdSub: { fontSize: 13, color: '#888' },
  thresholdRight: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  thresholdInputWrapper: { display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden', background: '#f9f9f9' },
  thresholdCurrency: { padding: '0 10px', color: '#888', fontSize: 14 },
  thresholdInput: { padding: '10px 12px', border: 'none', outline: 'none', fontSize: 14, width: 130, fontFamily: 'inherit', background: 'transparent' },
  thresholdBtn: { padding: '10px 20px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  thresholdBtnDisabled: { padding: '10px 20px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'not-allowed', fontFamily: 'inherit' },
  searchRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  searchInput: { width: '100%', maxWidth: 400, padding: '10px 16px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  pendingBadge: { background: '#fff8e7', color: '#b36b00', fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 99, border: '1px solid #f0c050' },
  message: { textAlign: 'center', color: '#666', padding: 40 },
  tableCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { background: '#f7f5f0' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { borderTop: '1px solid #f0f0f0', transition: 'background 0.1s' },
  td: { padding: '12px 16px', verticalAlign: 'middle' },
  stateName: { fontSize: 14, fontWeight: 600, color: '#111' },
  inputWrapper: { display: 'flex', alignItems: 'center', gap: 4 },
  currency: { fontSize: 13, color: '#888' },
  feeInput: { width: 100, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  daysWrapper: { display: 'flex', alignItems: 'center', gap: 6 },
  daysInput: { width: 60, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  daysLabel: { fontSize: 13, color: '#888' },
  savedBadge: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: '#eafaf0', color: '#1a7a3a' },
  pendingBadgeSmall: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: '#fff8e7', color: '#b36b00' },
  unchangedBadge: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: '#f0f0f0', color: '#888' },
  saveBtn: { padding: '7px 18px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  saveBtnInactive: { padding: '7px 18px', background: '#f0f0f0', color: '#aaa', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'not-allowed', fontFamily: 'inherit' },
  saveBtnDisabled: { padding: '7px 18px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'not-allowed', fontFamily: 'inherit' },
  empty: { padding: '40px 0', textAlign: 'center', color: '#888', fontSize: 14 },
};