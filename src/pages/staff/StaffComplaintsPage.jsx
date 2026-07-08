import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import NotificationBell from "../../components/buyer/NotificationBell";

const LOGO_PATH = "/achoice logo.png";

export default function StaffComplaintsPage() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  let user = null;
  try { user = JSON.parse(localStorage.getItem("user")); } catch {}

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

  const navItems = [
    ...(user?.can_manage_agro ? [{ icon: "📊", label: "Agro Dashboard", path: "/staff/agro" }] : []),
    ...(user?.can_manage_loans ? [{ icon: "💰", label: "Loan Dashboard", path: "/staff/loans" }] : []),
    { icon: "📋", label: "Complaints", path: "/staff/complaints", active: true },
  ];

  return (
    <>
      <style>{`
        .sc-shell { display:flex; min-height:100vh; background:#f0f2f5; font-family:'Segoe UI',sans-serif; }
        .sc-sidebar { width:240px; background:#1f4d1f; display:flex; flex-direction:column; position:fixed; top:0; left:0; height:100vh; }
        .sc-sidebar-logo { display:flex; align-items:center; gap:10px; padding:20px; border-bottom:1px solid rgba(255,255,255,0.1); }
        .sc-sidebar-logo img { width:40px; height:40px; object-fit:contain; }
        .sc-sidebar-name { font-size:14px; font-weight:700; color:#fff; }
        .sc-sidebar-sub { font-size:10px; color:#a8d5a8; }
        .sc-sidebar-nav { flex:1; padding:16px 0; }
        .sc-sidebar-item { display:flex; align-items:center; gap:10px; padding:12px 20px; color:#a8d5a8; font-size:14px; cursor:pointer; }
        .sc-sidebar-item-active { background:rgba(255,255,255,0.15); color:#fff; border-left:3px solid #f0c050; }
        .sc-sidebar-footer { padding:16px 20px; border-top:1px solid rgba(255,255,255,0.1); }
        .sc-staff-name { font-size:13px; font-weight:600; color:#fff; margin-bottom:2px; }
        .sc-staff-role { font-size:11px; color:#a8d5a8; margin-bottom:10px; }
        .sc-logout-btn { width:100%; padding:8px; background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; font-size:13px; cursor:pointer; font-family:inherit; }
        .sc-main { flex:1; margin-left:240px; padding:28px 32px; }
        .sc-topbar { display:flex; justify-content:flex-end; margin-bottom:16px; }
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
        .sc-hamburger { display:none; }
        .sc-backdrop { display:none; }
        .sc-sidebar-close { display:none; }
        @media(max-width:700px) {
          .sc-main { padding:16px; margin-left:0; }
          .sc-sidebar {
            width:min(280px,82vw);
            transform:translateX(-100%);
            transition:transform 0.25s ease;
            box-shadow:2px 0 16px rgba(0,0,0,0.25);
            z-index:600;
          }
          .sc-sidebar.sc-sidebar-open { transform:translateX(0); }
          .sc-hamburger {
            display:flex; align-items:center; justify-content:center;
            width:40px; height:40px; border-radius:10px; border:1px solid #e8e4dc;
            background:#fff; font-size:18px; cursor:pointer; flex-shrink:0;
          }
          .sc-backdrop.sc-backdrop-open {
            display:block; position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:550;
          }
          .sc-sidebar-close { display:block; margin-left:auto; background:none; border:none; color:#fff; font-size:18px; cursor:pointer; }
          .sc-topbar { justify-content:space-between; }
        }
      `}</style>

      <div className="sc-shell">
        {mobileNavOpen && (
          <div className="sc-backdrop sc-backdrop-open" onClick={() => setMobileNavOpen(false)} />
        )}
        <div className={"sc-sidebar" + (mobileNavOpen ? " sc-sidebar-open" : "")}>
          <div className="sc-sidebar-logo">
            <img src={LOGO_PATH} alt="Achoice" />
            <div>
              <div className="sc-sidebar-name">ACHOICE</div>
              <div className="sc-sidebar-sub">Staff Panel</div>
            </div>
            <button className="sc-sidebar-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">✕</button>
          </div>
          <nav className="sc-sidebar-nav">
            {navItems.map((item) => (
              <div
                key={item.label}
                className={"sc-sidebar-item" + (item.active ? " sc-sidebar-item-active" : "")}
                onClick={() => { navigate(item.path); setMobileNavOpen(false); }}
              >
                <span>{item.icon}</span> {item.label}
              </div>
            ))}
          </nav>
          <div className="sc-sidebar-footer">
            <div className="sc-staff-name">{user?.name}</div>
            <div className="sc-staff-role">Staff</div>
            <button
              className="sc-logout-btn"
              onClick={() => { localStorage.clear(); navigate("/login"); }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="sc-main">
          <div className="sc-topbar">
            <button className="sc-hamburger" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">☰</button>
            <NotificationBell />
          </div>

          <div className="sc-header">
            <div className="sc-title">My Complaints</div>
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
                      <td>{c.user?.name || "-"}</td>
                      <td style={{textTransform:"capitalize"}}>{c.category}</td>
                      <td><span className="sc-badge" style={getStatusStyle(c.status)}>{c.status?.replace(/_/g," ")}</span></td>
                      <td>{c.created_at ? new Date(c.created_at).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {toast && <div className="sc-toast">{toast}</div>}
    </>
  );
}
