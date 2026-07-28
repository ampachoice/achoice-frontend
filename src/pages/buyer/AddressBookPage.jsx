import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const EMPTY_FORM = {
  label: "Home", full_address: "", state: "", lga: "", phone: "",
};

export default function AddressBookPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // address object being edited
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState("");
  const [formError, setFormError] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchAddresses = () => {
    setLoading(true);
    api
      .get("/addresses")
      .then((res) => setAddresses(res.data?.data || res.data || []))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAddresses(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setEditing(addr);
    setForm({
      label: addr.label || "Home",
      full_address: addr.full_address || "",
      state: addr.state || "",
      lga: addr.lga || "",
      phone: addr.phone || "",
    });
    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_address.trim()) { setFormError("Address is required."); return; }
    if (!form.state) { setFormError("State is required."); return; }
    setBusy(true);
    setFormError("");
    try {
      if (editing) {
        await api.put(`/addresses/${editing.id}`, form);
        showToast("Address updated");
      } else {
        await api.post("/addresses", form);
        showToast("Address added");
      }
      setShowForm(false);
      fetchAddresses();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save address.");
    } finally {
      setBusy(false);
    }
  };

  const handleMakeDefault = async (addr) => {
    try {
      await api.patch(`/addresses/${addr.id}/default`);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === addr.id }))
      );
      showToast(`"${addr.label}" set as default`);
    } catch {
      showToast("Failed to update default");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await api.delete(`/addresses/${deleteTarget.id}`);
      showToast("Address deleted");
      setDeleteTarget(null);
      fetchAddresses();
    } catch {
      showToast("Failed to delete address");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9f7f3", fontFamily: "inherit" }}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLeft} onClick={() => navigate("/")}>
          <img src="/achoice logo.png" alt="Achoice" style={s.navLogo} />
          <span style={s.navName}>ACHOICE <span style={{ color: "#f0c050" }}>LIMITED</span></span>
        </div>
        <button style={s.navBack} onClick={() => navigate(-1)}>← Back</button>
      </nav>

      <div style={s.container}>
        <div style={s.pageHeader}>
          <div>
            <div style={s.pageTitle}>📍 Address Book</div>
            <div style={s.pageSub}>Manage your delivery addresses</div>
          </div>
          <button style={s.addBtn} onClick={openAdd}>+ Add Address</button>
        </div>

        {loading ? (
          <div style={s.center}>Loading addresses...</div>
        ) : addresses.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>📭</div>
            <div style={s.emptyTitle}>No saved addresses</div>
            <p style={s.emptySub}>Add an address to speed up checkout.</p>
            <button style={s.addBtn} onClick={openAdd}>+ Add Your First Address</button>
          </div>
        ) : (
          <div style={s.list}>
            {addresses.map((addr) => (
              <div key={addr.id} style={{
                ...s.card,
                ...(addr.is_default ? s.cardDefault : {}),
              }}>
                <div style={s.cardTop}>
                  <div style={s.cardLabel}>
                    {addr.label || "Home"}
                    {addr.is_default && <span style={s.defaultBadge}>Default</span>}
                  </div>
                  <div style={s.cardActions}>
                    {!addr.is_default && (
                      <button style={s.actionBtn} onClick={() => handleMakeDefault(addr)}>
                        Set Default
                      </button>
                    )}
                    <button style={s.actionBtn} onClick={() => openEdit(addr)}>Edit</button>
                    <button style={{ ...s.actionBtn, color: "#cc0000" }}
                      onClick={() => setDeleteTarget(addr)}>
                      Delete
                    </button>
                  </div>
                </div>
                <div style={s.cardAddress}>{addr.full_address}</div>
                <div style={s.cardMeta}>
                  {addr.state}{addr.lga ? `, ${addr.lga}` : ""}
                  {addr.phone ? ` · 📞 ${addr.phone}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit form modal */}
      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>{editing ? "Edit Address" : "Add New Address"}</div>
              <button style={s.modalClose} onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={s.field}>
                <label style={s.label}>Label</label>
                <div style={s.labelPills}>
                  {["Home", "Office", "Other"].map((l) => (
                    <button
                      key={l}
                      type="button"
                      style={form.label === l ? s.pillActive : s.pill}
                      onClick={() => setForm({ ...form, label: l })}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Full Address *</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="House number, street name, landmark..."
                  value={form.full_address}
                  onChange={(e) => setForm({ ...form, full_address: e.target.value })}
                  required
                />
              </div>

              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.label}>State *</label>
                  <select
                    style={s.input}
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    required
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
                    type="text"
                    placeholder="e.g. Ikeja"
                    value={form.lga}
                    onChange={(e) => setForm({ ...form, lga: e.target.value })}
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>
                  Delivery Phone{" "}
                  <span style={{ color: "#aaa", fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  style={s.input}
                  type="tel"
                  placeholder="Phone number for delivery contact"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              {formError && <div style={s.formError}>{formError}</div>}

              <div style={s.modalActions}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" style={busy ? s.submitBtnDisabled : s.submitBtn} disabled={busy}>
                  {busy ? "Saving..." : editing ? "Save Changes" : "Add Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div style={s.overlay} onClick={() => setDeleteTarget(null)}>
          <div style={{ ...s.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>Delete Address</div>
              <button style={s.modalClose} onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <p style={{ fontSize: 14, color: "#555", marginBottom: 20 }}>
              Remove <strong>"{deleteTarget.label}"</strong> ({deleteTarget.full_address})?
              {deleteTarget.is_default && (
                <span style={{ color: "#f57c00", display: "block", marginTop: 8 }}>
                  ⚠️ This is your default address — the next most recent address will become default.
                </span>
              )}
            </p>
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                style={busy ? s.submitBtnDisabled : { ...s.submitBtn, background: "#cc0000" }}
                onClick={handleDelete}
                disabled={busy}
              >
                {busy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  toast: {
    position: "fixed", top: 20, right: 20, background: "#1f4d1f", color: "#fff",
    padding: "12px 24px", borderRadius: 8, fontSize: 14, zIndex: 9999,
  },
  nav: {
    background: "#1f4d1f", padding: "12px 40px", display: "flex",
    alignItems: "center", justifyContent: "space-between",
    position: "sticky", top: 0, zIndex: 100,
  },
  navLeft: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  navLogo: { width: 32, height: 32, objectFit: "contain" },
  navName: { fontSize: 15, fontWeight: 700, color: "#fff" },
  navBack: {
    background: "none", border: "1px solid rgba(255,255,255,0.4)", color: "#fff",
    padding: "8px 16px", borderRadius: 7, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
  },
  container: { maxWidth: 700, margin: "0 auto", padding: "32px 20px" },
  pageHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 28, flexWrap: "wrap", gap: 12,
  },
  pageTitle: { fontSize: 24, fontWeight: 700, color: "#111" },
  pageSub: { fontSize: 13, color: "#888", marginTop: 2 },
  addBtn: {
    padding: "10px 20px", background: "#1f4d1f", color: "#fff", border: "none",
    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  center: { textAlign: "center", padding: "60px 20px", color: "#888" },
  empty: { textAlign: "center", padding: "60px 20px" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "#333", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#888", marginBottom: 20 },
  list: { display: "flex", flexDirection: "column", gap: 14 },
  card: {
    background: "#fff", borderRadius: 12, border: "1px solid #e8e4dc", padding: "18px 20px",
  },
  cardDefault: { border: "2px solid #1f4d1f" },
  cardTop: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 8, flexWrap: "wrap", gap: 8,
  },
  cardLabel: { fontSize: 15, fontWeight: 700, color: "#111", display: "flex", alignItems: "center", gap: 8 },
  defaultBadge: {
    fontSize: 11, fontWeight: 700, background: "#eafaf0", color: "#1a7a3a",
    padding: "2px 10px", borderRadius: 99,
  },
  cardActions: { display: "flex", gap: 12 },
  actionBtn: {
    background: "none", border: "none", fontSize: 13, color: "#1f4d1f",
    cursor: "pointer", fontFamily: "inherit", fontWeight: 600, padding: 0,
  },
  cardAddress: { fontSize: 14, color: "#333", marginBottom: 4 },
  cardMeta: { fontSize: 12, color: "#888" },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  modal: {
    background: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 500,
    maxHeight: "90vh", overflowY: "auto",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: 700, color: "#111" },
  modalClose: {
    background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#888", padding: 0,
  },
  field: { marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6 },
  labelPills: { display: "flex", gap: 8 },
  pill: {
    padding: "7px 16px", background: "#f0f0f0", border: "1.5px solid #ddd",
    borderRadius: 99, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
  },
  pillActive: {
    padding: "7px 16px", background: "#eafaf0", border: "1.5px solid #1f4d1f",
    borderRadius: 99, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
    fontWeight: 600, color: "#1f4d1f",
  },
  input: {
    width: "100%", padding: "11px 14px", border: "1.5px solid #ddd", borderRadius: 8,
    fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none",
  },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  formError: { color: "#cc0000", fontSize: 13, marginBottom: 12 },
  modalActions: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 },
  cancelBtn: {
    padding: "10px 20px", background: "#f0f0f0", color: "#333", border: "none",
    borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  submitBtn: {
    padding: "10px 20px", background: "#1f4d1f", color: "#fff", border: "none",
    borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  submitBtnDisabled: {
    padding: "10px 20px", background: "#aaa", color: "#fff", border: "none",
    borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "not-allowed", fontFamily: "inherit",
  },
};