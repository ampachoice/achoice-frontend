import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import BuyerDropdown from "../../components/buyer/BuyerDropdown";

const LOGO_PATH = "/achoice logo.png";

const complaintTypes = [
  { value: "refund_request", label: "Refund Request" },
  { value: "damaged_item",   label: "Damaged Item" },
  { value: "wrong_item",     label: "Wrong Item Received" },
  { value: "late_delivery",  label: "Late Delivery" },
  { value: "loan_complaint", label: "Loan Complaint" },
  { value: "payment_issue",  label: "Payment Issue" },
  { value: "other",          label: "Other" },
];

export default function ComplaintsPage() {
  const navigate = useNavigate();

  const [orders, setOrders]               = useState([]);
  const [complaints, setComplaints]       = useState([]);
  const [toast, setToast]                 = useState("");
  const [submitting, setSubmitting]       = useState(false);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  // Form state
  const [category, setCategory]   = useState("");
  const [issueType, setIssueType] = useState("");
  const [orderId, setOrderId]     = useState("");
  const [subject, setSubject]     = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence]   = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const res = await api.get("/complaints/my-orders");
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error("Failed to load orders", err);
      }
    };
    fetchMyOrders();

    api.get("/complaints/my-complaints")
      .then(res => setComplaints(
        Array.isArray(res.data.data) ? res.data.data :
        Array.isArray(res.data.complaints) ? res.data.complaints :
        Array.isArray(res.data) ? res.data : []
      ))
      .catch(() => {})
      .finally(() => setLoadingComplaints(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !issueType || !subject.trim() || !description.trim()) {
      showToast("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("category",    category);
      payload.append("issue_type",  issueType);
      payload.append("subject",     subject);
      payload.append("description", description);
      if (orderId) payload.append("order_id", orderId);
      if (evidence) payload.append("evidence", evidence);

      const res = await api.post("/complaints", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newComplaint = res.data.complaint || res.data;
      setComplaints(prev => [newComplaint, ...prev]);

      // Reset form
      setCategory(""); setIssueType(""); setOrderId("");
      setSubject(""); setDescription(""); setEvidence(null);
      const fileInput = document.getElementById("evidence-input");
      if (fileInput) fileInput.value = "";

      showToast("Complaint submitted successfully!");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to submit complaint. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) =>
    ({
      pending:      { background: "#fff8e7", color: "#b36b00" },
      under_review: { background: "#e7f0ff", color: "#1a4fa0" },
      resolved:     { background: "#eafaf0", color: "#1a7a3a" },
      rejected:     { background: "#fff0f0", color: "#cc0000" },
    })[status] || { background: "#f0f0f0", color: "#555" };

  return (
    <>
      <style>{`
        .cmp-wrap  { min-height:100vh; display:flex; flex-direction:column; background:#f7f5f0; font-family:'Segoe UI',sans-serif; }
        .cmp-nav   { background:#1f4d1f; padding:10px 40px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; }
        .cmp-nav-left  { display:flex; align-items:center; gap:10px; cursor:pointer; }
        .cmp-nav-logo  { width:36px; height:36px; border-radius:6px; }
        .cmp-nav-name  { font-weight:700; font-size:17px; color:#fff; }
        .cmp-nav-name span { color:#f0c050; }
        .cmp-nav-right { display:flex; align-items:center; gap:14px; }
        .cmp-body  { flex:1; max-width:860px; margin:0 auto; width:100%; padding:36px 16px 60px; }
        .cmp-title { font-size:22px; font-weight:800; color:#1f4d1f; margin-bottom:6px; }
        .cmp-sub   { font-size:13px; color:#777; margin-bottom:28px; }
        .cmp-card       { background:#fff; border-radius:12px; padding:28px; box-shadow:0 2px 10px rgba(0,0,0,.07); margin-bottom:32px; }
        .cmp-card-title { font-size:16px; font-weight:700; color:#1f4d1f; margin-bottom:20px; padding-bottom:10px; border-bottom:1px solid #eee; }
        .cmp-field    { margin-bottom:18px; }
        .cmp-label    { display:block; font-size:13px; font-weight:600; color:#444; margin-bottom:6px; }
        .cmp-input, .cmp-select, .cmp-textarea {
          width:100%; padding:11px 14px; border:1.5px solid #ddd; border-radius:8px;
          font-size:14px; font-family:inherit; color:#333; background:#fff;
          box-sizing:border-box; transition:border .2s;
        }
        .cmp-input:focus, .cmp-select:focus, .cmp-textarea:focus { outline:none; border-color:#1f4d1f; }
        .cmp-textarea  { resize:vertical; min-height:110px; }
        .cmp-file-hint { font-size:11px; color:#999; margin-top:5px; }
        .cmp-btn { width:100%; padding:14px; background:#1f4d1f; color:#fff; border:none; border-radius:8px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; margin-top:6px; transition:background .2s; }
        .cmp-btn:hover     { background:#174014; }
        .cmp-btn:disabled  { background:#aaa; cursor:not-allowed; }
        .cmp-list-title { font-size:16px; font-weight:700; color:#1f4d1f; margin-bottom:16px; }
        .cmp-item       { background:#fff; border-radius:10px; padding:18px 20px; margin-bottom:12px; box-shadow:0 1px 6px rgba(0,0,0,.06); border-left:4px solid #1f4d1f; cursor:pointer; transition:box-shadow .2s; }
        .cmp-item:hover { box-shadow:0 4px 16px rgba(0,0,0,.1); }
        .cmp-item-top   { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px; }
        .cmp-item-type  { font-weight:700; font-size:14px; color:#1f4d1f; }
        .cmp-item-badge { font-size:11px; font-weight:600; padding:4px 10px; border-radius:99px; }
        .cmp-item-subject { font-size:13px; font-weight:600; color:#333; margin-bottom:4px; }
        .cmp-item-order { font-size:12px; color:#888; margin-bottom:6px; }
        .cmp-item-desc  { font-size:13px; color:#444; line-height:1.5; }
        .cmp-item-date  { font-size:11px; color:#aaa; margin-top:8px; }
        .cmp-item-chat  { font-size:12px; color:#1f4d1f; font-weight:600; margin-top:8px; }
        .cmp-empty   { text-align:center; padding:40px 20px; color:#aaa; font-size:14px; }
        .cmp-loading { text-align:center; padding:30px; color:#888; font-size:14px; }
        .cmp-no-orders { font-size:12px; color:#aaa; margin-top:5px; }
        .cmp-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#1f4d1f; color:#fff; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:600; z-index:9999; box-shadow:0 4px 16px rgba(0,0,0,.2); }
        @media(max-width:600px) {
          .cmp-nav  { padding:10px 16px; }
          .cmp-card { padding:18px; }
        }
      `}</style>

      <div className="cmp-wrap">
        <nav className="cmp-nav">
          <div className="cmp-nav-left" onClick={() => navigate("/products")}>
            <img src={LOGO_PATH} alt="Logo" className="cmp-nav-logo"
              onError={(e) => { e.target.style.display = "none"; }} />
            <div className="cmp-nav-name">ACHOICE <span>MARKET</span></div>
          </div>
          <div className="cmp-nav-right"><BuyerDropdown /></div>
        </nav>

        <div className="cmp-body">
          <h1 className="cmp-title">📋 Complaints</h1>
          <p className="cmp-sub">Submit a complaint. Our team will review and respond within 48 hours.</p>

          <div className="cmp-card">
            <div className="cmp-card-title">Submit a New Complaint</div>
            <form onSubmit={handleSubmit}>

              {/* Category */}
              <div className="cmp-field">
                <label className="cmp-label">Category <span style={{color:"red"}}>*</span></label>
                <select className="cmp-select" value={category}
                  onChange={e => { setCategory(e.target.value); setIssueType(""); }} required>
                  <option value="">-- Select Category --</option>
                  <option value="orders">Orders</option>
                  <option value="loan">Loan</option>
                </select>
              </div>

              {/* Issue Type */}
              <div className="cmp-field">
                <label className="cmp-label">Issue Type <span style={{color:"red"}}>*</span></label>
                <select className="cmp-select" value={issueType}
                  onChange={e => setIssueType(e.target.value)} required>
                  <option value="">-- Select Issue Type --</option>
                  {complaintTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Order */}
              <div className="cmp-field">
                <label className="cmp-label">Select Order <span style={{color:"#aaa", fontWeight:400}}>(optional)</span></label>
                <select className="cmp-select" value={orderId}
                  onChange={e => setOrderId(e.target.value)}>
                  <option value="">-- Select Order (Optional) --</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>{order.label}</option>
                  ))}
                </select>
                {orders.length === 0 && (
                  <p className="cmp-no-orders">Only delivered, shipped or cancelled orders appear here.</p>
                )}
              </div>

              {/* Subject */}
              <div className="cmp-field">
                <label className="cmp-label">Subject <span style={{color:"red"}}>*</span></label>
                <input className="cmp-input" type="text" value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Brief summary of your complaint" required />
              </div>

              {/* Description */}
              <div className="cmp-field">
                <label className="cmp-label">Description <span style={{color:"red"}}>*</span></label>
                <textarea className="cmp-textarea" value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your complaint in detail (minimum 20 characters)..." required />
              </div>

              {/* Evidence */}
              <div className="cmp-field">
                <label className="cmp-label">Upload Evidence <span style={{color:"#aaa", fontWeight:400}}>(optional)</span></label>
                <input id="evidence-input" className="cmp-input" type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={e => setEvidence(e.target.files[0] || null)} />
                <p className="cmp-file-hint">Accepted: JPG, PNG, PDF. Max 5MB.</p>
              </div>

              <button className="cmp-btn" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "📤 Submit Complaint"}
              </button>
            </form>
          </div>

          <div className="cmp-list-title">Your Submitted Complaints</div>
          {loadingComplaints ? (
            <div className="cmp-loading">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="cmp-empty">You have not submitted any complaints yet.</div>
          ) : (
            complaints.map(c => (
              <div key={c.id} className="cmp-item" onClick={() => navigate(`/complaints/${c.id}`)}>
                <div className="cmp-item-top">
                  <span className="cmp-item-type">{c.type?.replace(/_/g, " ")}</span>
                  <span className="cmp-item-badge" style={getStatusStyle(c.status)}>
                    {c.status
                      ? c.status.replace(/_/g, " ").charAt(0).toUpperCase() + c.status.replace(/_/g, " ").slice(1)
                      : "Pending"}
                  </span>
                </div>
                {c.subject && <div className="cmp-item-subject">{c.subject}</div>}
                {c.order?.order_number && (
                  <div className="cmp-item-order">Order: {c.order.order_number}</div>
                )}
                <div className="cmp-item-desc">{c.description?.slice(0, 100)}{c.description?.length > 100 ? "..." : ""}</div>
                <div className="cmp-item-chat">💬 Click to view chat →</div>
                <div className="cmp-item-date">
                  Submitted: {c.created_at
                    ? new Date(c.created_at).toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" })
                    : "—"}
                </div>
              </div>
            ))
          )}
        </div>

        <footer style={{background:"#1f4d1f", padding:"16px 40px", textAlign:"center"}}>
          <p style={{color:"#ccc", fontSize:12, margin:0}}>
            © {new Date().getFullYear()} Achoice Market. All rights reserved.
          </p>
        </footer>
      </div>

      {toast && <div className="cmp-toast">{toast}</div>}
    </>
  );
}
