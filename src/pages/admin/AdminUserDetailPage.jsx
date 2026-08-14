import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import PasswordConfirmModal from "../../components/common/PasswordConfirmModal";
import api from "../../services/api";
import {
  getUserFullProfile,
  suspendUserAccount,
  activateUserAccount,
  banUserAccount,
  restrictUserAccount,
} from "../../services/adminService";

const ROLE_COLORS = {
  buyer: { bg: "#eaf2fb", color: "#1a5fa8" },
  seller: { bg: "#e6f4ea", color: "#1f4d1f" },
  staff: { bg: "#fff4de", color: "#a86a00" },
  admin: { bg: "#eee6fb", color: "#5a1aa8" },
};
const STATUS_COLORS = {
  active: { bg: "#e6f4ea", color: "#1f4d1f" },
  suspended: { bg: "#fbe9e9", color: "#a81f1f" },
  closed: { bg: "#f0f0f0", color: "#555" },
};

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [acting, setActing] = useState(false);
  const [showRestrict, setShowRestrict] = useState(false);
  const [restrictOrders, setRestrictOrders] = useState(false);
  const [restrictLoans, setRestrictLoans] = useState(false);
  const [restrictReason, setRestrictReason] = useState("");

  // Close / Reopen account — Phase 5
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenName, setReopenName] = useState("");
  const [reopenEmail, setReopenEmail] = useState("");
  const [reopenReason, setReopenReason] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const load = () => {
    setLoading(true);
    getUserFullProfile(id)
      .then((res) => {
        setUser(res.data);
        setRestrictOrders(!!res.data.restrict_orders);
        setRestrictLoans(!!res.data.restrict_loans);
        setRestrictReason(res.data.restrict_reason || "");
      })
      .catch(() => showToast("Failed to load this user."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const runAction = async (fn, successMsg) => {
    setActing(true);
    try {
      await fn();
      showToast(successMsg);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Action failed.");
    } finally {
      setActing(false);
    }
  };

  const handleSuspend = () => runAction(() => suspendUserAccount(id), "User suspended.");
  const handleActivate = () => runAction(() => activateUserAccount(id), "User activated.");
  // Opens the password-confirm modal instead of banning directly --
  // window.confirm() previously fired the request immediately with no
  // password check, which no longer matches the backend's requirement.
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const handleBan = () => setShowBanConfirm(true);

  // Deliberately NOT using runAction here -- runAction swallows errors
  // internally (shows a toast, never rethrows), which would make
  // PasswordConfirmModal think a wrong-password attempt succeeded and
  // close itself. This mirrors runAction's success behavior (toast +
  // reload) but lets failures propagate so the modal can show the
  // backend's 403/422 message inline and stay open.
  const handleConfirmBan = async (password) => {
    setActing(true);
    try {
      await banUserAccount(id, { password });
      showToast("User banned.");
      setShowBanConfirm(false);
      load();
    } finally {
      setActing(false);
    }
  };
  const handleSaveRestrictions = () =>
    runAction(
      () => restrictUserAccount(id, { restrict_orders: restrictOrders, restrict_loans: restrictLoans, reason: restrictReason }),
      "Restrictions updated."
    ).then(() => setShowRestrict(false));

  // NOTE: not yet in adminService.js since it wasn't available to add to —
  // calling api directly here. Move into adminService.js alongside the
  // other account actions above if you want full consistency.
  const handleCloseAccount = () => {
    if (closeReason.trim().length < 10) {
      showToast("Reason must be at least 10 characters.");
      return;
    }
    runAction(
      () => api.post(`/admin/users/${id}/close`, { reason: closeReason }),
      "Account closed."
    ).then(() => {
      setShowCloseModal(false);
      setCloseReason("");
    });
  };

  const handleReopenAccount = () => {
    if (!reopenName.trim() || !reopenEmail.trim()) {
      showToast("Name and email are required to reopen this account.");
      return;
    }
    runAction(
      () =>
        api.post(`/admin/users/${id}/reopen`, {
          name: reopenName,
          email: reopenEmail,
          reason: reopenReason,
        }),
      "Account reopened."
    ).then(() => {
      setShowReopenModal(false);
      setReopenName("");
      setReopenEmail("");
      setReopenReason("");
    });
  };

  if (loading) {
    return (
      <AdminLayout title="User Details">
        <div style={s.emptyState}>Loading user...</div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="User Details">
        <div style={s.emptyState}>User not found.</div>
      </AdminLayout>
    );
  }

  const roleColors = ROLE_COLORS[user.role] || { bg: "#eee", color: "#555" };
  const statusColors = STATUS_COLORS[user.status] || { bg: "#eee", color: "#555" };

  return (
    <>
    <AdminLayout
      title={user.name && user.name !== user.email ? user.name : user.email}
      subtitle={`User ID: ${user.id}`}
      headerActions={
        <button style={s.backBtn} onClick={() => navigate(-1)}>← Back</button>
      }
    >
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Summary strip */}
      <div style={s.summaryCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={s.avatar}>{(user.name && user.name !== user.email ? user.name : user.email || "?").charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{user.name && user.name !== user.email ? user.name : user.email}</div>
            <div style={{ fontSize: 12.5, color: "#888", marginTop: 2 }}>
              Registered {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ ...s.badge, background: roleColors.bg, color: roleColors.color }}>{user.role}</span>
          <span style={{ ...s.badge, background: statusColors.bg, color: statusColors.color }}>{user.status}</span>
        </div>
      </div>

      {(!!user.restrict_orders || !!user.restrict_loans) && (
        <div style={s.restrictBanner}>
          ⚠️ Restricted from: {[user.restrict_orders && "placing orders", user.restrict_loans && "applying for loans"].filter(Boolean).join(" and ")}.
          {user.restrict_reason && <div style={{ marginTop: 4, fontSize: 12 }}>Reason: {user.restrict_reason}</div>}
        </div>
      )}

      <div style={s.grid}>
        {/* Registration details */}
        <div style={s.card}>
          <div style={s.cardTitle}>Registration Details</div>
          <Detail label="Full Name" value={user.name && user.name !== user.email ? user.name : "—"} />
          <Detail label="Email" value={user.email} />
          <Detail label="Phone" value={user.phone} />
          <Detail label="Address" value={user.address} />
          <Detail label="State" value={user.state} />
          <Detail label="Role" value={user.role} />
        </div>

        {/* Bank account details — pulled from user's most recent loan application */}
        {user.bank_details && (
          <div style={s.card}>
            <div style={s.cardTitle}>🏦 Bank Account Details</div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>
              From most recent loan application
            </div>
            <Detail label="Bank Name"       value={user.bank_details.bank_name} />
            <Detail label="Account Number"  value={user.bank_details.account_number} />
            <Detail label="Account Name"    value={user.bank_details.account_name} />
          </div>
        )}

        {/* Seller-specific */}
        {user.role === "seller" && user.seller && (
          <div style={s.card}>
            <div style={s.cardTitle}>Store Details</div>
            <Detail label="Business Name" value={user.seller.business_name} />
            <Detail label="Business Address" value={user.seller.business_address} />
            <Detail label="LGA" value={user.seller.lga} />
            <Detail label="Store Status" value={user.seller.status} />
            <Detail label="Rating" value={user.seller.rating ? `★ ${Number(user.seller.rating).toFixed(1)}` : null} />
            <Detail label="Total Sales" value={user.seller.total_sales} />
            <Detail label="Description" value={user.seller.description} />
            <div style={s.cardSubTitle}>Bank Details</div>
            <Detail label="Bank Name" value={user.seller.bank_name} />
            <Detail label="Account Number" value={user.seller.account_number} />
            <Detail label="Account Name" value={user.seller.account_name} />
            <Detail label="Balance" value={user.seller.earnings_balance != null ? `₦${Number(user.seller.earnings_balance).toLocaleString()}` : null} />
            <Detail label="Total Remitted" value={user.seller.total_remitted != null ? `₦${Number(user.seller.total_remitted).toLocaleString()}` : null} />
            {user.seller.bank_details_frozen && (
              <div style={s.frozenNote}>🔒 Bank details frozen — {user.seller.bank_freeze_reason || "no reason given"}.</div>
            )}
          </div>
        )}

        {/* Staff-specific */}
        {user.role === "staff" && (user.staffProfile || user.staff_profile) && (() => {
          const sp = user.staffProfile || user.staff_profile;
          return (
          <div style={s.card}>
            <div style={s.cardTitle}>Staff Details</div>
            <Detail label="Employee ID" value={sp.employee_id} />
            <Detail label="Department" value={sp.department} />
            <Detail label="Can Manage Agro" value={sp.can_manage_agro ? "Yes" : "No"} />
            <Detail label="Can Manage Loans" value={sp.can_manage_loans ? "Yes" : "No"} />
            <Detail label="Active" value={sp.is_active ? "Yes" : "No"} />
            <Detail
              label="Last Login"
              value={sp.last_login_at ? new Date(sp.last_login_at).toLocaleString() : "Never"}
            />
          </div>
          );
        })()}

        {/* Account actions */}
        <div style={s.card}>
          <div style={s.cardTitle}>Account Actions</div>
          <div style={s.actionsCol}>
            {user.status === "active" ? (
              <button style={s.actionBtnWarn} disabled={acting} onClick={handleSuspend}>Suspend Account</button>
            ) : user.status !== "closed" ? (
              <button style={s.actionBtnGood} disabled={acting} onClick={handleActivate}>Activate Account</button>
            ) : null}
            {user.status !== "closed" && (
              <button style={s.actionBtnNeutral} disabled={acting} onClick={() => setShowRestrict(true)}>
                Manage Restrictions
              </button>
            )}
            {user.status !== "closed" && (
              <button style={s.actionBtnDanger} disabled={acting} onClick={handleBan}>Ban Permanently</button>
            )}

            {/* Close / Reopen — admins can't close other admin accounts */}
            {user.role === "admin" ? (
              <div style={{ fontSize: 12, color: "#888", padding: "8px 2px" }}>
                Admin accounts cannot be closed from here.
              </div>
            ) : user.status === "closed" ? (
              <button style={s.actionBtnGood} disabled={acting} onClick={() => setShowReopenModal(true)}>
                Reopen Account
              </button>
            ) : (
              <button style={s.actionBtnDanger} disabled={acting} onClick={() => setShowCloseModal(true)}>
                Close Account
              </button>
            )}
          </div>
        </div>
      </div>

      {showRestrict && (
        <div style={s.modalOverlay} onClick={() => setShowRestrict(false)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.cardTitle}>Manage Restrictions</div>
            <label style={s.checkboxRow}>
              <input type="checkbox" checked={restrictOrders} onChange={(e) => setRestrictOrders(e.target.checked)} />
              Restrict from placing orders
            </label>
            <label style={s.checkboxRow}>
              <input type="checkbox" checked={restrictLoans} onChange={(e) => setRestrictLoans(e.target.checked)} />
              Restrict from applying for loans
            </label>
            <div style={s.editField}>
              <label style={s.editLabel}>Reason (optional)</label>
              <textarea
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 7, fontSize: 13, fontFamily: "inherit", minHeight: 60, boxSizing: "border-box" }}
                value={restrictReason}
                onChange={(e) => setRestrictReason(e.target.value)}
              />
            </div>
            <div style={s.modalActions}>
              <button style={s.actionBtnNeutral} onClick={() => setShowRestrict(false)}>Cancel</button>
              <button style={s.actionBtnGood} disabled={acting} onClick={handleSaveRestrictions}>
                {acting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div style={s.modalOverlay} onClick={() => setShowCloseModal(false)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.cardTitle}>Close {user.name}'s Account</div>
            <p style={{ fontSize: 12.5, color: "#a81f1f", background: "#fbe9e9", padding: "10px 12px", borderRadius: 7, marginBottom: 14 }}>
              This anonymizes the user's personal data. Their order/loan history stays intact, but this cannot
              be undone from their side — only an admin can reopen it, and reopening requires re-entering
              their real name and email since that data won't be recoverable from our records.
            </p>
            <div style={s.editField}>
              <label style={s.editLabel}>Reason * (minimum 10 characters)</label>
              <textarea
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 7, fontSize: 13, fontFamily: "inherit", minHeight: 70, boxSizing: "border-box" }}
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="e.g. Repeated policy violations after two prior warnings..."
              />
              <div style={{ fontSize: 11, color: closeReason.trim().length < 10 ? "#a81f1f" : "#1a7a3a", marginTop: 4 }}>
                {closeReason.trim().length}/10 minimum
              </div>
            </div>
            <div style={s.modalActions}>
              <button style={s.actionBtnNeutral} onClick={() => setShowCloseModal(false)}>Cancel</button>
              <button
                style={s.actionBtnDanger}
                disabled={acting || closeReason.trim().length < 10}
                onClick={handleCloseAccount}
              >
                {acting ? "Closing..." : "Close Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReopenModal && (
        <div style={s.modalOverlay} onClick={() => setShowReopenModal(false)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.cardTitle}>Reopen This Account</div>
            <p style={{ fontSize: 12.5, color: "#7a5000", background: "#fff8e7", padding: "10px 12px", borderRadius: 7, marginBottom: 14 }}>
              This user's name and email were anonymized when their account was closed and can't be recovered
              from our records — enter their real details to restore the account.
            </p>
            <div style={s.editField}>
              <label style={s.editLabel}>Real Name *</label>
              <input
                type="text"
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 7, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                value={reopenName}
                onChange={(e) => setReopenName(e.target.value)}
              />
            </div>
            <div style={s.editField}>
              <label style={s.editLabel}>Real Email *</label>
              <input
                type="email"
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 7, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                value={reopenEmail}
                onChange={(e) => setReopenEmail(e.target.value)}
              />
            </div>
            <div style={s.editField}>
              <label style={s.editLabel}>Reason (optional)</label>
              <textarea
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 7, fontSize: 13, fontFamily: "inherit", minHeight: 60, boxSizing: "border-box" }}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
              />
            </div>
            <div style={s.modalActions}>
              <button style={s.actionBtnNeutral} onClick={() => setShowReopenModal(false)}>Cancel</button>
              <button
                style={s.actionBtnGood}
                disabled={acting || !reopenName.trim() || !reopenEmail.trim()}
                onClick={handleReopenAccount}
              >
                {acting ? "Reopening..." : "Reopen Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>

      <PasswordConfirmModal
        open={showBanConfirm}
        title="Ban User Permanently"
        description={
          user
            ? `This will permanently ban ${user.name} and revoke all their active sessions immediately. This action cannot be undone. Enter your password to confirm.`
            : "Enter your password to confirm."
        }
        confirmLabel="Ban Permanently"
        danger
        onConfirm={handleConfirmBan}
        onCancel={() => setShowBanConfirm(false)}
      />
    </>
  );
}

function Detail({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid #f5f3ee", fontSize: 13 }}>
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ color: "#111", fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

const s = {
  toast: { position: "fixed", top: 20, right: 20, background: "#1f4d1f", color: "#fff", padding: "12px 20px", borderRadius: 8, fontSize: 13, zIndex: 999, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" },
  emptyState: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, padding: 48, textAlign: "center", color: "#888", fontSize: 14 },
  backBtn: { padding: "10px 18px", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  summaryCard: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: "18px 22px", marginBottom: 16 },
  avatar: { width: 50, height: 50, borderRadius: "50%", background: "#1f4d1f", color: "#fff", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  badge: { fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, textTransform: "capitalize", height: "fit-content" },
  restrictBanner: { background: "#fff8e7", border: "1px solid #f0c050", color: "#7a5000", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  card: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: 22 },
  cardTitle: { fontSize: 14.5, fontWeight: 700, color: "#111", marginBottom: 12 },
  cardSubTitle: { fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 14, marginBottom: 8 },
  frozenNote: { fontSize: 11.5, color: "#a86a00", background: "#fff8e7", borderRadius: 6, padding: "8px 10px", marginTop: 10 },
  actionsCol: { display: "flex", flexDirection: "column", gap: 10 },
  actionBtnWarn: { padding: "11px 16px", background: "#fff8e7", color: "#a86a00", border: "1px solid #f0c050", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  actionBtnGood: { padding: "11px 16px", background: "#1f4d1f", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  actionBtnNeutral: { padding: "11px 16px", background: "#fff", color: "#555", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  actionBtnDanger: { padding: "11px 16px", background: "#fff", color: "#a81f1f", border: "1px solid #f3b3b3", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 },
  modalBox: { background: "#fff", borderRadius: 14, padding: 26, width: "100%", maxWidth: 420 },
  checkboxRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#333", marginBottom: 12, cursor: "pointer" },
  editField: { marginBottom: 14 },
  editLabel: { display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 6 },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 },
};