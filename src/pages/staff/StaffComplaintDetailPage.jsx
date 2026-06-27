import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

export default function StaffComplaintDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const bottomRef = useRef(null);

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending]     = useState(false);
  const [toast, setToast]         = useState("");

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

  return (
    <>
      <style>{`
        .scd-wrap { min-height:100vh; background:#f7f5f0; font-family:'Segoe UI',sans-serif; padding:28px 32px; }
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
        @media(max-width:600px) { .scd-wrap { padding:16px; } }
      `}</style>

      <div className="scd-wrap">
        <div className="scd-back" onClick={() => navigate("/staff/complaints")}>← Back to Complaints</div>

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
              <div className="scd-meta">Submitted: {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}) : "—"}</div>
              {complaint.evidence_url && (
                <a href={complaint.evidence_url} target="_blank" rel="noreferrer"
                  style={{display:"inline-block",marginTop:10,fontSize:13,color:"#1f4d1f",fontWeight:600}}>
                  📎 View Evidence
                </a>
              )}
            </div>

            <div className="scd-card">
              <div className="scd-card-title">💬 Messages</div>
              <div className="scd-messages">
                {(!complaint.messages || complaint.messages.length === 0) ? (
                  <p style={{textAlign:"center",color:"#aaa",fontSize:13}}>No messages yet.</p>
                ) : complaint.messages.map(msg => (
                  <div key={msg.id} className={`scd-msg-row ${msg.sender_role}`}>
                    <div className={`scd-bubble ${msg.sender_role}`}>
                      <div className="scd-msg-sender">{msg.sender?.name} · {msg.sender_role}</div>
                      <div className="scd-msg-text">{msg.message}</div>
                      {msg.attachment_url && <a href={msg.attachment_url} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#1f4d1f",fontWeight:600,display:"block",marginTop:6}}>📎 Attachment</a>}
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
      {toast && <div className="scd-toast">{toast}</div>}
    </>
  );
}
