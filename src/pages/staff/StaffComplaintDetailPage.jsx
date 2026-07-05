import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import NotificationBell from "../../components/buyer/NotificationBell";

const LOGO_PATH = "/achoice logo.png";

export default function StaffComplaintDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const bottomRef = useRef(null);

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending]     = useState(false);
  const [toast, setToast]         = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  let user = null;
  try { user = JSON.parse(localStorage.getItem("user")); } catch {}

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const fetchComplaint = async () => {
    try {
      const res = await api.get(`/admin/complaints/${id}`);
      setComplaint(res.data.complaint || res.data);
    } catch { showToast("Failed to load complaint."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaint(); }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [complaint?.messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await api.post(`/staff/complaints/${id}/messages`, { message: newMessage });
      setNewMessage("");
      fetchComplaint();
      showToast("Message sent!");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to send message.");
    } finally { setSending(false); }
  };

  const getStatusStyle = (status) =>
    ({ pending:{background:"#fff8e7",color:"#b36b00"}, under_review:{background:"#e7f0ff",color:"#1a4fa0"},
       resolved:{background:"#eafaf0",color:"#1a7a3a"}, rejected:{background:"#fff0f0",color:"#cc0000"}
    })[status] || {background:"#f0f0f0",color:"#555"};

  const navItems = [
    ...(user?.can_manage_agro ? [{ icon: "📊", label: "Agro Dashboard", path: "/staff/agro" }] : []),
    ...(user?.can_manage_loans ? [{ icon: "💰", label: "Loan Dashboard", path: "/staff/loans" }] : []),
    { icon: "📋", label: "Complaints", path: "/staff/complaints", active: true },
  ];

  return (
    <>
      <style>{`
        .scd-shell { display:flex; min-height:100vh; background:#f0f2f5; font-family:'Segoe UI',sans-serif; }
        .scd-sidebar { width:240px; background:#1f4d1f; display:flex; flex-direction:column; position:fixed; top:0; left:0; height:100vh; }
        .scd-sidebar-logo { display:flex; align-items:center; gap:10px; padding:20px; border-bottom:1px solid rgba(255,255,255,0.1); }
        .scd-sidebar-logo img { width:40px; height:40px; object-fit:contain; }
        .scd-sidebar-name { font-size:14px; font-weight:700; color:#fff; }
        .scd-sidebar-sub { font-size:10px; color:#a8d5a8; }
        .scd-sidebar-nav { flex:1; padding:16px 0; }
        .scd-sidebar-item { display:flex; align-items:center; gap:10px; padding:12px 20px; color:#a8d5a8; font-size:14px; cursor:pointer; }
        .scd-sidebar-item-active { background:rgba(255,255,255,0.15); color:#fff; border-left:3px solid #f0c050; }
        .scd-sidebar-footer { padding:16px 20px; border-top:1px solid rgba(255,255,255,0.1); }
        .scd-staff-name { font-size:13px; font-weight:600; color:#fff; margin-bottom:2px; }
        .scd-staff-role { font-size:11px; color:#a8d5a8; margin-bottom:10px; }
        .scd-logout-btn { width:100%; padding:8px; background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; font-size:13px; cursor:pointer; font-family:inherit; }
        .scd-main { flex:1; margin-left:240px; padding:28px 32px; }
        .scd-topbar { display:flex; justify-content:flex-end; margin-bottom:16px; }
        .scd-back  { color:#1f4d1f; font-weight:600; cursor:pointer; font-size:13px; margin-bottom:18px; display:inline-flex; align-items:center; gap:6px; }
        .scd-card  { background:#fff; border-radius:12px; padding:24px; box-shadow:0 2px 10px rgba(0,0,0,.07); margin-bottom:20px; max-width:760px; }
        .scd-card-title { font-size:15px; font-weight:700; color:#1f4d1f; margin-bottom:16px; }
        .scd-subject { font-size:18px; font-weight:700; color:#111; margin-bottom:10px; }
        .scd-badge  { font-size:11px; font-weight:600; padding:4px 12px; border-radius:99px; }
        .scd-meta   { font-size:12px; color:#888; margin-bottom:4px; }
        .scd-messages { display:flex; flex-direction:column; gap:12px; max-height:420px; overflow-y:auto; margin-bottom:16px; padding:4px; }
        .scd-msg-row { display:flex; }
        .scd-msg-row.buyer { justify-content:flex-start; }
        .scd-msg-row.admin,.scd-msg-row.staff { justify-content:flex-end; }
        .scd-bubble { max-width:75%; padding:10px 14px; border-radius:12px; }
        .scd-bubble.buyer { background:#f0f0f0; border-bottom-left-radius:4px; }
        .scd-bubble.admin,.scd-bubble.staff { background:#d4edda; border-bottom-right-radius:4px; }
        .scd-msg-sender { font-size:11px; color:#888; margin-bottom:4px; }
        .scd-msg-text   { font-size:14px; color:#333; line-height:1.5; }
        .scd-msg-time   { font-size:10px; color:#aaa; margin-top:4px; }
        .scd-input-row  { display:flex; gap:10px; }
        .scd-input { flex:1; padding:12px 14px; border:1.5px solid #ddd; border-radius:8px; font-size:14px; font-family:inherit; outline:none; }
        .scd-input:focus { border-color:#1f4d1f; }
        .scd-send-btn { padding:12px 20px; background:#1f4d1f; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; }
        .scd-send-btn:disabled { background:#aaa; cursor:not-allowed; }
        .scd-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#1f4d1f; color:#fff; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:600; z-index:9999; }
        .scd-hamburger { display:none; }
        .scd-backdrop { display:none; }
        .scd-sidebar-close { display:none; }
        @media(max-width:600px) {
          .scd-main { padding:16px; margin-left:0; }
          .scd-sidebar {
            width:min(280px,82vw);
            transform:translateX(-100%);
            transition:transform 0.25s ease;
            box-shadow:2px 0 16px rgba(0,0,0,0.25);
            z-index:600;
          }
          .scd-sidebar.scd-sidebar-open { transform:translateX(0); }
          .scd-hamburger {
            display:flex; align-items:center; justify-content:center;
            width:40px; height:40px; border-radius:10px; border:1px solid #e8e4dc;
            background:#fff; font-size:18px; cursor:pointer; flex-shrink:0;
          }
          .scd-backdrop.scd-backdrop-open {
            display:block; position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:550;
          }
          .scd-sidebar-close { display:block; margin-left:auto; background:none; border:none; color:#fff; font-size:18px; cursor:pointer; }
          .scd-topbar { justify-content:space-between; }
        }
      `}</style>

      <div className="scd-shell">
        {mobileNavOpen && (
          <div className="scd-backdrop scd-backdrop-open" onClick={() => setMobileNavOpen(false)} />
        )}
        <div className={"scd-sidebar" + (mobileNavOpen ? " scd-sidebar-open" : "")}>
          <div className="scd-sidebar-logo">
            <img src={LOGO_PATH} alt="Achoice" />
            <div>
              <div className="scd-sidebar-name">ACHOICE</div>
              <div className="scd-sidebar-sub">Staff Panel</div>
            </div>
            <button className="scd-sidebar-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">✕</button>
          </div>
          <nav className="scd-sidebar-nav">
            {navItems.map((item) => (
              <div
                key={item.label}
                className={"scd-sidebar-item" + (item.active ? " scd-sidebar-item-active" : "")}
                onClick={() => { navigate(item.path); setMobileNavOpen(false); }}
              >
                <span>{item.icon}</span> {item.label}
              </div>
            ))}
          </nav>
          <div className="scd-sidebar-footer">
            <div className="scd-staff-name">{user?.name}</div>
            <div className="scd-staff-role">Staff</div>
            <button
              className="scd-logout-btn"
              onClick={() => { localStorage.clear(); navigate("/login"); }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="scd-main">
          <div className="scd-topbar">
            <button className="scd-hamburger" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">☰</button>
            <NotificationBell />
          </div>

          <div className="scd-back" onClick={() => navigate("/staff/complaints")}>Back to Complaints</div>

          {loading ? <p style={{color:"#888",textAlign:"center",padding:60}}>Loading...</p> : !complaint ? (
            <p style={{color:"#888",textAlign:"center",padding:60}}>Complaint not found.</p>
          ) : (
            <>
              <div className="scd-card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:12}}>
                  <div className="scd-subject">{complaint.subject}</div>
                  <span className="scd-badge" style={getStatusStyle(complaint.status)}>
                    {complaint.status?.replace(/_/g," ")}
                  </span>
                </div>
                <div className="scd-meta">Category: {complaint.category}</div>
                <div className="scd-meta">Type: {complaint.type?.replace(/_/g," ")}</div>
                <div className="scd-meta">Buyer: {complaint.user?.name} ({complaint.user?.email})</div>
                {complaint.order?.order_number && (
                  <div className="scd-meta">Order: {complaint.order.order_number}</div>
                )}
                <div className="scd-meta">Submitted: {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}) : "-"}</div>
                {complaint.evidence_url && (
                  <a href={complaint.evidence_url} target="_blank" rel="noreferrer"
                    style={{display:"inline-block",marginTop:10,fontSize:13,color:"#1f4d1f",fontWeight:600}}>
                    View Evidence
                  </a>
                )}
              </div>

              <div className="scd-card">
                <div className="scd-card-title">Messages</div>
                <div className="scd-messages">
                  {(!complaint.messages || complaint.messages.length === 0) ? (
                    <p style={{textAlign:"center",color:"#aaa",fontSize:13}}>No messages yet.</p>
                  ) : complaint.messages.map(msg => (
                    <div key={msg.id} className={`scd-msg-row ${msg.sender_role}`}>
                      <div className={`scd-bubble ${msg.sender_role}`}>
                        <div className="scd-msg-sender">{msg.sender?.name} - {msg.sender_role}</div>
                        <div className="scd-msg-text">{msg.message}</div>
                        {msg.attachment_url && <a href={msg.attachment_url} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#1f4d1f",fontWeight:600,display:"block",marginTop:6}}>Attachment</a>}
                        <div className="scd-msg-time">{msg.created_at ? new Date(msg.created_at).toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"}) : ""}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {["resolved","rejected"].includes(complaint.status) ? (
                  <p style={{textAlign:"center",color:"#aaa",fontSize:13,padding:"10px 0"}}>
                    This complaint has been {complaint.status}.
                  </p>
                ) : (
                  <form onSubmit={sendMessage}>
                    <div className="scd-input-row">
                      <input className="scd-input" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a message..." disabled={sending} />
                      <button className="scd-send-btn" type="submit" disabled={sending || !newMessage.trim()}>
                        {sending ? "..." : "Send"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {toast && <div className="scd-toast">{toast}</div>}
    </>
  );
}
