import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function StaffComplaintsPage() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const fetchComplaints = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.append("status", statusFilter);
    api.get(`/staff/complaints?${params.toString()}`)
      .then(res => setComplaints(res.data.data || res.data || []))
      .catch(() => showToast("Failed to load complaints."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComplaints(); }, [statusFilter]);

  const getStatusStyle = (status) =>
    ({ pending:{background:"#fff8e7",color:"#b36b00"}, under_review:{background:"#e7f0ff",color:"#1a4fa0"},
       resolved:{background:"#eafaf0",color:"#1a7a3a"}, rejected:{background:"#fff0f0",color:"#cc0000"}
    })[status] || {background:"#f0f0f0",color:"#555"};

  return (
    <>
      <style>{`
        .sc-wrap { min-height:100vh; background:#f7f5f0; font-family:'Segoe UI',sans-serif; padding:28px 32px; }
        .sc-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
        .sc-title  { font-size:22px; font-weight:800; color:#1f4d1f; }
        .sc-select { padding:9px 14px; border:1.5px solid #ddd; border-radius:8px; font-size:13px; font-family:inherit; outline:none; background:#fff; cursor:pointer; }
        .sc-table { width:100%; background:#fff; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,.07); overflow:hidden; }
        .sc-table table { width:100%; border-collapse:collapse; }
        .sc-table th { background:#1f4d1f; color:#fff; padding:12px 16px; text-align:left; font-size:13px; font-weight:600; }
        .sc-table td { padding:12px 16px; border-bottom:1px solid #f0ece4; font-size:13px; color:#333; vertical-align:middle; }
        .sc-table tr:last-child td { border-bottom:none; }
        .sc-table tr:hover td { background:#f9f7f4; cursor:pointer; }
        .sc-badge { font-size:11px; font-weight:600; padding:3px 10px; border-radius:99px; }
        .sc-unread { background:#cc0000; color:#fff; font-size:10px; font-weight:700; padding:2px 7px; border-radius:99px; margin-left:6px; }
        .sc-empty  { text-align:center; padding:60px; color:#aaa; font-size:14px; }
        .sc-loading { text-align:center; padding:60px; color:#888; }
        .sc-toast  { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#1f4d1f; color:#fff; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:600; z-index:9999; }
        @media(max-width:700px) { .sc-wrap { padding:16px; } }
      `}</style>

      <div className="sc-wrap">
        <div className="sc-header">
          <div className="sc-title">📋 My Complaints</div>
          <select className="sc-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="sc-loading">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="sc-empty">No complaints assigned to you.</div>
        ) : (
          <div className="sc-table">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Buyer</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => (
                  <tr key={c.id} onClick={() => navigate(`/staff/complaints/${c.id}`)}>
                    <td>
                      {c.subject}
                      {c.unread_count > 0 && <span className="sc-unread">{c.unread_count} new</span>}
                    </td>
                    <td>{c.user?.name || "—"}</td>
                    <td style={{textTransform:"capitalize"}}>{c.category}</td>
                    <td><span className="sc-badge" style={getStatusStyle(c.status)}>{c.status?.replace(/_/g," ")}</span></td>
                    <td>{c.created_at ? new Date(c.created_at).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {toast && <div className="sc-toast">{toast}</div>}
    </>
  );
}
