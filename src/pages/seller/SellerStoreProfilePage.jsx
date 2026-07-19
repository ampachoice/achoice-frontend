import { useState, useEffect } from "react";
import SellerLayout from "../../components/seller/SellerLayout";
import { getSellerProfile, updateSellerProfile } from "../../services/sellerService";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
];

const STATUS_COLORS = {
  active: { bg: "#e6f4ea", color: "#1f4d1f" },
  pending_approval: { bg: "#fff4de", color: "#a86a00" },
  suspended: { bg: "#fbe9e9", color: "#a81f1f" },
};

export default function SellerStoreProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [businessForm, setBusinessForm] = useState(null);
  const [businessSaving, setBusinessSaving] = useState(false);
  const [businessError, setBusinessError] = useState(null);
  const [businessSaved, setBusinessSaved] = useState(false);

  const [bankForm, setBankForm] = useState(null);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState(null);
  const [bankSaved, setBankSaved] = useState(false);

  const loadProfile = () => {
    setLoading(true);
    getSellerProfile()
      .then((res) => {
        setProfile(res.data);
        setBusinessForm({
          business_name: res.data.business_name || "",
          business_address: res.data.business_address || "",
          state: res.data.state || "",
          lga: res.data.lga || "",
          description: res.data.description || "",
          website: res.data.website || "",
        });
        setBankForm({
          bank_name: res.data.bank_name || "",
          account_number: res.data.account_number || "",
          account_name: res.data.account_name || "",
        });
      })
      .catch((err) => setLoadError(err.response?.data?.message || "Failed to load your store profile."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    setBusinessError(null);
    setBusinessSaved(false);
    setBusinessSaving(true);
    try {
      const res = await updateSellerProfile(businessForm);
      setProfile((p) => ({ ...p, ...res.data.seller }));
      setBusinessSaved(true);
      setTimeout(() => setBusinessSaved(false), 3000);
    } catch (err) {
      setBusinessError(err.response?.data?.message || "Failed to save business information.");
    } finally {
      setBusinessSaving(false);
    }
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setBankError(null);
    setBankSaved(false);

    if (bankForm.account_number && !/^\d{10}$/.test(bankForm.account_number)) {
      setBankError("Account number must be exactly 10 digits.");
      return;
    }

    setBankSaving(true);
    try {
      // Sent separately from business info — the backend rejects the whole
      // request with 423 if bank fields are frozen, so mixing them into one
      // form would block unrelated business-info edits too.
      const res = await updateSellerProfile(bankForm);
      setProfile((p) => ({ ...p, ...res.data.seller }));
      setBankSaved(true);
      setTimeout(() => setBankSaved(false), 3000);
    } catch (err) {
      setBankError(err.response?.data?.message || "Failed to save bank details.");
    } finally {
      setBankSaving(false);
    }
  };

  if (loading) {
    return (
      <SellerLayout title="Store Profile">
        <div style={s.emptyState}>Loading your store profile...</div>
      </SellerLayout>
    );
  }

  if (loadError || !profile) {
    return (
      <SellerLayout title="Store Profile">
        <div style={s.emptyState}>{loadError || "Something went wrong."}</div>
      </SellerLayout>
    );
  }

  const statusColors = STATUS_COLORS[profile.status] || { bg: "#eee", color: "#555" };
  const isFrozen = !!profile.bank_details_frozen;

  return (
    <SellerLayout title="Store Profile" subtitle="Manage your business information and payout details.">
      {/* Summary strip */}
      <div style={s.summaryCard}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#111" }}>{profile.business_name}</div>
          <div style={{ fontSize: 12.5, color: "#888", marginTop: 2 }}>
            Member since{" "}
            {new Date(profile.member_since).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 13, color: "#666" }}>
            <span style={{ color: "#f0c050" }}>★</span> {Number(profile.rating || 0).toFixed(1)}
          </div>
          <span style={{ ...s.statusBadge, background: statusColors.bg, color: statusColors.color }}>
            {profile.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div style={s.twoCol}>
        {/* Business Information */}
        <form style={s.card} onSubmit={handleBusinessSubmit}>
          <div style={s.cardTitle}>Business Information</div>

          {businessError && <div style={s.formError}>⚠️ {businessError}</div>}
          {businessSaved && <div style={s.formSuccess}>✓ Business information saved.</div>}

          <div style={s.field}>
            <label style={s.label}>Business Name</label>
            <input
              style={s.input}
              value={businessForm.business_name}
              onChange={(e) => setBusinessForm((f) => ({ ...f, business_name: e.target.value }))}
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Business Address</label>
            <input
              style={s.input}
              value={businessForm.business_address}
              onChange={(e) => setBusinessForm((f) => ({ ...f, business_address: e.target.value }))}
            />
          </div>
          <div style={s.row2}>
            <div style={s.field}>
              <label style={s.label}>State</label>
              <select
                style={s.input}
                value={businessForm.state}
                onChange={(e) => setBusinessForm((f) => ({ ...f, state: e.target.value }))}
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>LGA</label>
              <input
                style={s.input}
                value={businessForm.lga}
                onChange={(e) => setBusinessForm((f) => ({ ...f, lga: e.target.value }))}
              />
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Store Description</label>
            <textarea
              style={{ ...s.input, minHeight: 90, resize: "vertical", fontFamily: "inherit" }}
              maxLength={500}
              value={businessForm.description}
              onChange={(e) => setBusinessForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Tell buyers what you sell — this shows on your public storefront."
            />
            <div style={s.charCount}>{businessForm.description.length}/500</div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Website (optional)</label>
            <input
              style={s.input}
              value={businessForm.website}
              onChange={(e) => setBusinessForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <button type="submit" style={businessSaving ? s.saveBtnDisabled : s.saveBtn} disabled={businessSaving}>
            {businessSaving ? "Saving..." : "Save Business Information"}
          </button>
        </form>

        {/* Bank Details */}
        <form style={s.card} onSubmit={handleBankSubmit}>
          <div style={s.cardTitle}>Bank Details</div>

          {isFrozen ? (
            <div style={s.frozenBanner}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>🔒 Bank details are frozen</div>
              <div style={{ fontSize: 12.5 }}>
                {profile.bank_freeze_reason || "Contact support for details."}
              </div>
            </div>
          ) : (
            <>
              {bankError && <div style={s.formError}>⚠️ {bankError}</div>}
              {bankSaved && <div style={s.formSuccess}>✓ Bank details saved.</div>}
            </>
          )}

          <div style={s.field}>
            <label style={s.label}>Bank Name</label>
            <input
              style={s.input}
              value={bankForm.bank_name}
              onChange={(e) => setBankForm((f) => ({ ...f, bank_name: e.target.value }))}
              disabled={isFrozen}
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Account Number</label>
            <input
              style={s.input}
              value={bankForm.account_number}
              onChange={(e) => setBankForm((f) => ({ ...f, account_number: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
              disabled={isFrozen}
              inputMode="numeric"
              placeholder="10 digits"
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Account Name</label>
            <input
              style={s.input}
              value={bankForm.account_name}
              onChange={(e) => setBankForm((f) => ({ ...f, account_name: e.target.value }))}
              disabled={isFrozen}
              required
            />
          </div>

          {!isFrozen && (
            <button type="submit" style={bankSaving ? s.saveBtnDisabled : s.saveBtn} disabled={bankSaving}>
              {bankSaving ? "Saving..." : "Save Bank Details"}
            </button>
          )}
        </form>
      </div>
    </SellerLayout>
  );
}

const s = {
  emptyState: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: 48, textAlign: "center", color: "#888", fontSize: 14 },
  summaryCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    background: "#fff",
    border: "1px solid #e8e4dc",
    borderRadius: 12,
    padding: "18px 22px",
    marginBottom: 20,
  },
  statusBadge: { fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, textTransform: "capitalize" },
  twoCol: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 },
  card: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: 22 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 16 },
  field: { marginBottom: 14 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 6 },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #ddd",
    borderRadius: 8,
    fontSize: 13.5,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    background: "#fff",
  },
  charCount: { fontSize: 11, color: "#aaa", textAlign: "right", marginTop: 4 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  formError: { background: "#fff0f0", color: "#cc0000", border: "1px solid #ffb3b3", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  formSuccess: { background: "#f0fff4", color: "#1a7a3a", border: "1px solid #a8d5a8", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  frozenBanner: { background: "#fff8e7", border: "1px solid #f0c050", color: "#7a5000", borderRadius: 8, padding: "12px 14px", marginBottom: 16 },
  saveBtn: { width: "100%", padding: "12px", background: "#1f4d1f", color: "#fff", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 4 },
  saveBtnDisabled: { width: "100%", padding: "12px", background: "#ccc", color: "#fff", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: "not-allowed", fontFamily: "inherit", marginTop: 4 },
};
