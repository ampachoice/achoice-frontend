import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import NotificationBell from "../../components/buyer/NotificationBell";
import AdminLayout from "../../components/admin/AdminLayout";


export default function AdminComplaintsPage() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [toast, setToast] = useState("");
  const [searchParams] = useSearchParams();
  const userFilter = searchParams.get("user");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const fetchComplaints = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.append("status", statusFilter);
    if (categoryFilter) params.append("category", categoryFilter);
    if (userFilter) params.append("user", userFilter);
    api
      .get(`/admin/complaints?${params.toString()}`)
      .then((res) => setComplaints(res.data.data || res.data || []))
      .catch(() => showToast("Failed to load complaints."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter, userFilter]);

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
        .ac-shell { display:flex; min-height:100vh; background:#f0f2f5; font-family:'Segoe UI',sans-serif; }
        .ac-sidebar { width:240px; background:#1f4d1f; display:flex; flex-direction:column; position:fixed; top:0; left:0; height:100vh; }
        .ac-sidebar-logo { display:flex; align-items:center; gap:10px; padding:20px; border-bottom:1px solid rgba(255,255,255,0.1); }
        .ac-sidebar-logo img { width:40px; height:40px; object-fit:contain; }
        .ac-sidebar-name { font-size:14px; font-weight:700; color:#fff; }
        .ac-sidebar-sub { font-size:10px; color:#a8d5a8; }
        .ac-sidebar-nav { flex:1; padding:16px 0; }
        .ac-sidebar-item { display:flex; align-items:center; gap:10px; padding:12px 20px; color:#a8d5a8; font-size:14px; cursor:pointer; }
        .ac-sidebar-item-active { background:rgba(255,255,255,0.15); color:#fff; border-left:3px solid #f0c050; }
        .ac-sidebar-footer { padding:16px 20px; border-top:1px solid rgba(255,255,255,0.1); }
        .ac-logout-btn { width:100%; padding:8px; background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; font-size:13px; cursor:pointer; font-family:inherit; }
        .ac-main { flex:1; margin-left:240px; padding:28px 32px; }
        .ac-topbar { display:flex; justify-content:flex-end; margin-bottom:16px; }
        .ac-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
        .ac-title  { font-size:22px; font-weight:800; color:#1f4d1f; }
        .ac-filters { display:flex; gap:10px; flex-wrap:wrap; }
        .ac-select { padding:9px 14px; border:1.5px solid #ddd; border-radius:8px; font-size:13px; font-family:inherit; outline:none; background:#fff; cursor:pointer; }
        .ac-select:focus { border-color:#1f4d1f; }
        .ac-table { width:100%; background:#fff; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,.07); overflow:hidden; }
        .ac-table table { width:100%; border-collapse:collapse; }
        .ac-table th { background:#1f4d1f; color:#fff; padding:12px 16px; text-align:left; font-size:13px; font-weight:600; }
        .ac-table td { padding:12px 16px; border-bottom:1px solid #f0ece4; font-size:13px; color:#333; vertical-align:middle; }
        .ac-table tr:last-child td { border-bottom:none; }
        .ac-table tr:hover td { background:#f9f7f4; cursor:pointer; }
        .ac-badge { font-size:11px; font-weight:600; padding:3px 10px; border-radius:99px; }
        .ac-unread { background:#cc0000; color:#fff; font-size:10px; font-weight:700; padding:2px 7px; border-radius:99px; margin-left:6px; }
        .ac-empty  { text-align:center; padding:60px; color:#aaa; font-size:14px; }
        .ac-loading { text-align:center; padding:60px; color:#888; }
        .ac-toast  { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#1f4d1f; color:#fff; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:600; z-index:9999; }
        @media(max-width:700px) { .ac-main { padding:16px; margin-left:0; } .ac-sidebar { display:none; } .ac-table { overflow-x:auto; } }
      `}</style>

      <AdminLayout
            title="Complaints Management"
            headerActions={
              <>
                <NotificationBell />
                <div className="ac-filters">
              {userFilter && complaints.length > 0 && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#1f4d1f",
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  Filtering by:{" "}
                  {complaints[0].user?.name || "buyer #" + userFilter}{" "}
                  <span
                    style={{
                      color: "#cc0000",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    onClick={() => navigate("/admin/complaints")}
                  >
                    Clear
                  </span>
                </div>
              )}
              <select
                className="ac-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                className="ac-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="orders">Orders</option>
                <option value="loan">Loan</option>
              </select>
                </div>
              </>
            }
          >

          {loading ? (
            <div className="ac-loading">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="ac-empty">No complaints found.</div>
          ) : (
            <div className="ac-table">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Buyer</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/admin/complaints/${c.id}`)}
                    >
                      <td>
                        {c.subject}
                        {c.unread_count > 0 && (
                          <span className="ac-unread">
                            {c.unread_count} new
                          </span>
                        )}
                      </td>
                      <td>
                        {c.user?.name || "-"}
                        <br />
                        <span style={{ color: "#aaa", fontSize: 11 }}>
                          {c.user?.email}
                        </span>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>
                        {c.category}
                      </td>
                      <td>{c.type?.replace(/_/g, " ")}</td>
                      <td>
                        <span
                          className="ac-badge"
                          style={getStatusStyle(c.status)}
                        >
                          {c.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </AdminLayout>
      {toast && <div className="ac-toast">{toast}</div>}
    </>
  );
}
