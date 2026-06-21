import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import BuyerDropdown from "../../components/buyer/BuyerDropdown";

const LOGO_PATH = "/achoice logo.png";

export default function ComplaintsPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [formData, setFormData] = useState({
    order_id: "",
    type: "",
    description: "",
    evidence: null,
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // Load buyer orders for dropdown
  useEffect(() => {
    api
      .get("/orders/my-orders")
      .then((res) =>
        setOrders(
          Array.isArray(res.data.orders)
            ? res.data.orders
            : Array.isArray(res.data)
              ? res.data
              : [],
        ),
      )
      .catch(() => {});
  }, []);

  // Load existing complaints
  useEffect(() => {
    api
      .get("/complaints")
      .then((res) =>
        setComplaints(
          Array.isArray(res.data.complaints)
            ? res.data.complaints
            : Array.isArray(res.data)
              ? res.data
              : [],
        ),
      )
      .catch(() => {})
      .finally(() => setLoadingComplaints(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "evidence") {
      setFormData((prev) => ({ ...prev, evidence: files[0] || null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.order_id || !formData.type || !formData.description.trim()) {
      showToast("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("order_id", formData.order_id);
      payload.append("type", formData.type);
      payload.append("description", formData.description);
      if (formData.evidence) payload.append("evidence", formData.evidence);

      const res = await api.post("/complaints", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newComplaint = res.data.complaint || res.data;
      setComplaints((prev) => [newComplaint, ...prev]);
      setFormData({ order_id: "", type: "", description: "", evidence: null });
      const fileInput = document.getElementById("evidence-input");
      if (fileInput) fileInput.value = "";
      showToast("Complaint submitted successfully!");
    } catch (err) {
      showToast(
        err?.response?.data?.message ||
          "Failed to submit complaint. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) =>
    ({
      pending: { background: "#fff8e7", color: "#b36b00" },
      reviewing: { background: "#e7f0ff", color: "#1a4fa0" },
      resolved: { background: "#eafaf0", color: "#1a7a3a" },
      rejected: { background: "#fff0f0", color: "#cc0000" },
    })[status] || { background: "#f0f0f0", color: "#555" };

  const complaintTypes = [
    "Refund Request",
    "Damaged Item",
    "Wrong Item",
    "Late Delivery",
    "Other",
  ];

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
        .cmp-item       { background:#fff; border-radius:10px; padding:18px 20px; margin-bottom:12px; box-shadow:0 1px 6px rgba(0,0,0,.06); border-left:4px solid #1f4d1f; }
        .cmp-item-top   { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px; }
        .cmp-item-type  { font-weight:700; font-size:14px; color:#1f4d1f; }
        .cmp-item-badge { font-size:11px; font-weight:600; padding:4px 10px; border-radius:99px; }
        .cmp-item-order { font-size:12px; color:#888; margin-bottom:6px; }
        .cmp-item-desc  { font-size:13px; color:#444; line-height:1.5; }
        .cmp-item-date  { font-size:11px; color:#aaa; margin-top:8px; }

        .cmp-empty   { text-align:center; padding:40px 20px; color:#aaa; font-size:14px; }
        .cmp-loading { text-align:center; padding:30px; color:#888; font-size:14px; }

        .cmp-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#1f4d1f; color:#fff; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:600; z-index:9999; box-shadow:0 4px 16px rgba(0,0,0,.2); }

        @media(max-width:600px) {
          .cmp-nav  { padding:10px 16px; }
          .cmp-card { padding:18px; }
        }
      `}</style>

      <div className="cmp-wrap">
        {/* ── NAV ── */}
        <nav className="cmp-nav">
          <div className="cmp-nav-left" onClick={() => navigate("/products")}>
            <img
              src={LOGO_PATH}
              alt="Logo"
              className="cmp-nav-logo"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className="cmp-nav-name">
              ACHOICE <span>MARKET</span>
            </div>
          </div>
          <div className="cmp-nav-right">
            <BuyerDropdown />
          </div>
        </nav>

        {/* ── BODY ── */}
        <div className="cmp-body">
          <h1 className="cmp-title">📋 Complaints &amp; Refunds</h1>
          <p className="cmp-sub">
            Submit a complaint about an order. Our team will review and respond
            within 2–5 working days.
          </p>

          {/* FORM */}
          <div className="cmp-card">
            <div className="cmp-card-title">Submit a New Complaint</div>
            <form onSubmit={handleSubmit}>
              <div className="cmp-field">
                <label className="cmp-label">
                  Select Order <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  className="cmp-select"
                  name="order_id"
                  value={formData.order_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Choose an order --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number || `Order #${o.id}`} — ₦
                      {Number(o.total_amount || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cmp-field">
                <label className="cmp-label">
                  Complaint Type <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  className="cmp-select"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select type --</option>
                  {complaintTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cmp-field">
                <label className="cmp-label">
                  Description <span style={{ color: "red" }}>*</span>
                </label>
                <textarea
                  className="cmp-textarea"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your complaint in detail..."
                  required
                />
              </div>

              <div className="cmp-field">
                <label className="cmp-label">
                  Upload Evidence{" "}
                  <span style={{ color: "#aaa", fontWeight: 400 }}>
                    (optional — image)
                  </span>
                </label>
                <input
                  id="evidence-input"
                  className="cmp-input"
                  type="file"
                  name="evidence"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleChange}
                />
                <p className="cmp-file-hint">Accepted: JPG, PNG. Max 2MB.</p>
              </div>

              <button className="cmp-btn" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "📤 Submit Complaint"}
              </button>
            </form>
          </div>

          {/* COMPLAINTS LIST */}
          <div className="cmp-list-title">Your Submitted Complaints</div>
          {loadingComplaints ? (
            <div className="cmp-loading">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="cmp-empty">
              You have not submitted any complaints yet.
            </div>
          ) : (
            complaints.map((c) => (
              <div key={c.id} className="cmp-item">
                <div className="cmp-item-top">
                  <span className="cmp-item-type">{c.type}</span>
                  <span
                    className="cmp-item-badge"
                    style={getStatusStyle(c.status)}
                  >
                    {c.status
                      ? c.status.charAt(0).toUpperCase() + c.status.slice(1)
                      : "Pending"}
                  </span>
                </div>
                <div className="cmp-item-order">
                  Order: {c.order?.order_number || `#${c.order_id}`}
                </div>
                <div className="cmp-item-desc">{c.description}</div>
                {c.admin_response && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: "10px 14px",
                      background: "#f0f7f0",
                      borderRadius: 6,
                      fontSize: 13,
                      color: "#1f4d1f",
                    }}
                  >
                    <strong>Response:</strong> {c.admin_response}
                  </div>
                )}
                <div className="cmp-item-date">
                  Submitted:{" "}
                  {c.created_at
                    ? new Date(c.created_at).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── FOOTER ── */}
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

      {toast && <div className="cmp-toast">{toast}</div>}
    </>
  );
}
