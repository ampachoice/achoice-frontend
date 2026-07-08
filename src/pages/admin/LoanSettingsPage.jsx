import { useState, useEffect } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

const TABS = [
  { key: "tiers", label: "📊 Interest Tiers" },
  { key: "duration", label: "🗓️ Duration Rates" },
  { key: "general", label: "⚙️ General Settings" },
  { key: "loyalty", label: "🏅 Loyalty Discounts" },
  { key: "calculator", label: "🧮 Live Calculator" },
];

// The 11 month values the backend actually tracks flat-rate overrides for
// (App\Services\LoanCalculatorService::getDurationSettings)
const FLAT_RATE_MONTHS = [1, 2, 3, 6, 9, 12, 18, 24, 36, 48, 60];

export default function LoanSettingsPage() {
  const [activeTab, setActiveTab] = useState("tiers");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  // Raw settings as last loaded from the backend
  const [tiers, setTiers] = useState([]);

  // ── Tab 1: Interest Tiers ─────────────────────────────────────────────────
  const [tierForm, setTierForm] = useState({
    tier_1_max: "",
    tier_1_rate: "",
    tier_2_max: "",
    tier_2_rate: "",
    tier_3_max: "",
    tier_3_rate: "",
    tier_4_max: "",
    tier_4_rate: "",
    premium_rate: "",
  });
  const [savingTiers, setSavingTiers] = useState(false);

  // ── Tab 2: Duration Rates ─────────────────────────────────────────────────
  const [monthRates, setMonthRates] = useState({});
  const [durationAdj, setDurationAdj] = useState({
    short: "",
    medium: "",
    long: "",
  });
  const [savingDuration, setSavingDuration] = useState(false);

  // ── Tab 3: General Settings (+ folded-in Purposes/Durations) ─────────────
  const [generalForm, setGeneralForm] = useState({
    loan_min_amount: "",
    loan_max_amount: "",
    loan_max_duration: "",
    processing_fee: "",
    penalty_rate: "",
    grace_period_days: "",
    require_documents: true,
    allow_multiple: false,
    document_threshold: "",
    auto_approve: false,
    auto_approve_max_amount: "",
  });
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [purposes, setPurposes] = useState([]);
  const [durationOptions, setDurationOptions] = useState([]);
  const [newPurpose, setNewPurpose] = useState("");
  const [newDuration, setNewDuration] = useState({ months: "", label: "" });

  // ── Tab 4: Loyalty Discounts ──────────────────────────────────────────────
  const [loyaltyForm, setLoyaltyForm] = useState({
    no_default: "",
    "1_loan": "",
    "3_loans": "",
    "5_loans": "",
    max_total_discount: "",
  });
  const [savingLoyalty, setSavingLoyalty] = useState(false);

  // ── Tab 5: Live Calculator ────────────────────────────────────────────────
  const [calcAmount, setCalcAmount] = useState(100000);
  const [calcDuration, setCalcDuration] = useState(6);
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [previewUserId, setPreviewUserId] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // ── Hydrate all form state from a /admin/settings/loan response ─────────
  const applySettings = (data) => {
    const t = data.tiers || [];
    setTiers(t);
    setTierForm({
      tier_1_max: t[0]?.max ?? "",
      tier_1_rate: t[0]?.rate ?? "",
      tier_2_max: t[1]?.max ?? "",
      tier_2_rate: t[1]?.rate ?? "",
      tier_3_max: t[2]?.max ?? "",
      tier_3_rate: t[2]?.rate ?? "",
      tier_4_max: t[3]?.max ?? "",
      tier_4_rate: t[3]?.rate ?? "",
      premium_rate: t[4]?.rate ?? "",
    });

    const g = data.general || {};
    setGeneralForm({
      loan_min_amount: g.loan_min_amount ?? "",
      loan_max_amount: g.loan_max_amount ?? "",
      loan_max_duration: g.loan_max_duration ?? "",
      processing_fee: g.processing_fee ?? "",
      penalty_rate: g.penalty_rate ?? "",
      grace_period_days: g.grace_period_days ?? "",
      require_documents: !!g.require_documents,
      allow_multiple: !!g.allow_multiple,
      document_threshold: g.document_threshold ?? "",
      auto_approve: !!g.auto_approve,
      auto_approve_max_amount: g.auto_approve_max_amount ?? "",
    });

    const ds = data.duration_settings || [];
    const findAdj = (...months) => {
      for (const m of months) {
        const entry = ds.find((d) => d.months === m && !d.has_flat_rate);
        if (entry) return entry.adjustment;
      }
      return "";
    };
    setDurationAdj({
      short: findAdj(1, 2, 3),
      medium: findAdj(6, 9, 12),
      long: findAdj(18, 24, 36, 48, 60),
    });

    const mr = {};
    FLAT_RATE_MONTHS.forEach((m) => {
      const entry = ds.find((d) => d.months === m);
      mr[m] = entry?.has_flat_rate ? entry.flat_rate : "";
    });
    setMonthRates(mr);

    const l = data.loyalty || {};
    setLoyaltyForm({
      no_default: l.no_default_discount ?? "",
      "1_loan": l["1_loan_discount"] ?? "",
      "3_loans": l["3_loans_discount"] ?? "",
      "5_loans": l["5_loans_discount"] ?? "",
      max_total_discount: l.max_total_discount ?? "",
    });
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [loanRes, purposesRes, durationsRes] = await Promise.all([
          api.get("/admin/settings/loan"),
          api.get("/admin/settings/loan-purposes"),
          api.get("/admin/settings/loan-durations"),
        ]);
        applySettings(loanRes.data);
        setPurposes(purposesRes.data.purposes || purposesRes.data || []);
        setDurationOptions(
          durationsRes.data.durations || durationsRes.data || [],
        );
      } catch (err) {
        setError("Failed to load loan settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Live calculator — debounced, fires whenever the test amount/duration change
  useEffect(() => {
    if (activeTab !== "calculator") return;
    const amt = Number(calcAmount);
    const dur = Number(calcDuration);
    if (!amt || !dur) {
      setCalcResult(null);
      return;
    }
    setCalcLoading(true);
    const handle = setTimeout(() => {
      api
        .get("/loans/calculate", {
          params: {
            amount: amt,
            duration_months: dur,
            ...(previewUserId ? { user_id: Number(previewUserId) } : {}),
          },
        })
        .then((res) => setCalcResult(res.data))
        .catch(() => setCalcResult(null))
        .finally(() => setCalcLoading(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [calcAmount, calcDuration, activeTab, previewUserId]);

  // ── Save handlers ─────────────────────────────────────────────────────────
  const handleSaveTiers = async () => {
    setSavingTiers(true);
    setError("");
    try {
      const res = await api.post("/admin/settings/loan-tiers", {
        tier_1_max: Number(tierForm.tier_1_max),
        tier_1_rate: Number(tierForm.tier_1_rate),
        tier_2_max: Number(tierForm.tier_2_max),
        tier_2_rate: Number(tierForm.tier_2_rate),
        tier_3_max: Number(tierForm.tier_3_max),
        tier_3_rate: Number(tierForm.tier_3_rate),
        tier_4_max: Number(tierForm.tier_4_max),
        tier_4_rate: Number(tierForm.tier_4_rate),
        premium_rate: Number(tierForm.premium_rate),
      });
      setTiers(res.data.tiers || []);
      showToast("✅ Interest tier rates updated!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save tier rates.");
    } finally {
      setSavingTiers(false);
    }
  };

  const handleSaveDuration = async () => {
    setSavingDuration(true);
    setError("");
    try {
      const month_rates = {};
      Object.entries(monthRates).forEach(([m, v]) => {
        month_rates[m] = v === "" || v === null ? null : Number(v);
      });
      const res = await api.post("/admin/settings/loan", {
        duration_adj: {
          short: durationAdj.short === "" ? undefined : Number(durationAdj.short),
          medium:
            durationAdj.medium === "" ? undefined : Number(durationAdj.medium),
          long: durationAdj.long === "" ? undefined : Number(durationAdj.long),
        },
        month_rates,
      });
      applySettings(res.data.settings);
      showToast("✅ Duration rates updated!");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save duration rates.",
      );
    } finally {
      setSavingDuration(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSavingGeneral(true);
    setError("");
    try {
      const res = await api.post("/admin/settings/loan", {
        general: {
          loan_min_amount: Number(generalForm.loan_min_amount),
          loan_max_amount: Number(generalForm.loan_max_amount),
          loan_max_duration: Number(generalForm.loan_max_duration),
          processing_fee: Number(generalForm.processing_fee),
          penalty_rate: Number(generalForm.penalty_rate),
          grace_period_days: Number(generalForm.grace_period_days),
          require_documents: !!generalForm.require_documents,
          allow_multiple: !!generalForm.allow_multiple,
          document_threshold: Number(generalForm.document_threshold),
          auto_approve: !!generalForm.auto_approve,
          auto_approve_max_amount: Number(generalForm.auto_approve_max_amount),
        },
      });
      applySettings(res.data.settings);
      showToast("✅ General settings updated!");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save general settings.",
      );
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveLoyalty = async () => {
    setSavingLoyalty(true);
    setError("");
    try {
      const res = await api.post("/admin/settings/loan", {
        loyalty: {
          no_default: Number(loyaltyForm.no_default),
          "1_loan": Number(loyaltyForm["1_loan"]),
          "3_loans": Number(loyaltyForm["3_loans"]),
          "5_loans": Number(loyaltyForm["5_loans"]),
          max_total_discount: Number(loyaltyForm.max_total_discount),
        },
      });
      applySettings(res.data.settings);
      showToast("✅ Loyalty discount rules updated!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save loyalty rules.");
    } finally {
      setSavingLoyalty(false);
    }
  };

  // Purposes / Durations CRUD — folded in from the old settings page
  const handleAddPurpose = async () => {
    if (!newPurpose.trim()) return;
    try {
      const res = await api.post("/admin/settings/loan-purposes", {
        name: newPurpose.trim(),
      });
      setPurposes([...purposes, res.data.purpose || res.data]);
      setNewPurpose("");
      showToast("Purpose added!");
    } catch (err) {
      showToast("Failed to add purpose.");
    }
  };

  const handleDeletePurpose = async (id) => {
    if (!window.confirm("Delete this purpose?")) return;
    try {
      await api.delete(`/admin/settings/loan-purposes/${id}`);
      setPurposes(purposes.filter((p) => p.id !== id));
      showToast("Purpose deleted!");
    } catch (err) {
      showToast("Failed to delete purpose.");
    }
  };

  const handleAddDuration = async () => {
    if (!newDuration.months || !newDuration.label) return;
    try {
      const res = await api.post("/admin/settings/loan-durations", {
        months: Number(newDuration.months),
        label: newDuration.label,
      });
      setDurationOptions([...durationOptions, res.data.duration || res.data]);
      setNewDuration({ months: "", label: "" });
      showToast("Duration option added!");
    } catch (err) {
      showToast("Failed to add duration option.");
    }
  };

  const handleDeleteDuration = async (id) => {
    if (!window.confirm("Delete this duration option?")) return;
    try {
      await api.delete(`/admin/settings/loan-durations/${id}`);
      setDurationOptions(durationOptions.filter((d) => d.id !== id));
      showToast("Duration option deleted!");
    } catch (err) {
      showToast("Failed to delete duration option.");
    }
  };

  const fmtNaira = (n) =>
    n === null || n === undefined || n === ""
      ? "—"
      : `₦${Number(n).toLocaleString()}`;

  if (loading) {
    return (
      <AdminLayout title="Loan Settings" subtitle="Loading...">
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
          Loading loan settings...
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      {toast && <div style={s.toast}>{toast}</div>}

      <AdminLayout
        title="Loan Settings"
        subtitle="Configure interest rates, tiers, durations and loyalty discounts"
      >
        {error && <div style={s.errorBox}>{error}</div>}

        {/* Tab nav */}
        <div style={s.tabNav}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              style={activeTab === tab.key ? s.tabActive : s.tab}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════ TAB 1: INTEREST TIERS ════ */}
        {activeTab === "tiers" && (
          <div style={s.card}>
            <div style={s.cardTitle}>📊 Interest Rate Tiers</div>
            <p style={s.cardDesc}>
              Monthly interest rates based on loan amount. Larger loans get
              lower rates. Admin can adjust any tier rate below.
            </p>

            <div style={s.tierGrid}>
              {[
                {
                  name: "Micro",
                  label: `Up to ₦${Number(tierForm.tier_1_max || 0).toLocaleString()}`,
                  maxKey: "tier_1_max",
                  rateKey: "tier_1_rate",
                  min: 0,
                },
                {
                  name: "Small",
                  label: `₦${(Number(tierForm.tier_1_max || 0) + 1).toLocaleString()} – ₦${Number(tierForm.tier_2_max || 0).toLocaleString()}`,
                  maxKey: "tier_2_max",
                  rateKey: "tier_2_rate",
                  min: Number(tierForm.tier_1_max || 0) + 1,
                },
                {
                  name: "Medium",
                  label: `₦${(Number(tierForm.tier_2_max || 0) + 1).toLocaleString()} – ₦${Number(tierForm.tier_3_max || 0).toLocaleString()}`,
                  maxKey: "tier_3_max",
                  rateKey: "tier_3_rate",
                  min: Number(tierForm.tier_2_max || 0) + 1,
                },
                {
                  name: "Large",
                  label: `₦${(Number(tierForm.tier_3_max || 0) + 1).toLocaleString()} – ₦${Number(tierForm.tier_4_max || 0).toLocaleString()}`,
                  maxKey: "tier_4_max",
                  rateKey: "tier_4_rate",
                  min: Number(tierForm.tier_3_max || 0) + 1,
                },
                {
                  name: "Premium",
                  label: `Above ₦${Number(tierForm.tier_4_max || 0).toLocaleString()}`,
                  maxKey: null,
                  rateKey: "premium_rate",
                  min: Number(tierForm.tier_4_max || 0) + 1,
                },
              ].map((tier) => (
                <div key={tier.name} style={s.tierCard}>
                  <div style={s.tierName}>{tier.name}</div>
                  <div style={s.tierRange}>{tier.label}</div>

                  <label style={s.tierFieldLabel}>Monthly Rate (%)</label>
                  <div style={s.tierRateRow}>
                    <input
                      style={s.tierInput}
                      type="number"
                      step="0.1"
                      value={tierForm[tier.rateKey]}
                      onChange={(e) =>
                        setTierForm((p) => ({
                          ...p,
                          [tier.rateKey]: e.target.value,
                        }))
                      }
                    />
                    <span style={s.tierUnit}>% / month</span>
                  </div>
                  <div style={s.tierAnnual}>
                    ={" "}
                    {tierForm[tier.rateKey]
                      ? (Number(tierForm[tier.rateKey]) * 12).toFixed(1)
                      : "0.0"}
                    % per year
                  </div>

                  <label style={s.tierFieldLabel}>Min Amount (₦)</label>
                  <input
                    style={s.tierInputDisabled}
                    type="text"
                    value={tier.min.toLocaleString()}
                    disabled
                    title="Automatically set to the previous tier's max + 1"
                  />

                  <label style={s.tierFieldLabel}>
                    Max Amount (₦){" "}
                    {tier.maxKey ? "— leave blank for unlimited" : ""}
                  </label>
                  {tier.maxKey ? (
                    <input
                      style={s.tierInput}
                      type="number"
                      value={tierForm[tier.maxKey]}
                      onChange={(e) =>
                        setTierForm((p) => ({
                          ...p,
                          [tier.maxKey]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <input
                      style={s.tierInputDisabled}
                      type="text"
                      value="Unlimited"
                      disabled
                    />
                  )}
                </div>
              ))}
            </div>

            <table style={s.tierTable}>
              <thead>
                <tr>
                  <th style={s.tierTh}>Tier</th>
                  <th style={s.tierTh}>Amount Range</th>
                  <th style={s.tierTh}>Monthly Rate</th>
                  <th style={s.tierTh}>Annual Rate</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t) => (
                  <tr key={t.name}>
                    <td style={s.tierTd}>{t.name}</td>
                    <td style={s.tierTd}>{t.label}</td>
                    <td style={s.tierTd}>{t.rate}%</td>
                    <td style={s.tierTd}>{(t.rate * 12).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              style={savingTiers ? s.saveBtnDisabled : s.saveBtn}
              onClick={handleSaveTiers}
              disabled={savingTiers}
            >
              {savingTiers ? "⏳ Saving..." : "💾 Save Interest Tiers"}
            </button>
          </div>
        )}

        {/* ════ TAB 2: DURATION RATES ════ */}
        {activeTab === "duration" && (
          <div style={s.card}>
            <div style={s.cardTitle}>🗓️ Duration-Based Rate Adjustments</div>
            <p style={s.cardDesc}>
              Adjust the base tier rate up or down based on loan duration.
              Shorter loans get a premium, longer loans get a discount. Set a
              specific flat monthly rate per duration, or use adjustments
              relative to the tier rate.
            </p>

            <div style={s.sectionLabel}>
              OPTION A — SET FLAT MONTHLY RATE PER DURATION
            </div>
            <p style={s.cardDesc}>
              If set, this overrides the tier rate for that specific duration.
              Leave blank to use tier rate + adjustment.
            </p>
            <div style={s.monthGrid}>
              {FLAT_RATE_MONTHS.map((m) => (
                <div key={m} style={s.monthBox}>
                  <label style={s.monthLabel}>
                    {m} Month{m > 1 ? "s" : ""}
                  </label>
                  <div style={s.monthInputRow}>
                    <input
                      style={s.monthInput}
                      type="number"
                      step="0.1"
                      placeholder="—"
                      value={monthRates[m] ?? ""}
                      onChange={(e) =>
                        setMonthRates((p) => ({ ...p, [m]: e.target.value }))
                      }
                    />
                    <span style={s.tierUnit}>%</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={s.sectionLabel}>OPTION B — DURATION ADJUSTMENT PRESETS</div>
            <p style={s.cardDesc}>
              Applied to any duration that doesn't have a flat rate set above.
              Rate adjustment is added to the tier base rate.
            </p>
            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Short loans (1–3 months)</label>
                <input
                  style={s.input}
                  type="number"
                  step="0.1"
                  value={durationAdj.short}
                  onChange={(e) =>
                    setDurationAdj((p) => ({ ...p, short: e.target.value }))
                  }
                />
                <span style={s.hint}>Typically a small premium, e.g. +0.5%</span>
              </div>
              <div style={s.field}>
                <label style={s.label}>Medium loans (4–12 months)</label>
                <input
                  style={s.input}
                  type="number"
                  step="0.1"
                  value={durationAdj.medium}
                  onChange={(e) =>
                    setDurationAdj((p) => ({ ...p, medium: e.target.value }))
                  }
                />
                <span style={s.hint}>Usually 0 — no adjustment</span>
              </div>
              <div style={s.field}>
                <label style={s.label}>Long loans (13+ months)</label>
                <input
                  style={s.input}
                  type="number"
                  step="0.1"
                  value={durationAdj.long}
                  onChange={(e) =>
                    setDurationAdj((p) => ({ ...p, long: e.target.value }))
                  }
                />
                <span style={s.hint}>Typically a discount, e.g. -1.0%</span>
              </div>
            </div>

            <button
              style={savingDuration ? s.saveBtnDisabled : s.saveBtn}
              onClick={handleSaveDuration}
              disabled={savingDuration}
            >
              {savingDuration ? "⏳ Saving..." : "💾 Save Duration Rates"}
            </button>
          </div>
        )}

        {/* ════ TAB 3: GENERAL SETTINGS ════ */}
        {activeTab === "general" && (
          <div style={s.card}>
            <div style={s.cardTitle}>⚙️ General Loan Settings</div>

            <div style={s.formGrid4}>
              <div style={s.field}>
                <label style={s.label}>Minimum Loan Amount (₦)</label>
                <input
                  style={s.input}
                  type="number"
                  value={generalForm.loan_min_amount}
                  onChange={(e) =>
                    setGeneralForm((p) => ({
                      ...p,
                      loan_min_amount: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Maximum Loan Amount (₦)</label>
                <input
                  style={s.input}
                  type="number"
                  value={generalForm.loan_max_amount}
                  onChange={(e) =>
                    setGeneralForm((p) => ({
                      ...p,
                      loan_max_amount: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Processing Fee (%)</label>
                <input
                  style={s.input}
                  type="number"
                  step="0.1"
                  value={generalForm.processing_fee}
                  onChange={(e) =>
                    setGeneralForm((p) => ({
                      ...p,
                      processing_fee: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Late Payment Penalty (%)</label>
                <input
                  style={s.input}
                  type="number"
                  step="0.1"
                  value={generalForm.penalty_rate}
                  onChange={(e) =>
                    setGeneralForm((p) => ({
                      ...p,
                      penalty_rate: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Grace Period (days)</label>
                <input
                  style={s.input}
                  type="number"
                  value={generalForm.grace_period_days}
                  onChange={(e) =>
                    setGeneralForm((p) => ({
                      ...p,
                      grace_period_days: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Minimum Duration (months)</label>
                <input style={s.input} type="text" value="1" disabled />
              </div>
              <div style={s.field}>
                <label style={s.label}>Maximum Duration (months)</label>
                <input
                  style={s.input}
                  type="number"
                  value={generalForm.loan_max_duration}
                  onChange={(e) =>
                    setGeneralForm((p) => ({
                      ...p,
                      loan_max_duration: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Document Threshold (₦)</label>
                <input
                  style={s.input}
                  type="number"
                  value={generalForm.document_threshold}
                  onChange={(e) =>
                    setGeneralForm((p) => ({
                      ...p,
                      document_threshold: e.target.value,
                    }))
                  }
                />
                <div style={s.hint}>
                  Loans at or above this amount require uploaded documents
                  before approval — only enforced while "Require Documents"
                  below is ON.
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Auto-Approve Ceiling (₦)</label>
                <input
                  style={s.input}
                  type="number"
                  value={generalForm.auto_approve_max_amount}
                  onChange={(e) =>
                    setGeneralForm((p) => ({
                      ...p,
                      auto_approve_max_amount: e.target.value,
                    }))
                  }
                />
                <div style={s.hint}>
                  Loans at or below this amount are approved instantly when
                  "Auto-Approve" below is ON. Never applies to loans that
                  require documents.
                </div>
              </div>
            </div>

            <div style={s.sectionLabel}>FEATURE TOGGLES</div>
            {[
              {
                key: "require_documents",
                icon: "🛡️",
                title: "Require Documents",
                desc: "Block approval if no documents uploaded",
              },
              {
                key: "allow_multiple",
                icon: "📑",
                title: "Allow Multiple Active Loans",
                desc: "Let a buyer apply for a new loan while one is still active",
              },
              {
                key: "auto_approve",
                icon: "⚡",
                title: "Auto-Approve",
                desc: "Instantly approve loans at or below the Auto-Approve Ceiling above (skipped if the loan requires documents)",
              },
            ].map((toggle) => (
              <div key={toggle.key} style={s.toggleRow}>
                <div>
                  <div style={s.toggleTitle}>
                    {toggle.icon} {toggle.title}
                  </div>
                  <div style={s.toggleDesc}>{toggle.desc}</div>
                </div>
                <button
                  style={generalForm[toggle.key] ? s.toggleOn : s.toggleOff}
                  onClick={() =>
                    setGeneralForm((p) => ({
                      ...p,
                      [toggle.key]: !p[toggle.key],
                    }))
                  }
                >
                  {generalForm[toggle.key] ? "ON" : "OFF"}
                </button>
              </div>
            ))}

            <button
              style={savingGeneral ? s.saveBtnDisabled : s.saveBtn}
              onClick={handleSaveGeneral}
              disabled={savingGeneral}
            >
              {savingGeneral ? "⏳ Saving..." : "💾 Save General Settings"}
            </button>

            <div style={s.sectionDivider}>Loan Purposes</div>
            <p style={s.cardDesc}>
              Purposes shown to buyers in the loan application form.
            </p>
            <div style={s.addRow}>
              <input
                style={s.input}
                type="text"
                placeholder="e.g. Fish Farming"
                value={newPurpose}
                onChange={(e) => setNewPurpose(e.target.value)}
              />
              <button style={s.addBtn} onClick={handleAddPurpose}>
                Add
              </button>
            </div>
            {purposes.map((p) => (
              <div key={p.id} style={s.listRow}>
                <span>{p.name}</span>
                <button
                  style={s.deleteBtn}
                  onClick={() => handleDeletePurpose(p.id)}
                >
                  Delete
                </button>
              </div>
            ))}

            <div style={s.sectionDivider}>Loan Duration Options</div>
            <p style={s.cardDesc}>
              Duration buttons shown to buyers on the loan application form.
            </p>
            <div style={s.addRowThree}>
              <input
                style={s.input}
                type="number"
                placeholder="Months"
                value={newDuration.months}
                onChange={(e) =>
                  setNewDuration((p) => ({ ...p, months: e.target.value }))
                }
              />
              <input
                style={s.input}
                type="text"
                placeholder="Label shown to buyer, e.g. '6 Months'"
                value={newDuration.label}
                onChange={(e) =>
                  setNewDuration((p) => ({ ...p, label: e.target.value }))
                }
              />
              <button style={s.addBtn} onClick={handleAddDuration}>
                Add
              </button>
            </div>
            {durationOptions.map((d) => (
              <div key={d.id} style={s.listRow}>
                <span>
                  {d.label} ({d.months} months)
                </span>
                <button
                  style={s.deleteBtn}
                  onClick={() => handleDeleteDuration(d.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ════ TAB 4: LOYALTY DISCOUNTS ════ */}
        {activeTab === "loyalty" && (
          <div style={s.card}>
            <div style={s.cardTitle}>🏅 Loyalty Discount Rules</div>
            <p style={s.cardDesc}>
              Buyers automatically qualify for rate discounts based on their
              history. Discounts stack and are subtracted from the base tier
              rate.
            </p>

            {[
              {
                key: "no_default",
                label: "No default history",
                desc: "No rejected/defaulted loans on record",
              },
              {
                key: "1_loan",
                label: "Completed 1+ loan",
                desc: "At least one loan fully repaid",
              },
              {
                key: "3_loans",
                label: "Completed 3+ loans",
                desc: "Extra discount on top of the 1+ tier",
              },
              {
                key: "5_loans",
                label: "Completed 5+ loans",
                desc: "Extra discount on top of the 3+ tier",
              },
            ].map((row) => (
              <div key={row.key} style={s.loyaltyRow}>
                <div style={s.loyaltyIcon}>🏅</div>
                <div style={s.loyaltyLabelCol}>
                  <div style={s.loyaltyLabel}>{row.label}</div>
                  <div style={s.toggleDesc}>{row.desc}</div>
                </div>
                <div style={s.loyaltyInputCol}>
                  <label style={s.tierFieldLabel}>Discount (%)</label>
                  <div style={s.monthInputRow}>
                    <input
                      style={s.tierInput}
                      type="number"
                      step="0.05"
                      value={loyaltyForm[row.key]}
                      onChange={(e) =>
                        setLoyaltyForm((p) => ({
                          ...p,
                          [row.key]: e.target.value,
                        }))
                      }
                    />
                    <span style={s.loyaltyPreview}>
                      -{loyaltyForm[row.key] || 0}%
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div style={s.field}>
              <label style={s.label}>Maximum Total Discount (%)</label>
              <input
                style={s.input}
                type="number"
                step="0.05"
                value={loyaltyForm.max_total_discount}
                onChange={(e) =>
                  setLoyaltyForm((p) => ({
                    ...p,
                    max_total_discount: e.target.value,
                  }))
                }
              />
              <div style={s.hint}>
                Hard cap on stacked loyalty discounts, regardless of how many
                tiers a buyer qualifies for.
              </div>
            </div>

            <div style={s.infoBox}>
              💡 <strong>Example:</strong> A buyer with no defaults and 1
              completed loan gets -{loyaltyForm.no_default || 0}% + -
              {loyaltyForm["1_loan"] || 0}% ={" "}
              -
              {(
                Number(loyaltyForm.no_default || 0) +
                Number(loyaltyForm["1_loan"] || 0)
              ).toFixed(2)}
              % off their base rate.
            </div>

            <button
              style={savingLoyalty ? s.saveBtnDisabled : s.saveBtn}
              onClick={handleSaveLoyalty}
              disabled={savingLoyalty}
            >
              {savingLoyalty ? "⏳ Saving..." : "💾 Save Loyalty Rules"}
            </button>
          </div>
        )}

        {/* ════ TAB 5: LIVE CALCULATOR ════ */}
        {activeTab === "calculator" && (
          <div style={s.card}>
            <div style={s.cardTitle}>🧮 Live Loan Calculator</div>
            <p style={s.cardDesc}>
              Test the current rate settings. This uses the same live API
              endpoint that buyers see.
            </p>

            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Loan Amount (₦)</label>
                <input
                  style={s.input}
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Duration (months)</label>
                <select
                  style={s.input}
                  value={calcDuration}
                  onChange={(e) => setCalcDuration(e.target.value)}
                >
                  {[1, 2, 3, 6, 9, 12, 18, 24, 36, 48, 60].map((m) => (
                    <option key={m} value={m}>
                      {m} Months
                    </option>
                  ))}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Preview as Buyer (User ID)</label>
                <input
                  style={s.input}
                  type="number"
                  placeholder="Leave blank to preview as guest"
                  value={previewUserId}
                  onChange={(e) => setPreviewUserId(e.target.value)}
                />
                <div style={s.hint}>
                  Shows the exact loyalty discount that buyer would see,
                  based on their real completed loan history.
                </div>
              </div>
            </div>

            {previewUserId && calcResult && !calcLoading && (
              <div style={s.infoBox}>
                👤 Previewing as buyer #{previewUserId} —{" "}
                {calcResult.breakdown?.completed_loans ?? 0} completed loan
                {calcResult.breakdown?.completed_loans === 1 ? "" : "s"} on
                record, earning a {calcResult.breakdown?.loyalty_discount ?? 0}%
                loyalty discount.
              </div>
            )}

            {calcLoading && (
              <p style={{ fontSize: 13, color: "#888" }}>Calculating...</p>
            )}

            {calcResult?.breakdown && (
              <>
                <div style={s.tierBadgeRow}>
                  <span style={s.tierBadge}>
                    Tier: {calcResult.breakdown.tier}
                  </span>
                </div>

                <div style={s.calcStatRow}>
                  <div style={s.calcStat}>
                    <div style={s.calcStatLabel}>BASE MONTHLY RATE</div>
                    <div style={s.calcStatVal}>
                      {calcResult.breakdown.base_rate}%
                    </div>
                  </div>
                  <div style={{ ...s.calcStat, ...s.calcStatHighlight }}>
                    <div style={s.calcStatLabelLight}>FINAL MONTHLY RATE</div>
                    <div style={s.calcStatValLight}>
                      {calcResult.breakdown.final_monthly_rate}%
                    </div>
                  </div>
                  <div style={s.calcStat}>
                    <div style={s.calcStatLabel}>EFFECTIVE ANNUAL</div>
                    <div style={s.calcStatVal}>
                      {calcResult.breakdown.effective_annual_rate}%
                    </div>
                  </div>
                </div>

                <div style={s.remitBreakdown}>
                  {[
                    ["You borrow", fmtNaira(calcResult.breakdown.amount)],
                    ["For", `${calcResult.breakdown.duration_months} months`],
                    [
                      "Monthly rate",
                      `${calcResult.breakdown.final_monthly_rate}% per month`,
                    ],
                    [
                      "Monthly payment",
                      fmtNaira(calcResult.breakdown.monthly_instalment),
                    ],
                    [
                      "Total interest",
                      fmtNaira(calcResult.breakdown.total_interest),
                    ],
                    [
                      "Total repayable",
                      fmtNaira(calcResult.breakdown.total_repayable),
                    ],
                    [
                      "Cost per ₦1,000",
                      fmtNaira(calcResult.breakdown.cost_per_1000),
                    ],
                  ].map(([label, val]) => (
                    <div key={label} style={s.remitRow}>
                      <span style={s.remitLabel}>{label}</span>
                      <span style={s.remitValue}>{val}</span>
                    </div>
                  ))}
                </div>

                <div style={s.infoBox}>
                  💡 This is what buyers see on the loan application page. The
                  final rate depends on the loan amount tier plus any loyalty
                  discounts the buyer has earned. (As an admin testing this,
                  loyalty discounts will show as 0 unless applied to your own
                  account's loan history.)
                </div>
              </>
            )}
          </div>
        )}
      </AdminLayout>
    </>
  );
}

const s = {
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    background: "#1f4d1f",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    zIndex: 9999,
    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
  },
  errorBox: {
    background: "#fdecec",
    border: "1px solid #f5b5b5",
    color: "#cc0000",
    padding: "10px 16px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
  },
  tabNav: {
    display: "flex",
    gap: 4,
    background: "#fff",
    borderRadius: 10,
    padding: 6,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  tab: {
    flex: 1,
    padding: "10px 14px",
    background: "transparent",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: "#555",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  tabActive: {
    flex: 1,
    padding: "10px 14px",
    background: "#1f4d1f",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    color: "#fff",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 28,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111",
    marginBottom: 6,
  },
  cardDesc: { fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 1.5 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1f4d1f",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionDivider: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111",
    marginTop: 28,
    marginBottom: 6,
    paddingTop: 20,
    borderTop: "1px solid #eee",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 16,
  },
  formGrid4: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 8,
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#333" },
  input: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
  },
  hint: { fontSize: 11, color: "#999" },
  saveBtn: {
    padding: "13px 24px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 12,
    fontFamily: "inherit",
  },
  saveBtnDisabled: {
    padding: "13px 24px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "not-allowed",
    marginTop: 12,
    fontFamily: "inherit",
  },
  infoBox: {
    background: "#f0f7ec",
    border: "1px solid #c5ddb8",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 13,
    color: "#1a4d1a",
    marginTop: 16,
    marginBottom: 16,
    lineHeight: 1.5,
  },

  // Tier cards
  tierGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 14,
    marginBottom: 24,
  },
  tierCard: {
    background: "#faf9f6",
    border: "1px solid #eee",
    borderRadius: 10,
    padding: 16,
  },
  tierName: { fontSize: 15, fontWeight: 700, color: "#111" },
  tierRange: { fontSize: 11, color: "#999", marginBottom: 12 },
  tierFieldLabel: {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#555",
    marginTop: 10,
    marginBottom: 4,
  },
  tierRateRow: { display: "flex", alignItems: "center", gap: 6 },
  tierInput: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 13,
    fontFamily: "inherit",
  },
  tierInputDisabled: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #eee",
    borderRadius: 6,
    fontSize: 13,
    fontFamily: "inherit",
    background: "#f2f2f2",
    color: "#888",
  },
  tierUnit: { fontSize: 11, color: "#888", whiteSpace: "nowrap" },
  tierAnnual: { fontSize: 11, color: "#aaa", marginTop: 4 },
  tierTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: 20,
  },
  tierTh: {
    textAlign: "left",
    background: "#1f4d1f",
    color: "#fff",
    fontSize: 11,
    textTransform: "uppercase",
    padding: "10px 12px",
  },
  tierTd: {
    padding: "10px 12px",
    fontSize: 13,
    borderBottom: "1px solid #f0f0f0",
    color: "#333",
  },

  // Duration tab
  monthGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: 10,
    marginBottom: 8,
  },
  monthBox: {
    background: "#faf9f6",
    border: "1px solid #eee",
    borderRadius: 8,
    padding: 10,
  },
  monthLabel: {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#555",
    marginBottom: 6,
  },
  monthInputRow: { display: "flex", alignItems: "center", gap: 6 },
  monthInput: {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 13,
    fontFamily: "inherit",
  },

  // General settings toggles
  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    background: "#faf9f6",
    borderRadius: 8,
    marginBottom: 8,
  },
  toggleTitle: { fontSize: 14, fontWeight: 600, color: "#111" },
  toggleDesc: { fontSize: 12, color: "#888", marginTop: 2 },
  toggleOn: {
    padding: "6px 18px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  toggleOff: {
    padding: "6px 18px",
    background: "#ddd",
    color: "#555",
    border: "none",
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },

  // Purposes / durations lists
  addRow: { display: "flex", gap: 10, marginBottom: 12 },
  addRowThree: {
    display: "grid",
    gridTemplateColumns: "120px 1fr auto",
    gap: 10,
    marginBottom: 12,
  },
  addBtn: {
    padding: "10px 20px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  listRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    background: "#faf9f6",
    borderRadius: 8,
    marginBottom: 6,
    fontSize: 13,
  },
  deleteBtn: {
    padding: "5px 12px",
    background: "#fff",
    color: "#cc0000",
    border: "1px solid #f0b8b8",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },

  // Loyalty tab
  loyaltyRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "#faf9f6",
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  loyaltyIcon: { fontSize: 22 },
  loyaltyLabelCol: { flex: 1 },
  loyaltyLabel: { fontSize: 14, fontWeight: 700, color: "#111" },
  loyaltyInputCol: { width: 150 },
  loyaltyPreview: {
    fontSize: 13,
    fontWeight: 700,
    color: "#1a7a3a",
    whiteSpace: "nowrap",
  },

  // Calculator tab
  tierBadgeRow: { marginBottom: 16 },
  tierBadge: {
    display: "inline-block",
    background: "#eef4ff",
    color: "#2955a8",
    fontSize: 12,
    fontWeight: 700,
    padding: "5px 14px",
    borderRadius: 99,
  },
  calcStatRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
    marginBottom: 20,
  },
  calcStat: {
    background: "#faf9f6",
    border: "1px solid #eee",
    borderRadius: 10,
    padding: 16,
    textAlign: "center",
  },
  calcStatHighlight: { background: "#1f4d1f", border: "none" },
  calcStatLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  calcStatLabelLight: {
    fontSize: 10,
    fontWeight: 700,
    color: "#c5ddb8",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  calcStatVal: { fontSize: 22, fontWeight: 800, color: "#111" },
  calcStatValLight: { fontSize: 22, fontWeight: 800, color: "#f0c050" },
  remitBreakdown: {
    background: "#faf9f6",
    borderRadius: 10,
    padding: "16px 18px",
    marginBottom: 16,
  },
  remitRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #eee",
  },
  remitLabel: { fontSize: 13, color: "#555" },
  remitValue: { fontSize: 14, fontWeight: 600, color: "#111" },
};
