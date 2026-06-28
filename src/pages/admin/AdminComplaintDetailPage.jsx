import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import NotificationBell from "../../components/buyer/NotificationBell";

const LOGO_PATH = "/achoice logo.png";

export default function AdminComplaintDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const bottomRef = useRef(null);

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [action, setAction] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const fetchComplaint = async () => {
    try {
      const res = await api.get(`/admin/complaints/${id}`);
      setComplaint(res.data.complaint || res.data);
    } catch {
      showToast("Failed to load complaint.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [complaint?.messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const payload = new FormData();
      payload.append("message", newMessage);
      if (action) payload.append("action", action);
      await api.post(`/admin/complaints/${id}/messages`, payload);
      setNewMessage("");
      setAction("");
      fetchComplaint();
      showToast("Message sent!");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await api.patch(`/admin/complaints/${id}/status`, { status: newStatus });
      fetchComplaint();
      showToast("Status updated!");
    } catch {
      showToast("Failed to update status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusStyle = (status) =>
    ({
      pending: { background: "#fff8e7", color: "#b36b00" },
      under_review: { background: "#e7f0ff", color: "#1a4fa0" },
      resolved: { background: "#eafaf0", color: "#1a7a3a" },
      rejected: { background: "#fff0f0", color: "#cc0000" },
    })[status] || { background: "#f0f0f0", color: "#555" };

  const isCancellation = complaint?.type === "cancellation_request";
  const canAction =
    isCancellation && ["pending", "under_review"].includes(complaint?.status);

  return (
    <>
      <style>{`
        .acd-shell { display:flex; min-height:100vh; background:#f0f2f5; font-family:'Segoe UI',sans-serif; }
        .acd-sidebar { width:240px; background:#1f4d1f; display:flex; flex-direction:column; position:fixed; top:0; left:0; height:100vh; }
        .acd-sidebar-logo { display:flex; align-items:center; gap:10px; padding:20px; border-bottom:1px solid rgba(255,255,255,0.1); }
        .acd-sidebar-logo img { width:40px; height:40px; object-fit:contain; }
        .acd-sidebar-name { font-size:14px; font-weight:700; color:#fff; }
        .acd-sidebar-sub { font-size:10px; color:#a8d5a8; }
        .acd-sidebar-nav { flex:1; padding:16px 0; }
        .acd-sidebar-item { display:flex; align-items:center; gap:10px; padding:12px 20px; color:#a8d5a8; font-size:14px; cursor:pointer; }
        .acd-sidebar-item-active { background:rgba(255,255,255,0.15); color:#fff; border-left:3px solid #f0c050; }
        .acd-sidebar-footer { padding:16px 20px; border-top:1px solid rgba(255,255,255,0.1); }
        .acd-logout-btn { width:100%; padding:8px; background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; font-size:13px; cursor:pointer; font-family:inherit; }
        .acd-main { flex:1; margin-left:240px; padding:28px 32px; }
        .acd-topbar { display:flex; justify-content:flex-end; margin-bottom:16px; }
        .acd-back  { color:#1f4d1f; font-weight:600; cursor:pointer; font-size:13px; margin-bottom:18px; display:inline-flex; align-items:center; gap:6px; }
        .acd-layout { display:grid; grid-template-columns:1fr 320px; gap:24px; align-items:start; }
        .acd-card  { background:#fff; border-radius:12px; padding:24px; box-shadow:0 2px 10px rgba(0,0,0,.07); margin-bottom:20px; }
        .acd-card-title { font-size:15px; font-weight:700; color:#1f4d1f; margin-bottom:16px; }
        .acd-subject { font-size:18px; font-weight:700; color:#111; margin-bottom:10px; }
        .acd-badge  { font-size:11px; font-weight:600; padding:4px 12px; border-radius:99px; }
        .acd-meta   { font-size:12px; color:#888; margin-bottom:4px; }
        .acd-messages { display:flex; flex-direction:column; gap:12px; max-height:420px; overflow-y:auto; margin-bottom:16px; padding:4px; }
        .acd-msg-row { display:flex; }
        .acd-msg-row.buyer { justify-content:flex-start; }
        .acd-msg-row.admin,.acd-msg-row.staff { justify-content:flex-end; }
        .acd-bubble { max-width:75%; padding:10px 14px; border-radius:12px; }
        .acd-bubble.buyer { background:#f0f0f0; border-bottom-left-radius:4px; }
        .acd-bubble.admin,.acd-bubble.staff { background:#d4edda; border-bottom-right-radius:4px; }
        .acd-msg-sender { font-size:11px; color:#888; margin-bottom:4px; }
        .acd-msg-text   { font-size:14px; color:#333; line-height:1.5; }
        .acd-msg-time   { font-size:10px; color:#aaa; margin-top:4px; }
        .acd-msg-action { font-size:11px; font-weight:700; color:#1f4d1f; margin-top:4px; background:#f0fff4; padding:2px 8px; border-radius:4px; display:inline-block; }
        .acd-input-row  { display:flex; gap:10px; }
        .acd-input { flex:1; padding:12px 14px; border:1.5px solid #ddd; border-radius:8px; font-size:14px; font-family:inherit; outline:none; }
        .acd-input:focus { border-color:#1f4d1f; }
        .acd-send-btn { padding:12px 20px; background:#1f4d1f; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; }
        .acd-send-btn:disabled { background:#aaa; cursor:not-allowed; }
        .acd-action-select { width:100%; padding:10px 14px; border:1.5px solid #ddd; border-radius:8px; font-size:13px; font-family:inherit; margin-bottom:10px; outline:none; }
        .acd-status-btn { width:100%; padding:10px; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; margin-bottom:8px; }
        .acd-info-row { display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; }
        .acd-info-label { color:#888; }
        .acd-info-val   { color:#333; font-weight:600; text-align:right; }
        .acd-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#1f4d1f; color:#fff; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:600; z-index:9999; }
        @media(max-width:800px) { .acd-layout { grid-template-columns:1fr; } .acd-main { padding:16px; margin-left:0; } .acd-sidebar { display:none; } }
      `}</style>

      <div className="acd-shell">
        <div className="acd-sidebar">
          <div className="acd-sidebar-logo">
            <img src={LOGO_PATH} alt="Achoice" />
            <div>
              <div className="acd-sidebar-name">ACHOICE</div>
              <div className="acd-sidebar-sub">Admin Panel</div>
            </div>
          </div>
          <nav className="acd-sidebar-nav">
            {[
              { icon: "📊", label: "Dashboard", path: "/admin/dashboard" },
              { icon: "👤", label: "Buyers", path: "/admin/buyers" },
              { icon: "🏪", label: "Sellers", path: "/admin/sellers" },
              { icon: "🌾", label: "Products", path: "/admin/products" },
              { icon: "📦", label: "Orders", path: "/admin/orders" },
              { icon: "💰", label: "Loans", path: "/admin/loans" },
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
              {
                icon: "📋",
                label: "Complaints",
                path: "/admin/complaints",
                active: true,
              },
              { icon: "👥", label: "Staff", path: "/admin/staff" },
              { icon: "💳", label: "Payments", path: "/admin/payments" },
              { icon: "📈", label: "Reports", path: "/admin/reports" },
            ].map((item) => (
              <div
                key={item.label}
                className={
                  "acd-sidebar-item" +
                  (item.active ? " acd-sidebar-item-active" : "")
                }
                onClick={() => navigate(item.path)}
              >
                <span>{item.icon}</span> {item.label}
              </div>
            ))}
          </nav>
          <div className="acd-sidebar-footer">
            <button
              className="acd-logout-btn"
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

        <div className="acd-main">
          <div className="acd-topbar">
            <NotificationBell />
          </div>

          <div
            className="acd-back"
            onClick={() => navigate("/admin/complaints")}
          >
            Back to Complaints
          </div>

          {loading ? (
            <p style={{ color: "#888", textAlign: "center", padding: 60 }}>
              Loading...
            </p>
          ) : !complaint ? (
            <p style={{ color: "#888", textAlign: "center", padding: 60 }}>
              Complaint not found.
            </p>
          ) : (
            <div className="acd-layout">
              {/* LEFT — Chat */}
              <div>
                <div className="acd-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <div className="acd-subject">{complaint.subject}</div>
                    <span
                      className="acd-badge"
                      style={getStatusStyle(complaint.status)}
                    >
                      {complaint.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="acd-meta">Category: {complaint.category}</div>
                  <div className="acd-meta">
                    Type: {complaint.type?.replace(/_/g, " ")}
                  </div>
                  <div className="acd-meta">
                    Buyer: {complaint.user?.name} ({complaint.user?.email})
                  </div>
                  {complaint.order?.order_number && (
                    <div className="acd-meta">
                      Order: {complaint.order.order_number} - ₦
                      {Number(complaint.order.total).toLocaleString()} (
                      {complaint.order.status})
                    </div>
                  )}
                  <div className="acd-meta">
                    Submitted:{" "}
                    {complaint.created_at
                      ? new Date(complaint.created_at).toLocaleDateString(
                          "en-NG",
                          { day: "numeric", month: "short", year: "numeric" },
                        )
                      : "-"}
                  </div>
                </div>

                {/* Chat */}
                <div className="acd-card">
                  <div className="acd-card-title">Messages</div>
                  <div className="acd-messages">
                    {!complaint.messages || complaint.messages.length === 0 ? (
                      <p
                        style={{
                          textAlign: "center",
                          color: "#aaa",
                          fontSize: 13,
                        }}
                      >
                        No messages yet.
                      </p>
                    ) : (
                      complaint.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`acd-msg-row ${msg.sender_role}`}
                        >
                          <div className={`acd-bubble ${msg.sender_role}`}>
                            <div className="acd-msg-sender">
                              {msg.sender?.name} - {msg.sender_role}
                            </div>
                            <div className="acd-msg-text">{msg.message}</div>
                            {msg.action && (
                              <div className="acd-msg-action">
                                Action: {msg.action}
                              </div>
                            )}
                            {msg.attachment_url && (
                              <a
                                href={msg.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: 12,
                                  color: "#1f4d1f",
                                  fontWeight: 600,
                                  display: "block",
                                  marginTop: 6,
                                }}
                              >
                                Attachment
                              </a>
                            )}
                            <div className="acd-msg-time">
                              {msg.created_at
                                ? new Date(msg.created_at).toLocaleTimeString(
                                    "en-NG",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )
                                : ""}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Action select for cancellation */}
                  {canAction && (
                    <select
                      className="acd-action-select"
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                    >
                      <option value="">-- No Action (reply only) --</option>
                      <option value="approve">Approve Cancellation</option>
                      <option value="reject">Reject Cancellation</option>
                    </select>
                  )}

                  {["resolved", "rejected"].includes(complaint.status) ? (
                    <p
                      style={{
                        textAlign: "center",
                        color: "#aaa",
                        fontSize: 13,
                        padding: "10px 0",
                      }}
                    >
                      This complaint has been {complaint.status}. No further
                      messages.
                    </p>
                  ) : (
                    <form onSubmit={sendMessage}>
                      <div className="acd-input-row">
                        <input
                          className="acd-input"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          disabled={sending}
                        />
                        <button
                          className="acd-send-btn"
                          type="submit"
                          disabled={sending || !newMessage.trim()}
                        >
                          {sending ? "..." : "Send"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* RIGHT — Actions */}
              <div>
                <div className="acd-card">
                  <div className="acd-card-title">Update Status</div>
                  {["pending", "under_review", "resolved", "rejected"].map(
                    (s) => (
                      <button
                        key={s}
                        className="acd-status-btn"
                        style={getStatusStyle(s)}
                        disabled={statusUpdating || complaint.status === s}
                        onClick={() => updateStatus(s)}
                      >
                        {s.replace(/_/g, " ").charAt(0).toUpperCase() +
                          s.replace(/_/g, " ").slice(1)}
                      </button>
                    ),
                  )}
                </div>

                <div className="acd-card">
                  <div className="acd-card-title">Details</div>
                  <div className="acd-info-row">
                    <span className="acd-info-label">Status</span>
                    <span className="acd-info-val">
                      {complaint.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="acd-info-row">
                    <span className="acd-info-label">Category</span>
                    <span className="acd-info-val">{complaint.category}</span>
                  </div>
                  <div className="acd-info-row">
                    <span className="acd-info-label">Unread</span>
                    <span className="acd-info-val">
                      {complaint.unread_count || 0}
                    </span>
                  </div>
                  {complaint.resolvedBy && (
                    <div className="acd-info-row">
                      <span className="acd-info-label">Resolved by</span>
                      <span className="acd-info-val">
                        {complaint.resolvedBy.name}
                      </span>
                    </div>
                  )}
                  {complaint.evidence_url && (
                    <a
                      href={complaint.evidence_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "block",
                        marginTop: 10,
                        fontSize: 13,
                        color: "#1f4d1f",
                        fontWeight: 600,
                      }}
                    >
                      View Evidence
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {toast && <div className="acd-toast">{toast}</div>}
    </>
  );
}
