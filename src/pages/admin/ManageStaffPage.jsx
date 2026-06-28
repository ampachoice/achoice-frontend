import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const LOGO_PATH = "/achoice logo.png";

export default function ManageStaffPage() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    can_manage_agro: false,
    can_manage_loans: false,
  });
  const [editingStaff, setEditingStaff] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const fetchStaff = () => {
    setLoading(true);
    api
      .get("/admin/staff")
      .then((res) => setStaff(res.data.data || res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!formData.can_manage_agro && !formData.can_manage_loans) {
      showToast("Please assign at least one permission.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/admin/staff", formData);
      const tempPassword = res.data?.temp_password;
      const emailSent = res.data?.email_sent;
      const employeeId = res.data?.employee_id;
      if (tempPassword) {
        window.alert(
          `✅ Staff account created!\n\n` +
            `Employee ID: ${employeeId}\n` +
            `Temporary Password: ${tempPassword}\n\n` +
            `${
              emailSent
                ? "📧 Credentials also sent to their email."
                : "⚠️ Email failed — please share this password manually via WhatsApp."
            }\n\n` +
            `Staff must change this password on first login.`,
        );
      } else {
        showToast(
          "Staff account created! Login credentials sent to their email.",
        );
      }
      setShowForm(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        can_manage_agro: false,
        can_manage_loans: false,
      });
      fetchStaff();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) showToast(Object.values(errors)[0][0]);
      else showToast(err.response?.data?.message || "Failed to create staff.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      await api.put(`/admin/staff/${editingStaff.id}`, {
        ...editForm,
        can_manage_agro: editingStaff.can_manage_agro,
        can_manage_loans: editingStaff.can_manage_loans,
      });
      showToast("Staff details updated successfully!");
      setEditingStaff(null);
      fetchStaff();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update staff.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${staffName}?`,
      )
    )
      return;
    try {
      await api.delete(`/admin/staff/${staffId}`);
      setStaff((prev) => prev.filter((s) => s.id !== staffId));
      showToast("Staff account permanently removed.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete staff.");
    }
  };

  const handleToggleStatus = async (staffId, currentIsActive) => {
    const action = currentIsActive ? "deactivate" : "activate";
    if (
      !window.confirm(
        `${action.charAt(0).toUpperCase() + action.slice(1)} this staff member?`,
      )
    )
      return;
    try {
      await api.patch(`/admin/staff/${staffId}/${action}`);
      showToast(`Staff ${action}d successfully!`);
      setStaff((prev) =>
        prev.map((s) =>
          s.id === staffId ? { ...s, is_active: !currentIsActive } : s,
        ),
      );
    } catch (err) {
      showToast(err.response?.data?.message || `Failed to ${action} staff.`);
    }
  };

  const handleUpdatePermissions = async (staffId, permissions) => {
    try {
      await api.put(`/admin/staff/${staffId}`, permissions);
      showToast("Permissions updated successfully!");
      setStaff((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, ...permissions } : s)),
      );
    } catch {
      showToast("Failed to update permissions.");
    }
  };

  if (loading) return <div style={s.loader}>Loading Staff...</div>;

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Edit Modal */}
      {editingStaff && (
        <div style={s.modalOverlay}>
          <div style={s.modalBox}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Edit Staff — {editingStaff.name}</h3>
              <button
                style={s.modalClose}
                onClick={() => setEditingStaff(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditStaff}>
              <div style={s.modalBody}>
                <div style={s.field}>
                  <label style={s.label}>Full Name</label>
                  <input
                    style={s.input}
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    placeholder="Full name"
                    required
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Email Address</label>
                  <input
                    style={s.input}
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    placeholder="Email address"
                    required
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Phone Number</label>
                  <input
                    style={s.input}
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    placeholder="08012345678"
                  />
                </div>
                <div style={s.permissionsBox}>
                  <div style={s.permissionsTitle}>Permissions</div>
                  <div style={s.permissionsGrid}>
                    <label style={s.checkboxLabel}>
                      <input
                        type="checkbox"
                        style={s.checkbox}
                        checked={editingStaff.can_manage_agro}
                        onChange={(e) =>
                          setEditingStaff({
                            ...editingStaff,
                            can_manage_agro: e.target.checked,
                          })
                        }
                      />
                      <div>
                        <div style={s.checkboxTitle}>Agro/Sales Dashboard</div>
                        <div style={s.checkboxSub}>
                          Manage orders, inventory, reports
                        </div>
                      </div>
                    </label>
                    <label style={s.checkboxLabel}>
                      <input
                        type="checkbox"
                        style={s.checkbox}
                        checked={editingStaff.can_manage_loans}
                        onChange={(e) =>
                          setEditingStaff({
                            ...editingStaff,
                            can_manage_loans: e.target.checked,
                          })
                        }
                      />
                      <div>
                        <div style={s.checkboxTitle}>Loan Dashboard</div>
                        <div style={s.checkboxSub}>
                          Review applications, documents
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              <div style={s.modalFooter}>
                <button
                  type="button"
                  style={s.cancelBtn}
                  onClick={() => setEditingStaff(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={editSubmitting ? s.submitBtnDisabled : s.submitBtn}
                  disabled={editSubmitting}
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            { icon: "📊", label: "Dashboard", path: "/admin/dashboard" },
            { icon: "👤", label: "Buyers", path: "/admin/buyers" },
            { icon: "📋", label: "Complaints", path: "/admin/complaints" },
            { icon: "💳", label: "Payments", path: "/admin/payments" },
            { icon: "🏪", label: "Sellers", path: "/admin/sellers" },
            { icon: "🌾", label: "Products", path: "/admin/products" },
            { icon: "📦", label: "Orders", path: "/admin/orders" },
            { icon: "💰", label: "Loans", path: "/admin/loans" },
            { icon: "👥", label: "Staff", path: "/admin/staff", active: true },
            {
              icon: "⚙️",
              label: "Loan Settings",
              path: "/admin/loan-settings",
            },
            {
              icon: "🚚",
              label: "Delivery Zones",
              path: "/admin/delivery-zones",
            },
            { icon: "📈", label: "Reports", path: "/admin/reports" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...s.sidebarItem,
                ...(item.active ? s.sidebarItemActive : {}),
              }}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
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
          <div>
            <h1 style={s.headerTitle}>Staff Management</h1>
            <p style={s.headerSub}>{staff.length} staff members</p>
          </div>
          <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Add Staff"}
          </button>
        </div>

        {/* Add Staff Form */}
        {showForm && (
          <div style={s.formCard}>
            <h3 style={s.formTitle}>Create Staff Account</h3>
            <p style={s.formSub}>
              A temporary password will be generated and shown to you after
              creation. It will also be sent to the staff email automatically.
            </p>
            <form onSubmit={handleAddStaff}>
              <div style={s.formGrid}>
                <div style={s.field}>
                  <label style={s.label}>Full Name</label>
                  <input
                    style={s.input}
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Staff full name"
                    required
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Email Address</label>
                  <input
                    style={s.input}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="Email address"
                    required
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Phone Number</label>
                  <input
                    style={s.input}
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="08012345678"
                    required
                  />
                </div>
              </div>

              <div style={s.permissionsBox}>
                <div style={s.permissionsTitle}>
                  Dashboard Access Permissions
                </div>
                <div style={s.permissionsGrid}>
                  <label style={s.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="can_manage_agro"
                      checked={formData.can_manage_agro}
                      onChange={handleFormChange}
                      style={s.checkbox}
                    />
                    <div>
                      <div style={s.checkboxTitle}>Agro/Sales Dashboard</div>
                      <div style={s.checkboxSub}>
                        Manage orders, inventory, stock levels, sales reports
                      </div>
                    </div>
                  </label>
                  <label style={s.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="can_manage_loans"
                      checked={formData.can_manage_loans}
                      onChange={handleFormChange}
                      style={s.checkbox}
                    />
                    <div>
                      <div style={s.checkboxTitle}>Loan Dashboard</div>
                      <div style={s.checkboxSub}>
                        Review applications, verify documents, manage repayments
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                style={submitting ? s.submitBtnDisabled : s.submitBtn}
                disabled={submitting}
              >
                {submitting ? "Creating Account..." : "Create Staff Account"}
              </button>
            </form>
          </div>
        )}

        {/* Staff List */}
        {staff.length === 0 ? (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>👥</div>
            <h3 style={s.emptyTitle}>No staff yet</h3>
            <p style={s.emptyText}>
              Add your first staff member to get started.
            </p>
          </div>
        ) : (
          <div style={s.staffGrid}>
            {staff.map((member) => {
              const isActive = member.is_active === true;
              return (
                <div key={member.id} style={s.staffCard}>
                  {/* Card Header */}
                  <div style={s.staffCardHeader}>
                    <div style={s.staffAvatar}>
                      {member.name?.charAt(0).toUpperCase() || "S"}
                    </div>
                    <div style={s.staffInfo}>
                      <div style={s.staffName}>{member.name}</div>
                      <div style={s.staffEmail}>{member.email}</div>
                      <div style={s.staffPhone}>{member.phone || "—"}</div>
                      <div style={s.employeeId}>{member.employee_id}</div>
                    </div>
                    <div
                      style={{
                        ...s.statusBadge,
                        background: isActive ? "#eafaf0" : "#fff0f0",
                        color: isActive ? "#1a7a3a" : "#cc0000",
                      }}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </div>
                  </div>

                  {/* Permissions Display */}
                  <div style={s.permsRow}>
                    <div style={s.permsLabel}>Permissions:</div>
                    <div style={s.permsTags}>
                      {member.can_manage_agro && (
                        <span style={s.permTag}>Agro/Sales</span>
                      )}
                      {member.can_manage_loans && (
                        <span
                          style={{
                            ...s.permTag,
                            background: "#e7f0ff",
                            color: "#1a4fa0",
                          }}
                        >
                          Loans
                        </span>
                      )}
                      {!member.can_manage_agro && !member.can_manage_loans && (
                        <span
                          style={{
                            ...s.permTag,
                            background: "#f0f0f0",
                            color: "#888",
                          }}
                        >
                          None
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Permission Edit */}
                  <div style={s.editPerms}>
                    <div style={s.editPermsTitle}>Quick Permission Edit</div>
                    <div style={s.editPermsRow}>
                      <label style={s.miniCheckLabel}>
                        <input
                          type="checkbox"
                          defaultChecked={member.can_manage_agro}
                          id={`agro-${member.id}`}
                        />
                        Agro/Sales
                      </label>
                      <label style={s.miniCheckLabel}>
                        <input
                          type="checkbox"
                          defaultChecked={member.can_manage_loans}
                          id={`loans-${member.id}`}
                        />
                        Loans
                      </label>
                      <button
                        style={s.savePermsBtn}
                        onClick={() =>
                          handleUpdatePermissions(member.id, {
                            can_manage_agro: document.getElementById(
                              `agro-${member.id}`,
                            ).checked,
                            can_manage_loans: document.getElementById(
                              `loans-${member.id}`,
                            ).checked,
                          })
                        }
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={s.cardActions}>
                    <button
                      style={s.viewBtn}
                      onClick={() =>
                        navigate(
                          `/staff/${member.can_manage_loans ? "loans" : "agro"}`,
                        )
                      }
                    >
                      View Dashboard
                    </button>
                    <button
                      style={s.editBtn}
                      onClick={() => {
                        setEditingStaff(member);
                        setEditForm({
                          name: member.name,
                          email: member.email,
                          phone: member.phone || "",
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      style={isActive ? s.deactivateBtn : s.activateBtn}
                      onClick={() => handleToggleStatus(member.id, isActive)}
                    >
                      {isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      style={s.deleteBtn}
                      onClick={() => handleDeleteStaff(member.id, member.name)}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Last Login / Member Since */}
                  <div style={s.memberSince}>
                    {member.last_login
                      ? `Last login: ${new Date(member.last_login).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}`
                      : `Member since ${new Date(member.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "long" })}`}
                  </div>
                </div>
              );
            })}
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
  loader: {
    textAlign: "center",
    padding: 100,
    fontSize: 18,
    color: "#1f4d1f",
    fontWeight: 600,
  },
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    background: "#1f4d1f",
    color: "#fff",
    padding: "14px 28px",
    borderRadius: 8,
    zIndex: 9999,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    background: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 520,
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #eee",
  },
  modalTitle: { fontSize: 16, fontWeight: 700, color: "#111", margin: 0 },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#888",
  },
  modalBody: {
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    padding: "16px 24px",
    borderTop: "1px solid #eee",
  },
  cancelBtn: {
    padding: "10px 20px",
    background: "#f5f5f5",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: "inherit",
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
    padding: 20,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  logoImg: { width: 40, height: 40, objectFit: "contain" },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: "#fff" },
  sidebarLogoSub: { fontSize: 10, color: "#a8d5a8" },
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
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  logoutBtn: {
    width: "100%",
    padding: 8,
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  main: { flex: 1, marginLeft: 240, padding: 32 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#111",
    marginBottom: 4,
  },
  headerSub: { fontSize: 14, color: "#888" },
  addBtn: {
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    fontFamily: "inherit",
  },
  formCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8e4dc",
    padding: 28,
    marginBottom: 28,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1f4d1f",
    margin: "0 0 6px",
  },
  formSub: { fontSize: 13, color: "#888", marginBottom: 24, lineHeight: 1.6 },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 16,
    marginBottom: 20,
  },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 12, fontWeight: 600, color: "#444" },
  input: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 7,
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
  },
  permissionsBox: {
    background: "#f7f5f0",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  permissionsTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#333",
    marginBottom: 14,
  },
  permissionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e8e4dc",
    cursor: "pointer",
  },
  checkbox: { marginTop: 2, width: 16, height: 16, flexShrink: 0 },
  checkboxTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#111",
    marginBottom: 3,
  },
  checkboxSub: { fontSize: 11, color: "#888" },
  submitBtn: {
    width: "100%",
    padding: 13,
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  submitBtnDisabled: {
    width: "100%",
    padding: 13,
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  emptyBox: {
    background: "#fff",
    borderRadius: 12,
    border: "2px dashed #c5ddb8",
    padding: "60px 0",
    textAlign: "center",
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#666" },
  staffGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 },
  staffCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8e4dc",
    padding: 20,
  },
  staffCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  staffAvatar: {
    width: 44,
    height: 44,
    background: "#1f4d1f",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f0c050",
    fontWeight: 700,
    fontSize: 18,
    flexShrink: 0,
  },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 2 },
  staffEmail: { fontSize: 12, color: "#888", marginBottom: 2 },
  staffPhone: { fontSize: 12, color: "#888", marginBottom: 2 },
  employeeId: { fontSize: 10, color: "#aaa", fontFamily: "monospace" },
  statusBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 99,
    flexShrink: 0,
  },
  permsRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14 },
  permsLabel: { fontSize: 12, color: "#888" },
  permsTags: { display: "flex", gap: 6, flexWrap: "wrap" },
  permTag: {
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 6,
    background: "#eafaf0",
    color: "#1a7a3a",
  },
  editPerms: {
    background: "#f7f5f0",
    borderRadius: 8,
    padding: "12px 14px",
    marginBottom: 14,
  },
  editPermsTitle: {
    fontSize: 11,
    color: "#888",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  editPermsRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  miniCheckLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#333",
    cursor: "pointer",
  },
  savePermsBtn: {
    padding: "5px 12px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  cardActions: { display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" },
  viewBtn: {
    flex: 1,
    padding: "8px 0",
    background: "#f0f7ec",
    color: "#1f4d1f",
    border: "1px solid #a8d5a8",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "inherit",
    textAlign: "center",
  },
  editBtn: {
    padding: "8px 12px",
    background: "#e7f0ff",
    color: "#1a4fa0",
    border: "1px solid #b3d0ff",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "inherit",
  },
  activateBtn: {
    padding: "8px 12px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "inherit",
  },
  deactivateBtn: {
    padding: "8px 12px",
    background: "#fff8e7",
    color: "#b36b00",
    border: "1px solid #f0c050",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "inherit",
  },
  deleteBtn: {
    padding: "8px 12px",
    background: "#fff0f0",
    color: "#cc0000",
    border: "1px solid #ffa39e",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "inherit",
  },
  memberSince: { fontSize: 11, color: "#aaa", textAlign: "center" },
};
