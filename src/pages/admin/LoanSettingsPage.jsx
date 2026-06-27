import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function LoanSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    interest_rate: "",
    min_amount: "",
    max_amount: "",
  });
  const [purposes, setPurposes] = useState([]);
  const [durations, setDurations] = useState([]);
  const [newPurpose, setNewPurpose] = useState("");
  const [newDuration, setNewDuration] = useState({ months: "", label: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/settings/loan")
      .then((res) => {
        const data = res.data;
        setSettings({
          interest_rate: data.default_interest || "",
          min_amount: data.min_amount || "",
          max_amount: data.max_amount || "",
        });
        setPurposes(data.purposes || []);
        setDurations(data.durations || []);
      })
      .catch(() => setError("Failed to load loan settings."))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/settings", {
        settings: [
          { key: "loan_min_amount", value: String(settings.min_amount) },
          { key: "loan_max_amount", value: String(settings.max_amount) },
          {
            key: "loan_default_interest",
            value: String(settings.interest_rate),
          },
        ],
      });
      showToast("Settings saved successfully!");
    } catch (err) {
      setError(
        "Failed to save settings. " + (err.response?.data?.message || ""),
      );
    } finally {
      setSaving(false);
    }
  };

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
      setError("Failed to add purpose.");
    }
  };

  const handleDeletePurpose = async (id) => {
    if (!window.confirm("Delete this purpose?")) return;
    try {
      await api.delete(`/admin/settings/loan-purposes/${id}`);
      setPurposes(purposes.filter((p) => p.id !== id));
      showToast("Purpose deleted!");
    } catch (err) {
      setError("Failed to delete purpose.");
    }
  };

  const handleAddDuration = async () => {
    if (!newDuration.months || !newDuration.label) return;
    try {
      const res = await api.post("/admin/settings/loan-durations", {
        months: Number(newDuration.months),
        label: newDuration.label,
      });
      setDurations([...durations, res.data.duration || res.data]);
      setNewDuration({ months: "", label: "" });
      showToast("Duration added!");
    } catch (err) {
      setError("Failed to add duration.");
    }
  };

  const handleDeleteDuration = async (id) => {
    if (!window.confirm("Delete this duration?")) return;
    try {
      await api.delete(`/admin/settings/loan-durations/${id}`);
      setDurations(durations.filter((d) => d.id !== id));
      showToast("Duration deleted!");
    } catch (err) {
      setError("Failed to delete duration.");
    }
  };

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <div style={s.sidebarLogoIcon}>A</div>
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Admin Panel</div>
          </div>
        </div>
        <nav style={s.sidebarNav}>
          <div
            style={s.sidebarItem}
            onClick={() => navigate("/admin/dashboard")}
          >
            <span style={s.sidebarIcon}>📊</span> Dashboard
          </div>
          <div style={s.sidebarItem} onClick={() => navigate("/admin/buyers")}>
            <span style={s.sidebarIcon}>👤</span> Buyers
          </div>
          <div
            style={s.sidebarItem}
            onClick={() => navigate("/admin/complaints")}
          >
            <span style={s.sidebarIcon}>📋</span> Complaints
          </div>
          <div style={s.sidebarItem} onClick={() => navigate("/admin/sellers")}>
            <span style={s.sidebarIcon}>🏪</span> Sellers
          </div>
          <div
            style={s.sidebarItem}
            onClick={() => navigate("/admin/products")}
          >
            <span style={s.sidebarIcon}>🌾</span> Products
          </div>
          <div style={s.sidebarItem} onClick={() => navigate("/admin/orders")}>
            <span style={s.sidebarIcon}>📦</span> Orders
          </div>
          <div style={s.sidebarItem} onClick={() => navigate("/admin/loans")}>
            <span style={s.sidebarIcon}>💰</span> Loans
          </div>
          <div style={{ ...s.sidebarItem, ...s.sidebarItemActive }}>
            <span style={s.sidebarIcon}>⚙️</span> Loan Settings
          </div>
          <div
            style={s.sidebarItem}
            onClick={() => navigate("/admin/delivery-zones")}
          >
            <span style={s.sidebarIcon}>🚚</span> Delivery zones
          </div>
          <div style={s.sidebarItem} onClick={() => navigate("/admin/staff")}>
            <span style={s.sidebarIcon}>👥</span> Staff
          </div>
        </nav>
        <div style={s.sidebarFooter}>
          <button
            style={s.logoutBtn}
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/admin");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.header}>
          <h1 style={s.headerTitle}>Loan Settings</h1>
          <p style={s.headerSub}>
            Configure loan terms — changes reflect immediately on the buyer loan
            form
          </p>
        </div>

        {error && <div style={s.error}>{error}</div>}
        {loading && <p style={s.message}>Loading settings...</p>}

        {!loading && (
          <div style={s.layout}>
            {/* Left Column */}
            <div style={s.leftCol}>
              {/* Interest Rate, Min, Max */}
              <div style={s.card}>
                <h2 style={s.cardTitle}>Loan Amounts & Interest Rate</h2>
                <p style={s.cardSub}>
                  These values are validated on the backend when buyers submit
                  applications.
                </p>
                <form onSubmit={handleSaveSettings}>
                  <div style={s.field}>
                    <label style={s.label}>Default Interest Rate (%)</label>
                    <input
                      style={s.input}
                      type="number"
                      step="0.01"
                      value={settings.interest_rate}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          interest_rate: e.target.value,
                        })
                      }
                      placeholder="e.g. 10"
                      required
                    />
                  </div>
                  <div style={s.fieldRow}>
                    <div style={s.field}>
                      <label style={s.label}>Minimum Loan Amount (₦)</label>
                      <input
                        style={s.input}
                        type="number"
                        value={settings.min_amount}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            min_amount: e.target.value,
                          })
                        }
                        placeholder="e.g. 50000"
                        required
                      />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Maximum Loan Amount (₦)</label>
                      <input
                        style={s.input}
                        type="number"
                        value={settings.max_amount}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            max_amount: e.target.value,
                          })
                        }
                        placeholder="e.g. 5000000"
                        required
                      />
                    </div>
                  </div>
                  <button
                    style={saving ? s.btnDisabled : s.btn}
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Loan Settings"}
                  </button>
                </form>
              </div>

              {/* Purposes */}
              <div style={s.card}>
                <h2 style={s.cardTitle}>Loan Purposes</h2>
                <p style={s.cardSub}>
                  Add or remove purposes shown to buyers in the application
                  form.
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

                <div style={s.listBox}>
                  {purposes.map((p) => (
                    <div key={p.id} style={s.listItem}>
                      <span style={s.listItemText}>{p.name}</span>
                      <button
                        style={s.deleteBtn}
                        onClick={() => handleDeletePurpose(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  {purposes.length === 0 && (
                    <p style={s.emptyText}>No purposes yet. Add one above.</p>
                  )}
                </div>
              </div>

              {/* Durations */}
              <div style={s.card}>
                <h2 style={s.cardTitle}>Loan Durations</h2>
                <p style={s.cardSub}>
                  Add or remove duration options shown to buyers.
                </p>

                <div style={s.addRow}>
                  <input
                    style={{ ...s.input, width: 100 }}
                    type="number"
                    placeholder="Months"
                    value={newDuration.months}
                    onChange={(e) =>
                      setNewDuration({ ...newDuration, months: e.target.value })
                    }
                  />
                  <input
                    style={s.input}
                    type="text"
                    placeholder="Label e.g. 6 Months"
                    value={newDuration.label}
                    onChange={(e) =>
                      setNewDuration({ ...newDuration, label: e.target.value })
                    }
                  />
                  <button style={s.addBtn} onClick={handleAddDuration}>
                    Add
                  </button>
                </div>

                <div style={s.listBox}>
                  {durations.map((d) => (
                    <div key={d.id} style={s.listItem}>
                      <span style={s.listItemText}>
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
                  {durations.length === 0 && (
                    <p style={s.emptyText}>No durations yet. Add one above.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column — Live Preview */}
            <div style={s.rightCol}>
              <div style={s.previewCard}>
                <div style={s.previewTitle}>Live Preview</div>
                <p style={s.previewSub}>This is what buyers currently see</p>

                <div style={s.previewItem}>
                  <div style={s.previewLabel}>INTEREST RATE</div>
                  <div style={s.previewValue}>
                    {settings.interest_rate}% flat
                  </div>
                </div>
                <div style={s.previewItem}>
                  <div style={s.previewLabel}>LOAN RANGE</div>
                  <div style={s.previewValue}>
                    ₦{Number(settings.min_amount).toLocaleString()} — ₦
                    {Number(settings.max_amount).toLocaleString()}
                  </div>
                </div>
                <div style={s.previewItem}>
                  <div style={s.previewLabel}>DURATION OPTIONS</div>
                  <div style={s.durationTags}>
                    {durations.map((d) => (
                      <div key={d.id} style={s.durationTag}>
                        {d.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={s.previewItem}>
                  <div style={s.previewLabel}>ALLOWED PURPOSES</div>
                  <div style={s.purposeList}>
                    {purposes.map((p) => (
                      <div key={p.id} style={s.purposeItem}>
                        • {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sample Calculation */}
              <div style={s.calcCard}>
                <div style={s.calcTitle}>Sample Calculation</div>
                <div style={s.calcDesc}>
                  ₦500,000 at {settings.interest_rate}% for{" "}
                  {durations[2]?.months || 6} months
                </div>
                <div style={s.calcRow}>
                  <span style={s.calcLabel}>Principal</span>
                  <span style={s.calcValue}>₦500,000</span>
                </div>
                <div style={s.calcRow}>
                  <span style={s.calcLabel}>
                    Interest ({settings.interest_rate}%)
                  </span>
                  <span style={s.calcValue}>
                    ₦
                    {(
                      (500000 * Number(settings.interest_rate)) /
                      100
                    ).toLocaleString()}
                  </span>
                </div>
                <div style={s.calcDivider}></div>
                <div style={s.calcRow}>
                  <span style={s.calcLabel}>Total Repayable</span>
                  <span style={s.calcTotal}>
                    ₦
                    {(
                      500000 *
                      (1 + Number(settings.interest_rate) / 100)
                    ).toLocaleString()}
                  </span>
                </div>
                <div style={s.calcRow}>
                  <span style={s.calcLabel}>Monthly Payment</span>
                  <span style={s.calcTotal}>
                    ₦
                    {Math.ceil(
                      (500000 * (1 + Number(settings.interest_rate) / 100)) /
                        (durations[2]?.months || 6),
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "Arial, sans-serif",
  },
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    background: "#1f4d1f",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    zIndex: 999,
  },
  sidebar: {
    width: 240,
    background: "#1f4d1f",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
  },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "24px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  sidebarLogoIcon: {
    width: 36,
    height: 36,
    background: "#f0c050",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1f4d1f",
    fontWeight: 900,
    fontSize: 18,
  },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: "#fff" },
  sidebarLogoSub: { fontSize: 10, color: "#a8d5a8", marginTop: 1 },
  sidebarNav: { flex: 1, padding: "16px 0" },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 20px",
    color: "#a8d5a8",
    fontSize: 14,
    cursor: "pointer",
  },
  sidebarItemActive: {
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    borderLeft: "3px solid #f0c050",
  },
  sidebarIcon: { fontSize: 16 },
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  logoutBtn: {
    width: "100%",
    padding: "8px",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  main: { flex: 1, marginLeft: 240, padding: "32px" },
  header: { marginBottom: 24 },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#111",
    marginBottom: 4,
  },
  headerSub: { fontSize: 14, color: "#888" },
  error: {
    background: "#fff0f0",
    color: "#cc0000",
    padding: "12px 16px",
    borderRadius: 6,
    marginBottom: 16,
    fontSize: 13,
  },
  message: { textAlign: "center", color: "#666", padding: 40 },
  layout: { display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 },
  leftCol: { display: "flex", flexDirection: "column", gap: 20 },
  card: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 24,
  },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 4 },
  cardSub: { fontSize: 13, color: "#888", marginBottom: 20 },
  field: { marginBottom: 16, flex: 1 },
  fieldRow: { display: "flex", gap: 16 },
  label: {
    display: "block",
    fontSize: 13,
    color: "#333",
    fontWeight: 500,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 14,
    boxSizing: "border-box",
    fontFamily: "inherit",
    outline: "none",
  },
  btn: {
    width: "100%",
    padding: "12px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnDisabled: {
    width: "100%",
    padding: "12px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  addRow: { display: "flex", gap: 10, marginBottom: 16 },
  addBtn: {
    padding: "10px 20px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  listBox: { display: "flex", flexDirection: "column", gap: 8 },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    background: "#f7f5f0",
    borderRadius: 6,
  },
  listItemText: { fontSize: 14, color: "#333" },
  deleteBtn: {
    padding: "5px 12px",
    background: "#fff",
    color: "#cc0000",
    border: "1px solid #cc0000",
    borderRadius: 5,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  emptyText: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    padding: "16px 0",
  },
  rightCol: { display: "flex", flexDirection: "column", gap: 16 },
  previewCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 20,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111",
    marginBottom: 4,
  },
  previewSub: { fontSize: 12, color: "#888", marginBottom: 16 },
  previewItem: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottom: "1px solid #f0f0f0",
  },
  previewLabel: {
    fontSize: 10,
    color: "#888",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: 700,
  },
  previewValue: { fontSize: 14, fontWeight: 600, color: "#111" },
  durationTags: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 },
  durationTag: {
    background: "#f0f7ec",
    color: "#1f4d1f",
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 99,
  },
  purposeList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginTop: 4,
  },
  purposeItem: { fontSize: 13, color: "#555" },
  calcCard: { background: "#1f4d1f", borderRadius: 10, padding: 20 },
  calcTitle: { fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 },
  calcDesc: { fontSize: 12, color: "#a8d5a8", marginBottom: 16 },
  calcRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calcLabel: { fontSize: 13, color: "#a8d5a8" },
  calcValue: { fontSize: 13, color: "#fff", fontWeight: 500 },
  calcDivider: {
    height: 1,
    background: "rgba(255,255,255,0.15)",
    margin: "10px 0",
  },
  calcTotal: { fontSize: 15, fontWeight: 700, color: "#f0c050" },
};
