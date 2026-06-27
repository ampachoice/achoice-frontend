import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const LOGO_PATH = '/achoice logo.png';

const DEFAULT_TIERS = [
  { key: 'micro',   label: 'Micro',   min: 0,       max: 50000,   monthly_rate: 5.0 },
  { key: 'small',   label: 'Small',   min: 50001,   max: 200000,  monthly_rate: 4.0 },
  { key: 'medium',  label: 'Medium',  min: 200001,  max: 500000,  monthly_rate: 3.0 },
  { key: 'large',   label: 'Large',   min: 500001,  max: 1000000, monthly_rate: 2.5 },
  { key: 'premium', label: 'Premium', min: 1000001, max: null,    monthly_rate: 2.0 },
];

const DEFAULT_DURATIONS = [
  { months: 1,  label: '1 Month',   rate_adjustment: 0.5  },
  { months: 3,  label: '3 Months',  rate_adjustment: 0.25 },
  { months: 6,  label: '6 Months',  rate_adjustment: 0    },
  { months: 9,  label: '9 Months',  rate_adjustment: -0.25 },
  { months: 12, label: '12 Months', rate_adjustment: -0.5  },
  { months: 18, label: '18 Months', rate_adjustment: -0.75 },
  { months: 24, label: '24 Months', rate_adjustment: -1.0  },
];

export default function LoanSettingsPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState('tiers');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General settings
  const [general, setGeneral] = useState({
    min_loan_amount: 5000,
    max_loan_amount: 5000000,
    default_interest: 4,
    min_duration: 1,
    max_duration: 24,
    processing_fee: 0,
    late_payment_penalty: 5,
    grace_period_days: 3,
    loyalty_discount_enabled: true,
    auto_approve_enabled: false,
    require_documents: true,
  });

  // Tier rates
  const [tiers, setTiers] = useState(DEFAULT_TIERS);

  // Duration-based rates
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);

  // Duration-month rate overrides: { "3": 5.5, "6": 4.0, ... }
  const [monthRates, setMonthRates] = useState({});

  // Loyalty discounts
  const [loyaltyRules, setLoyaltyRules] = useState([
    { condition: 'no_default', discount: 0.25, label: 'No default history' },
    { condition: 'completed_loan', discount: 0.5, label: 'Completed 1+ loan' },
    { condition: 'completed_3_loans', discount: 0.75, label: 'Completed 3+ loans' },
    { condition: 'completed_5_loans', discount: 1.0, label: 'Completed 5+ loans' },
  ]);

  // Live calculator preview
  const [calcAmount, setCalcAmount] = useState(100000);
  const [calcDuration, setCalcDuration] = useState(6);
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      api.get('/settings/loan'),
      api.get('/settings/loan-tiers'),
    ]).then(([settingsRes, tiersRes]) => {
      if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
        const d = settingsRes.value.data;
        setGeneral(prev => ({ ...prev, ...d }));
        if (d.durations?.length > 0) setDurations(d.durations);
        if (d.month_rates) setMonthRates(d.month_rates);
        if (d.loyalty_rules?.length > 0) setLoyaltyRules(d.loyalty_rules);
      }
      if (tiersRes.status === 'fulfilled' && tiersRes.value.data?.tiers?.length > 0) {
        setTiers(tiersRes.value.data.tiers);
      }
    }).finally(() => setLoading(false));
  }, []);

  // Live calculator
  useEffect(() => {
    if (calcAmount < 5000 || !calcDuration) return;
    setCalcLoading(true);
    api.get('/loans/calculate', { params: { amount: calcAmount, duration_months: calcDuration } })
      .then(r => setCalcResult(r.data))
      .catch(() => setCalcResult(null))
      .finally(() => setCalcLoading(false));
  }, [calcAmount, calcDuration]);

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      await api.post('/admin/settings/loan', {
        ...general,
        durations,
        month_rates: monthRates,
        loyalty_rules: loyaltyRules,
      });
      showToast('✅ General settings saved!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save settings.');
    } finally { setSaving(false); }
  };

  const handleSaveTiers = async () => {
    setSaving(true);
    try {
      await api.post('/admin/settings/loan-tiers', { tiers });
      showToast('✅ Interest tier rates saved!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save tiers.');
    } finally { setSaving(false); }
  };

  const updateTier = (idx, field, value) => {
    setTiers(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const updateDuration = (idx, field, value) => {
    setDurations(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const addDuration = () => {
    setDurations(prev => [...prev, { months: '', label: '', rate_adjustment: 0 }]);
  };

  const removeDuration = (idx) => {
    setDurations(prev => prev.filter((_, i) => i !== idx));
  };

  const updateLoyaltyRule = (idx, field, value) => {
    setLoyaltyRules(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const toMoney = (val) => `₦${Number(val || 0).toLocaleString()}`;

  const sidebarItems = [
    { icon: '📊', label: 'Dashboard', path: '/admin/dashboard' },
    { icon: '🏪', label: 'Sellers', path: '/admin/sellers' },
    { icon: '🌾', label: 'Products', path: '/admin/products' },
    { icon: '📦', label: 'Orders', path: '/admin/orders' },
    { icon: '💰', label: 'Loans', path: '/admin/loans' },
    { icon: '⚙️', label: 'Loan Settings', path: '/admin/loan-settings', active: true },
    { icon: '🚚', label: 'Delivery Zones', path: '/admin/delivery-zones' },
    { icon: '👥', label: 'Staff', path: '/admin/staff' },
    { icon: '📈', label: 'Reports', path: '/admin/reports' },
  ];

  if (loading) return <div style={s.loader}>Loading Loan Settings...</div>;

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
          {sidebarItems.map(item => (
            <div key={item.label}
              style={{ ...s.sidebarItem, ...(item.active ? s.sidebarItemActive : {}) }}
              onClick={() => navigate(item.path)}>
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
        <div style={s.sidebarFooter}>
          <button style={s.logoutBtn} onClick={() => { localStorage.clear(); navigate('/admin'); }}>Logout</button>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>Loan Settings</h1>
            <p style={s.headerSub}>Configure interest rates, tiers, durations and loyalty discounts</p>
          </div>
        </div>

        {/* Tab Nav */}
        <div style={s.tabNav}>
          {[
            { key: 'tiers',    label: '📊 Interest Tiers' },
            { key: 'duration', label: '📅 Duration Rates' },
            { key: 'general',  label: '⚙️ General Settings' },
            { key: 'loyalty',  label: '🎖️ Loyalty Discounts' },
            { key: 'calc',     label: '🧮 Live Calculator' },
          ].map(tab => (
            <button key={tab.key}
              style={activeTab === tab.key ? s.tabActive : s.tab}
              onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════ INTEREST TIERS ════ */}
        {activeTab === 'tiers' && (
          <div style={s.card}>
            <div style={s.cardTitle}>📊 Interest Rate Tiers</div>
            <p style={s.cardDesc}>
              Monthly interest rates based on loan amount. Larger loans get lower rates.
              Admin can adjust any tier rate below.
            </p>

            <div style={s.tiersGrid}>
              {tiers.map((tier, idx) => (
                <div key={tier.key} style={s.tierCard}>
                  <div style={s.tierHeader}>
                    <div style={s.tierLabel}>{tier.label}</div>
                    <div style={s.tierRange}>
                      {tier.max
                        ? `${toMoney(tier.min)} – ${toMoney(tier.max)}`
                        : `Above ${toMoney(tier.min)}`}
                    </div>
                  </div>
                  <div style={s.tierRateRow}>
                    <label style={s.label}>Monthly Rate (%)</label>
                    <div style={s.tierRateInput}>
                      <input
                        style={s.rateInput}
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        value={tier.monthly_rate}
                        onChange={e => updateTier(idx, 'monthly_rate', Number(e.target.value))}
                      />
                      <span style={s.rateUnit}>% / month</span>
                    </div>
                    <div style={s.tierAnnual}>
                      ≈ {(tier.monthly_rate * 12).toFixed(1)}% per year
                    </div>
                  </div>
                  <div style={s.tierRateRow}>
                    <label style={s.label}>Min Amount (₦)</label>
                    <input
                      style={s.input}
                      type="number"
                      value={tier.min}
                      onChange={e => updateTier(idx, 'min', Number(e.target.value))}
                    />
                  </div>
                  <div style={s.tierRateRow}>
                    <label style={s.label}>Max Amount (₦) — leave blank for unlimited</label>
                    <input
                      style={s.input}
                      type="number"
                      value={tier.max || ''}
                      placeholder="Unlimited"
                      onChange={e => updateTier(idx, 'max', e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Tier summary table */}
            <div style={s.tierTable}>
              <div style={s.tierTableHead}>
                <span>Tier</span><span>Amount Range</span><span>Monthly Rate</span><span>Annual Rate</span>
              </div>
              {tiers.map(tier => (
                <div key={tier.key} style={s.tierTableRow}>
                  <span style={{ fontWeight: 600 }}>{tier.label}</span>
                  <span style={{ color: '#555' }}>
                    {tier.max ? `${toMoney(tier.min)} – ${toMoney(tier.max)}` : `Above ${toMoney(tier.min)}`}
                  </span>
                  <span style={{ color: '#1f4d1f', fontWeight: 700 }}>{tier.monthly_rate}%</span>
                  <span style={{ color: '#888' }}>{(tier.monthly_rate * 12).toFixed(1)}%</span>
                </div>
              ))}
            </div>

            <button style={saving ? s.saveBtnDisabled : s.saveBtn} onClick={handleSaveTiers} disabled={saving}>
              {saving ? '⏳ Saving...' : '💾 Save Tier Rates'}
            </button>
          </div>
        )}

        {/* ════ DURATION RATES ════ */}
        {activeTab === 'duration' && (
          <div style={s.card}>
            <div style={s.cardTitle}>📅 Duration-Based Rate Adjustments</div>
            <p style={s.cardDesc}>
              Adjust the base tier rate up or down based on loan duration.
              Shorter loans get a premium, longer loans get a discount.
              Set a specific flat monthly rate per duration, or use adjustments relative to the tier rate.
            </p>

            {/* Month-specific flat rates */}
            <div style={s.sectionDivider}>Option A — Set Flat Monthly Rate Per Duration</div>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
              If set, this overrides the tier rate for that specific duration. Leave blank to use tier rate + adjustment.
            </p>
            <div style={s.durationGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 24].map(m => (
                <div key={m} style={s.monthRateCard}>
                  <div style={s.monthRateLabel}>{m} Month{m > 1 ? 's' : ''}</div>
                  <div style={s.monthRateInputRow}>
                    <input
                      style={s.monthRateInput}
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      placeholder="—"
                      value={monthRates[m] || ''}
                      onChange={e => setMonthRates(prev => ({
                        ...prev,
                        [m]: e.target.value ? Number(e.target.value) : undefined,
                      }))}
                    />
                    <span style={s.monthRateUnit}>%</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={s.sectionDivider}>Option B — Duration Adjustment Presets</div>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
              These are the duration options shown to buyers on the loan application. Rate adjustment is added to the tier base rate.
            </p>

            <div style={s.durationList}>
              {durations.map((dur, idx) => (
                <div key={idx} style={s.durationRow}>
                  <div style={s.durationField}>
                    <label style={s.label}>Months</label>
                    <input style={s.inputSm} type="number" value={dur.months}
                      onChange={e => updateDuration(idx, 'months', Number(e.target.value))} />
                  </div>
                  <div style={{ ...s.durationField, flex: 2 }}>
                    <label style={s.label}>Label shown to buyer</label>
                    <input style={s.input} type="text" value={dur.label}
                      onChange={e => updateDuration(idx, 'label', e.target.value)} />
                  </div>
                  <div style={s.durationField}>
                    <label style={s.label}>Rate Adjustment (%)</label>
                    <input style={s.inputSm} type="number" step="0.25" value={dur.rate_adjustment}
                      onChange={e => updateDuration(idx, 'rate_adjustment', Number(e.target.value))} />
                  </div>
                  <button style={s.removeBtn} onClick={() => removeDuration(idx)}>✕</button>
                </div>
              ))}
            </div>
            <button style={s.addRowBtn} onClick={addDuration}>+ Add Duration Option</button>

            <button style={{ ...saving ? s.saveBtnDisabled : s.saveBtn, marginTop: 24 }}
              onClick={handleSaveGeneral} disabled={saving}>
              {saving ? '⏳ Saving...' : '💾 Save Duration Settings'}
            </button>
          </div>
        )}

        {/* ════ GENERAL SETTINGS ════ */}
        {activeTab === 'general' && (
          <div style={s.card}>
            <div style={s.cardTitle}>⚙️ General Loan Settings</div>

            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Minimum Loan Amount (₦)</label>
                <input style={s.input} type="number"
                  value={general.min_loan_amount}
                  onChange={e => setGeneral(p => ({ ...p, min_loan_amount: Number(e.target.value) }))} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Maximum Loan Amount (₦)</label>
                <input style={s.input} type="number"
                  value={general.max_loan_amount}
                  onChange={e => setGeneral(p => ({ ...p, max_loan_amount: Number(e.target.value) }))} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Default Interest Rate (%) — fallback if no tier matches</label>
                <input style={s.input} type="number" step="0.1"
                  value={general.default_interest}
                  onChange={e => setGeneral(p => ({ ...p, default_interest: Number(e.target.value) }))} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Processing Fee (%)</label>
                <input style={s.input} type="number" step="0.1"
                  value={general.processing_fee}
                  onChange={e => setGeneral(p => ({ ...p, processing_fee: Number(e.target.value) }))} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Late Payment Penalty (%)</label>
                <input style={s.input} type="number" step="0.1"
                  value={general.late_payment_penalty}
                  onChange={e => setGeneral(p => ({ ...p, late_payment_penalty: Number(e.target.value) }))} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Grace Period (days before penalty applies)</label>
                <input style={s.input} type="number"
                  value={general.grace_period_days}
                  onChange={e => setGeneral(p => ({ ...p, grace_period_days: Number(e.target.value) }))} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Minimum Duration (months)</label>
                <input style={s.input} type="number"
                  value={general.min_duration}
                  onChange={e => setGeneral(p => ({ ...p, min_duration: Number(e.target.value) }))} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Maximum Duration (months)</label>
                <input style={s.input} type="number"
                  value={general.max_duration}
                  onChange={e => setGeneral(p => ({ ...p, max_duration: Number(e.target.value) }))} />
              </div>
            </div>

            <div style={s.sectionDivider}>Feature Toggles</div>
            <div style={s.toggleGrid}>
              {[
                { key: 'loyalty_discount_enabled', label: '🎖️ Loyalty Discounts', desc: 'Apply rate discounts for repeat borrowers' },
                { key: 'auto_approve_enabled',     label: '⚡ Auto-Approve',        desc: 'Auto-approve loans under minimum amount' },
                { key: 'require_documents',        label: '📎 Require Documents',   desc: 'Block approval if no documents uploaded' },
              ].map(toggle => (
                <div key={toggle.key} style={s.toggleCard}>
                  <div style={s.toggleInfo}>
                    <div style={s.toggleLabel}>{toggle.label}</div>
                    <div style={s.toggleDesc}>{toggle.desc}</div>
                  </div>
                  <button
                    style={general[toggle.key] ? s.toggleOn : s.toggleOff}
                    onClick={() => setGeneral(p => ({ ...p, [toggle.key]: !p[toggle.key] }))}>
                    {general[toggle.key] ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>

            <button style={saving ? s.saveBtnDisabled : s.saveBtn} onClick={handleSaveGeneral} disabled={saving}>
              {saving ? '⏳ Saving...' : '💾 Save General Settings'}
            </button>
          </div>
        )}

        {/* ════ LOYALTY DISCOUNTS ════ */}
        {activeTab === 'loyalty' && (
          <div style={s.card}>
            <div style={s.cardTitle}>🎖️ Loyalty Discount Rules</div>
            <p style={s.cardDesc}>
              Buyers automatically qualify for rate discounts based on their history.
              Discounts stack and are subtracted from the base tier rate.
            </p>

            <div style={s.loyaltyList}>
              {loyaltyRules.map((rule, idx) => (
                <div key={idx} style={s.loyaltyRow}>
                  <div style={s.loyaltyIcon}>🎖️</div>
                  <div style={{ flex: 2 }}>
                    <label style={s.label}>Condition Label</label>
                    <input style={s.input} type="text" value={rule.label}
                      onChange={e => updateLoyaltyRule(idx, 'label', e.target.value)} />
                  </div>
                  <div style={s.loyaltyDiscountField}>
                    <label style={s.label}>Discount (%)</label>
                    <div style={s.tierRateInputRow}>
                      <input style={s.inputSm} type="number" step="0.05" min="0" max="5"
                        value={rule.discount}
                        onChange={e => updateLoyaltyRule(idx, 'discount', Number(e.target.value))} />
                      <span style={s.rateUnit}>%</span>
                    </div>
                  </div>
                  <div style={s.loyaltyDiscountBadge}>-{rule.discount}%</div>
                </div>
              ))}
            </div>

            <div style={s.infoBox}>
              💡 <strong>Example:</strong> A buyer with no defaults and 1 completed loan gets
              <strong> -0.25% + -0.5% = -0.75%</strong> off their base rate.
              On a Small tier loan (4.0%), they'd pay <strong>3.25%/month</strong>.
            </div>

            <button style={saving ? s.saveBtnDisabled : s.saveBtn} onClick={handleSaveGeneral} disabled={saving}>
              {saving ? '⏳ Saving...' : '💾 Save Loyalty Rules'}
            </button>
          </div>
        )}

        {/* ════ LIVE CALCULATOR ════ */}
        {activeTab === 'calc' && (
          <div style={s.card}>
            <div style={s.cardTitle}>🧮 Live Loan Calculator</div>
            <p style={s.cardDesc}>
              Test the current rate settings. This uses the same live API endpoint that buyers see.
            </p>

            <div style={s.calcInputRow}>
              <div style={s.field}>
                <label style={s.label}>Loan Amount (₦)</label>
                <input style={s.input} type="number" step="1000" min="5000"
                  value={calcAmount}
                  onChange={e => setCalcAmount(Number(e.target.value))} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Duration (months)</label>
                <select style={s.input} value={calcDuration}
                  onChange={e => setCalcDuration(Number(e.target.value))}>
                  {durations.map(d => (
                    <option key={d.months} value={d.months}>{d.label || `${d.months} months`}</option>
                  ))}
                </select>
              </div>
            </div>

            {calcLoading && <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>Calculating...</p>}

            {calcResult && !calcLoading && (
              <div>
                {/* Tier badge */}
                <div style={s.calcTierBadge}>
                  <span style={s.calcTierLabel}>Tier: {calcResult.breakdown?.tier}</span>
                  {calcResult.breakdown?.loyalty_discount > 0 && (
                    <span style={s.calcLoyaltyBadge}>
                      🎖️ Loyalty Discount: -{calcResult.breakdown.loyalty_discount}% applied
                    </span>
                  )}
                </div>

                {/* Rate breakdown */}
                <div style={s.calcRateRow}>
                  <div style={s.calcRateBox}>
                    <div style={s.calcRateLabel}>Base Monthly Rate</div>
                    <div style={s.calcRateValue}>{calcResult.breakdown?.base_rate}%</div>
                  </div>
                  {calcResult.breakdown?.loyalty_discount > 0 && (
                    <div style={{ ...s.calcRateBox, background: '#eafaf0', border: '1px solid #a8d5a8' }}>
                      <div style={s.calcRateLabel}>Loyalty Discount</div>
                      <div style={{ ...s.calcRateValue, color: '#1a7a3a' }}>-{calcResult.breakdown.loyalty_discount}%</div>
                    </div>
                  )}
                  <div style={{ ...s.calcRateBox, background: '#1f4d1f', border: 'none' }}>
                    <div style={{ ...s.calcRateLabel, color: '#a8d5a8' }}>Final Monthly Rate</div>
                    <div style={{ ...s.calcRateValue, color: '#f0c050' }}>{calcResult.breakdown?.final_monthly_rate}%</div>
                  </div>
                  <div style={s.calcRateBox}>
                    <div style={s.calcRateLabel}>Effective Annual</div>
                    <div style={s.calcRateValue}>{calcResult.breakdown?.effective_annual_rate}%</div>
                  </div>
                </div>

                {/* Summary table */}
                <div style={s.calcSummaryTable}>
                  {calcResult.summary && Object.entries(calcResult.summary).map(([label, value]) => (
                    <div key={label} style={s.calcSummaryRow}>
                      <span style={s.calcSummaryLabel}>{label}</span>
                      <span style={s.calcSummaryValue}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Loyalty reasons */}
                {calcResult.breakdown?.loyalty_reasons?.length > 0 && (
                  <div style={s.loyaltyReasons}>
                    <div style={s.loyaltyReasonsTitle}>✅ Loyalty discounts applied:</div>
                    {calcResult.breakdown.loyalty_reasons.map((r, i) => (
                      <div key={i} style={s.loyaltyReasonItem}>• {r}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={s.infoBox}>
              💡 This is what buyers see on the loan application page. The final rate depends on the loan amount tier
              plus any loyalty discounts the buyer has earned.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif' },
  loader: { textAlign: 'center', padding: 100, fontSize: 18, color: '#1f4d1f', fontWeight: 600 },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  sidebar: { width: 240, background: '#1f4d1f', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: 10, padding: 20, borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoImg: { width: 40, height: 40, objectFit: 'contain' },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: '#fff' },
  sidebarLogoSub: { fontSize: 10, color: '#a8d5a8' },
  sidebarNav: { flex: 1, padding: '16px 0', overflowY: 'auto' },
  sidebarItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', color: '#a8d5a8', fontSize: 14, cursor: 'pointer' },
  sidebarItemActive: { background: 'rgba(255,255,255,0.15)', color: '#fff', borderLeft: '3px solid #f0c050' },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  logoutBtn: { width: '100%', padding: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  main: { flex: 1, marginLeft: 240, padding: 32, minWidth: 0 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 4 },
  headerSub: { fontSize: 14, color: '#888' },
  tabNav: { display: 'flex', gap: 4, marginBottom: 24, background: '#fff', padding: 6, borderRadius: 10, border: '1px solid #e8e4dc', flexWrap: 'wrap' },
  tab: { flex: 1, padding: '10px 14px', border: 'none', borderRadius: 7, background: 'transparent', color: '#555', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', minWidth: 120, whiteSpace: 'nowrap' },
  tabActive: { flex: 1, padding: '10px 14px', border: 'none', borderRadius: 7, background: '#1f4d1f', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minWidth: 120, whiteSpace: 'nowrap' },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc', padding: 28 },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 1.6 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 24 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: '#444' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 7, fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  inputSm: { padding: '9px 10px', border: '1px solid #ddd', borderRadius: 7, fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 80 },
  saveBtn: { padding: '12px 28px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  saveBtnDisabled: { padding: '12px 28px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'not-allowed', fontFamily: 'inherit' },
  infoBox: { marginTop: 20, background: '#f0f7ec', border: '1px solid #a8d5a8', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#555', lineHeight: 1.6 },
  sectionDivider: { fontSize: 12, fontWeight: 700, color: '#1f4d1f', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #eee', marginTop: 28 },

  // Tiers
  tiersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 24 },
  tierCard: { background: '#f7f5f0', borderRadius: 10, border: '1px solid #e8e4dc', padding: 18 },
  tierHeader: { marginBottom: 14 },
  tierLabel: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 },
  tierRange: { fontSize: 12, color: '#888' },
  tierRateRow: { marginBottom: 12 },
  tierRateInput: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 },
  tierRateInputRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 },
  rateInput: { padding: '10px 12px', border: '2px solid #1f4d1f', borderRadius: 7, fontSize: 18, fontWeight: 700, color: '#1f4d1f', fontFamily: 'inherit', outline: 'none', width: 90 },
  rateUnit: { fontSize: 13, color: '#888' },
  tierAnnual: { fontSize: 11, color: '#888', marginTop: 4 },
  tierTable: { background: '#f7f5f0', borderRadius: 8, overflow: 'hidden', marginBottom: 24, border: '1px solid #e8e4dc' },
  tierTableHead: { display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', padding: '10px 16px', background: '#1f4d1f', fontSize: 11, fontWeight: 700, color: '#a8d5a8', textTransform: 'uppercase', letterSpacing: 0.5 },
  tierTableRow: { display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', padding: '12px 16px', borderTop: '1px solid #e8e4dc', fontSize: 13 },

  // Duration
  durationGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10, marginBottom: 24 },
  monthRateCard: { background: '#f7f5f0', borderRadius: 8, padding: 12, border: '1px solid #e8e4dc', textAlign: 'center' },
  monthRateLabel: { fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8 },
  monthRateInputRow: { display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' },
  monthRateInput: { padding: '8px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 60, textAlign: 'center' },
  monthRateUnit: { fontSize: 12, color: '#888' },
  durationList: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 },
  durationRow: { display: 'flex', alignItems: 'flex-end', gap: 12, background: '#f7f5f0', borderRadius: 8, padding: '14px 16px', border: '1px solid #e8e4dc' },
  durationField: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  removeBtn: { padding: '9px 12px', background: '#fff0f0', color: '#cc0000', border: '1px solid #ffa39e', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginBottom: 0 },
  addRowBtn: { padding: '10px 20px', background: '#f0f7ec', color: '#1f4d1f', border: '1px solid #a8d5a8', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

  // Toggles
  toggleGrid: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 },
  toggleCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f7f5f0', borderRadius: 8, padding: '14px 18px', border: '1px solid #e8e4dc', gap: 16 },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 3 },
  toggleDesc: { fontSize: 12, color: '#888' },
  toggleOn: { padding: '8px 18px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minWidth: 60 },
  toggleOff: { padding: '8px 18px', background: '#e8e4dc', color: '#888', border: 'none', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minWidth: 60 },

  // Loyalty
  loyaltyList: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 },
  loyaltyRow: { display: 'flex', alignItems: 'flex-end', gap: 14, background: '#f7f5f0', borderRadius: 8, padding: '14px 16px', border: '1px solid #e8e4dc' },
  loyaltyIcon: { fontSize: 24, flexShrink: 0, marginBottom: 4 },
  loyaltyDiscountField: { display: 'flex', flexDirection: 'column', gap: 6 },
  loyaltyDiscountBadge: { background: '#eafaf0', color: '#1a7a3a', padding: '6px 14px', borderRadius: 99, fontSize: 14, fontWeight: 700, flexShrink: 0, marginBottom: 2 },

  // Calculator
  calcInputRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  calcTierBadge: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 },
  calcTierLabel: { background: '#eef2ff', color: '#4338ca', padding: '5px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700 },
  calcLoyaltyBadge: { background: '#eafaf0', color: '#1a7a3a', padding: '5px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600 },
  calcRateRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 },
  calcRateBox: { background: '#f7f5f0', border: '1px solid #e8e4dc', borderRadius: 10, padding: '14px 16px', textAlign: 'center' },
  calcRateLabel: { fontSize: 11, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  calcRateValue: { fontSize: 22, fontWeight: 700, color: '#1f4d1f' },
  calcSummaryTable: { background: '#f7f5f0', borderRadius: 10, overflow: 'hidden', border: '1px solid #e8e4dc', marginBottom: 16 },
  calcSummaryRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #e8e4dc', fontSize: 14 },
  calcSummaryLabel: { color: '#555' },
  calcSummaryValue: { fontWeight: 700, color: '#111' },
  loyaltyReasons: { background: '#eafaf0', borderRadius: 8, padding: '12px 16px', marginBottom: 16, border: '1px solid #a8d5a8' },
  loyaltyReasonsTitle: { fontSize: 13, fontWeight: 700, color: '#1a7a3a', marginBottom: 6 },
  loyaltyReasonItem: { fontSize: 13, color: '#555', marginBottom: 3 },
};
