import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import BuyerDropdown from "../../components/buyer/BuyerDropdown";

const LOGO_PATH = "/achoice logo.png";

export default function ComplaintDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const bottomRef = useRef(null);

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const fetchComplaint = async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
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
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [complaint?.messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await api.post(`/complaints/${id}/messages`, { message: newMessage });
      setNewMessage("");
      fetchComplaint();
    } catch {
      showToast("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const getStatusStyle = (status) =>
    ({
      pending: { background: "#fff8e7", color: "#b36b00" },
      under_review: { background: "#e7f0ff", color: "#1a4fa0" },
      resolved: { background: "#eafaf0", color: "#1a7a3a" },
      rejected: { background: "#fff0f0", color: "#cc0000" },
    })[status] || { background: "#f0f0f0", color: "#555" };

  return (
    <>
      <style>{`
        .cdp-wrap  { min-height:100vh; display:flex; flex-direction:column; background:#f7f5f0; font-family:'Segoe UI',sans-serif; }
        .cdp-nav   { background:#1f4d1f; padding:10px 40px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; }
        .cdp-nav-left  { display:flex; align-items:center; gap:10px; cursor:pointer; }
        .cdp-nav-logo  { width:36px; height:36px; border-radius:6px; }
        .cdp-nav-name  { font-weight:700; font-size:17px; color:#fff; }
        .cdp-nav-name span { color:#f0c050; }
        .cdp-nav-right { display:flex; align-items:center; gap:14px; }
        .cdp-body  { flex:1; max-width:760px; margin:0 auto; width:100%; padding:36px 16px 60px; }
        .cdp-back  { display:inline-flex; align-items:center; gap:6px; color:#1f4d1f; font-size:13px; font-weight:600; cursor:pointer; margin-bottom:20px; }
        .cdp-card  { background:#fff; border-radius:12px; padding:24px; box-shadow:0 2px 10px rgba(0,0,0,.07); margin-bottom:20px; }
        .cdp-card-top { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; margin-bottom:12px; }
        .cdp-subject { font-size:18px; font-weight:700; color:#111; }
        .cdp-badge  { font-size:11px; font-weight:600; padding:4px 12px; border-radius:99px; }
        .cdp-meta   { font-size:12px; color:#888; margin-bottom:4px; }
        .cdp-desc   { font-size:14px; color:#444; line-height:1.6; margin-top:10px; padding-top:10px; border-top:1px solid #f0ece4; }

        .cdp-chat-title { font-size:15px; font-weight:700; color:#1f4d1f; margin-bottom:16px; }
        .cdp-messages   { display:flex; flex-direction:column; gap:12px; margin-bottom:20px; max-height:400px; overflow-y:auto; padding:4px; }
        .cdp-msg-row    { display:flex; }
        .cdp-msg-row.buyer  { justify-content:flex-end; }
        .cdp-msg-row.staff  { justify-content:flex-start; }
        .cdp-msg-row.admin  { justify-content:flex-start; }
        .cdp-bubble     { max-width:75%; padding:10px 14px; border-radius:12px; }
        .cdp-bubble.buyer { background:#d4edda; border-bottom-right-radius:4px; }
        .cdp-bubble.staff { background:#f0f0f0; border-bottom-left-radius:4px; }
        .cdp-bubble.admin { background:#e7f0ff; border-bottom-left-radius:4px; }
        .cdp-msg-sender { font-size:11px; color:#888; margin-bottom:4px; }
        .cdp-msg-text   { font-size:14px; color:#333; line-height:1.5; }
        .cdp-msg-time   { font-size:10px; color:#aaa; margin-top:4px; text-align:right; }
        .cdp-msg-attach { font-size:12px; color:#1f4d1f; font-weight:600; margin-top:6px; display:block; }

        .cdp-input-row  { display:flex; gap:10px; }
        .cdp-input      { flex:1; padding:12px 14px; border:1.5px solid #ddd; border-radius:8px; font-size:14px; font-family:inherit; outline:none; }
        .cdp-input:focus { border-color:#1f4d1f; }
        .cdp-send-btn   { padding:12px 20px; background:#1f4d1f; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; }
        .cdp-send-btn:disabled { background:#aaa; cursor:not-allowed; }
        .cdp-resolved-note { background:#eafaf0; border:1px solid #a8d5a8; border-radius:8px; padding:12px 16px; font-size:13px; color:#1a7a3a; text-align:center; }

        .cdp-loading { text-align:center; padding:60px; color:#888; }
        .cdp-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#1f4d1f; color:#fff; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:600; z-index:9999; }

        @media(max-width:600px) {
          .cdp-nav  { padding:10px 16px; }
          .cdp-card { padding:16px; }
          .cdp-bubble { max-width:88%; }
        }
      `}</style>

      <div className="cdp-wrap">
        {/* NAV */}
        <nav className="cdp-nav">
          <div className="cdp-nav-left" onClick={() => navigate("/products")}>
            <img
              src={LOGO_PATH}
              alt="Logo"
              className="cdp-nav-logo"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className="cdp-nav-name">
              ACHOICE <span>MARKET</span>
            </div>
          </div>
          <div className="cdp-nav-right">
            <BuyerDropdown />
          </div>
        </nav>

        <div className="cdp-body">
          <div className="cdp-back" onClick={() => navigate("/complaints")}>
            ← Back to Complaints
          </div>

          {loading ? (
            <div className="cdp-loading">Loading complaint...</div>
          ) : !complaint ? (
            <div className="cdp-loading">Complaint not found.</div>
          ) : (
            <>
              {/* Complaint Info */}
              <div className="cdp-card">
                <div className="cdp-card-top">
                  <div className="cdp-subject">{complaint.subject}</div>
                  <span
                    className="cdp-badge"
                    style={getStatusStyle(complaint.status)}
                  >
                    {complaint.status
                      ? complaint.status
                          .replace(/_/g, " ")
                          .charAt(0)
                          .toUpperCase() +
                        complaint.status.replace(/_/g, " ").slice(1)
                      : "Pending"}
                  </span>
                </div>
                <div className="cdp-meta">
                  Type: {complaint.type?.replace(/_/g, " ")}
                </div>
                {complaint.order?.order_number && (
                  <div className="cdp-meta">
                    Order: {complaint.order.order_number}
                  </div>
                )}
                <div className="cdp-meta">
                  Submitted:{" "}
                  {complaint.created_at
                    ? new Date(complaint.created_at).toLocaleDateString(
                        "en-NG",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )
                    : "—"}
                </div>
                <div className="cdp-desc">{complaint.description}</div>
                {complaint.evidence_url && (
                  <a
                    href={complaint.evidence_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: 10,
                      fontSize: 13,
                      color: "#1f4d1f",
                      fontWeight: 600,
                    }}
                  >
                    📎 View Evidence
                  </a>
                )}
              </div>

              {/* Chat */}
              <div className="cdp-card">
                <div className="cdp-chat-title">💬 Messages</div>

                <div className="cdp-messages">
                  {!complaint.messages || complaint.messages.length === 0 ? (
                    <p
                      style={{
                        textAlign: "center",
                        color: "#aaa",
                        fontSize: 13,
                      }}
                    >
                      No messages yet. Send a message below.
                    </p>
                  ) : (
                    complaint.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`cdp-msg-row ${msg.sender_role}`}
                      >
                        <div className={`cdp-bubble ${msg.sender_role}`}>
                          <div className="cdp-msg-sender">
                            {msg.sender?.name} · {msg.sender_role}
                          </div>
                          <div className="cdp-msg-text">{msg.message}</div>
                          {msg.attachment_url && (
                            <a
                              href={msg.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="cdp-msg-attach"
                            >
                              📎 View Attachment
                            </a>
                          )}
                          <div className="cdp-msg-time">
                            {msg.created_at
                              ? new Date(msg.created_at).toLocaleTimeString(
                                  "en-NG",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : ""}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Message input */}
                {complaint.status === "resolved" ||
                complaint.status === "rejected" ? (
                  <div className="cdp-resolved-note">
                    This complaint has been {complaint.status}. No further
                    messages can be sent.
                  </div>
                ) : (
                  <form onSubmit={sendMessage}>
                    <div className="cdp-input-row">
                      <input
                        className="cdp-input"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={sending}
                      />
                      <button
                        className="cdp-send-btn"
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                      >
                        {sending ? "..." : "Send"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <footer
          style={{
            background: "#1f4d1f",
            padding: "16px 40px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#ccc", fontSize: 12, margin: 0 }}>
            © {new Date().getFullYear()} Achoice Market. All rights reserved.
          </p>
        </footer>
      </div>

      {toast && <div className="cdp-toast">{toast}</div>}
    </>
  );
}
