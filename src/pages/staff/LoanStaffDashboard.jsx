import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";

const LOGO_PATH = "/achoice logo.png";

export default function LoanStaffDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "dashboard",
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState("");

  // Sidebar red-alert badges — same pattern as AdminLayout/AgroStaffDashboard
  const [badges, setBadges] = useState({});

  // Dashboard
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [loanSettings, setLoanSettings] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // Applications
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appFilter, setAppFilter] = useState("all");
  const [appSearch, setAppSearch] = useState("");
  const [disbursing, setDisbursing] = useState(null);

  // Approval modal
  const [approvalModal, setApprovalModal] = useState(null);
  const [approvalDuration, setApprovalDuration] = useState("");
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(null);

  // Documents
  const [expandedDocs, setExpandedDocs] = useState(null);
  const [docsMap, setDocsMap] = useState({});
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docForm, setDocForm] = useState({ type: "nin_document", file: null });

  // Repayments
  const [repayments, setRepayments] = useState([]);
  const [repaymentsLoading, setRepaymentsLoading] = useState(false);
  const [repaySearch, setRepaySearch] = useState("");

  // User History
  const [userHistory, setUserHistory] = useState(null);
  const [userHistoryLoading, setUserHistoryLoading] = useState(false);
  const [userIdInput, setUserIdInput] = useState("");

  // Repayment schedule modal (view-only, same endpoint admin uses)
  const [scheduleModal, setScheduleModal] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {}

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };
  const toMoney = (val) => `₦${Number(val || 0).toLocaleString()}`;
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";
  const interestRate = Number(
    loanSettings?.default_interest || loanSettings?.interest_rate || 0,
  );

  // Load settings + stats
  const loadStats = () => {
    setStatsLoading(true);
    setStatsError(null);
    api
      .get("/staff/loan/dashboard")
      .then((r) => setStats(r.data))
      .catch((err) =>
        setStatsError(
          err.response?.status === 403
            ? "You don't have access to the Loan Staff dashboard."
            : "Failed to load dashboard stats.",
        ),
      )
      .finally(() => setStatsLoading(false));
  };

  useEffect(() => {
    loadStats();
    api
      .get("/settings/loan")
      .then((r) => setLoanSettings(r.data))
      .catch(() => {});
  }, []);

  // Sidebar red-alert badge — pending applications awaiting a decision
  // NOTE: like the dashboard stats fetch above, this silently no-ops on
  // failure — intentionally not toasted since it's a passive background
  // fetch, not a user-initiated action. If it never appears, check for the
  // same 403/role-mismatch cause as the stats error first.
  useEffect(() => {
    api
      .get("/staff/loan/applications", {
        params: { status: "pending", per_page: 1 },
      })
      .then((res) => {
        const total =
          res.data?.total ??
          (Array.isArray(res.data) ? res.data.length : res.data?.data?.length) ??
          0;
        setBadges((prev) => ({ ...prev, applications: total }));
      })
      .catch(() => {});
  }, []);

  // Load tab data
  useEffect(() => {
    if (activeTab === "applications") {
      setAppsLoading(true);
      api
        .get("/staff/loan/applications", { params: { per_page: 500 } })
        .then((r) => setApplications(r.data?.data || r.data || []))
        .catch(() => showToast("Failed to load applications."))
        .finally(() => setAppsLoading(false));
    }
    if (activeTab === "repayments") {
      setRepaymentsLoading(true);
      api
        .get("/staff/loan/repayments")
        .then((r) => setRepayments(r.data?.data || r.data || []))
        .catch(() => showToast("Failed to load repayments."))
        .finally(() => setRepaymentsLoading(false));
    }
  }, [activeTab]);

  // Auto-load documents for all applications
  useEffect(() => {
    if (applications.length === 0) return;
    applications.forEach((app) => {
      if (docsMap[app.id] === undefined) {
        api
          .get(`/loans/${app.id}/documents`)
          .then((r) => {
            const raw = r.data?.documents || r.data?.data || r.data;
            setDocsMap((prev) => ({
              ...prev,
              [app.id]: Array.isArray(raw) ? raw : [],
            }));
          })
          .catch(() => setDocsMap((prev) => ({ ...prev, [app.id]: [] })));
      }
    });
  }, [applications]);

  // Seller live search — try both endpoints
  const handleOpenApproval = (app) => {
    setApprovalModal(app);
    setApprovalDuration(
      loanSettings?.durations?.[0]?.months?.toString() || "6",
    );
  };

  const handleConfirmApproval = async () => {
    if (!approvalModal) return;
    if (!approvalDuration) return showToast("Please select a loan duration.");
    setApproving(true);
    try {
      await api.patch(`/staff/loan/applications/${approvalModal.id}/decision`, {
        decision: "approved",
        interest_rate: interestRate,
        duration_months: Number(approvalDuration),
      });
      setApplications((p) =>
        p.map((a) =>
          a.id === approvalModal.id ? { ...a, status: "approved" } : a,
        ),
      );
      setApprovalModal(null);
      showToast("✅ Loan approved! Buyer notified.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve loan.");
    } finally {
      setApproving(false);
    }
  };

  // Reject
  const handleReject = async (loanId) => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;
    setRejecting(loanId);
    try {
      await api.patch(`/staff/loan/applications/${loanId}/decision`, {
        decision: "rejected",
        rejection_reason: reason,
      });
      setApplications((p) =>
        p.map((a) =>
          a.id === loanId
            ? { ...a, status: "rejected", rejection_reason: reason }
            : a,
        ),
      );
      showToast("Loan rejected. Buyer notified.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject loan.");
    } finally {
      setRejecting(null);
    }
  };

  // Disburse
  const handleDisburse = async (loan) => {
    if (
      !window.confirm(
        `Confirm disbursement for ${loan.user?.name}?\n\nAmount: ₦${Number(loan.amount).toLocaleString()}\n\n⚠️ Only confirm AFTER manually transferring the money.`,
      )
    )
      return;
    setDisbursing(loan.id);
    try {
      await api.patch(`/admin/loans/${loan.id}/disburse`);
      setApplications((p) =>
        p.map((a) =>
          a.id === loan.id
            ? {
                ...a,
                status: "disbursed",
                disbursed_at: new Date().toISOString(),
              }
            : a,
        ),
      );
      showToast("✅ Loan disbursed! Repayment schedule activated.");
    } catch (err) {
      showToast(err.response?.data?.message || "Disbursement failed.");
    } finally {
      setDisbursing(null);
    }
  };

  // Documents
  const handleViewDocs = async (loanId) => {
    if (expandedDocs === loanId) {
      setExpandedDocs(null);
      return;
    }
    setExpandedDocs(loanId);
    setDocsLoading(true);
    try {
      const r = await api.get(`/loans/${loanId}/documents`);
      const raw = r.data?.documents || r.data?.data || r.data;
      setDocsMap((p) => ({ ...p, [loanId]: Array.isArray(raw) ? raw : [] }));
    } catch {
      setDocsMap((p) => ({ ...p, [loanId]: [] }));
    } finally {
      setDocsLoading(false);
    }
  };

  const handleVerifyDoc = async (docId, loanId) => {
    try {
      await api.patch(`/loans/documents/${docId}/verify`);
      setDocsMap((prev) => ({
        ...prev,
        [loanId]: (prev[loanId] || []).map((d) =>
          d.id === docId ? { ...d, is_verified: true } : d,
        ),
      }));
      showToast("✅ Document verified!");
    } catch {
      showToast("Failed to verify document.");
    }
  };

  const handleUploadDoc = async (loanId) => {
    if (!docForm.file) return showToast("Please select a file.");
    setUploadingDoc(true);
    const form = new FormData();
    form.append("document", docForm.file);
    form.append("type", docForm.type);
    form.append("description", docForm.type.replace(/_/g, " "));
    try {
      await api.post(`/loans/${loanId}/documents`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("✅ Document uploaded!");
      setDocForm({ type: "nin_document", file: null });
      const r = await api.get(`/loans/${loanId}/documents`);
      const raw = r.data?.documents || r.data?.data || r.data;
      setDocsMap((p) => ({ ...p, [loanId]: Array.isArray(raw) ? raw : [] }));
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Upload failed. Accepted: JPG, PNG, PDF, DOC, DOCX.",
      );
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId, loanId) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await api.delete(`/loans/documents/${docId}`);
      setDocsMap((p) => ({
        ...p,
        [loanId]: (p[loanId] || []).filter((d) => d.id !== docId),
      }));
      showToast("Document deleted.");
    } catch {
      showToast("Failed to delete.");
    }
  };

  // User History
  const handleViewUserHistory = async () => {
    if (!userIdInput) return;
    setUserHistoryLoading(true);
    setUserHistory(null);
    try {
      const r = await api.get(`/staff/loan/users/${userIdInput}/history`);
      setUserHistory(r.data);
    } catch {
      showToast("User not found or has no loan history.");
    } finally {
      setUserHistoryLoading(false);
    }
  };

  // Apply on Behalf
  const handleViewSchedule = async (loan) => {
    setScheduleModal(loan);
    setScheduleLoading(true);
    setScheduleData(null);
    try {
      const res = await api.get(`/staff/loans/${loan.id}/installments`);
      setScheduleData(res.data);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to load repayment schedule.",
      );
    } finally {
      setScheduleLoading(false);
    }
  };

  // Reports — fetch ALL records with ?all=1
  const handleDownloadReport = async (format) => {
    setDownloading(true);
    try {
      const res = await api.get("/staff/loan/applications", {
        params: { all: 1 },
      });
      const allApps = res.data?.data || res.data || [];
      if (allApps.length === 0)
        return showToast("No applications to download.");
      if (format === "csv") generateCSV(allApps);
      else if (format === "excel") generateExcel(allApps);
      else generatePDF(allApps);
    } catch {
      // Fallback to loaded applications if all=1 fails
      if (applications.length === 0)
        return showToast(
          "No applications to download. Visit Applications tab first.",
        );
      if (format === "csv") generateCSV(applications);
      else if (format === "excel") generateExcel(applications);
      else generatePDF(applications);
    } finally {
      setDownloading(false);
    }
  };

  const generateCSV = (apps) => {
    const rows = [
      [
        "#",
        "Applicant",
        "Email",
        "Phone",
        "Amount",
        "Purpose",
        "Duration",
        "Interest",
        "Total",
        "Monthly",
        "Status",
        "Applied",
        "Disbursed",
        "Due",
        "Paid",
        "Balance",
      ],
      ...apps.map((a, i) => [
        i + 1,
        a.user?.name || "",
        a.user?.email || "",
        a.user?.phone || "",
        Number(a.amount || 0),
        a.purpose || "",
        `${a.duration_months || 0} months`,
        `${a.interest_rate || interestRate}%`,
        Number(a.total_repayable || 0),
        Number(a.monthly_instalment || 0),
        a.status || "",
        fmtDate(a.created_at),
        fmtDate(a.disbursed_at),
        fmtDate(a.due_date),
        Number(a.amount_paid || 0),
        Number(a.balance || 0),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
    );
    a.download = `loan-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const generateExcel = (apps) => {
    const rows = [
      [
        "#",
        "Applicant",
        "Email",
        "Phone",
        "Amount",
        "Purpose",
        "Duration",
        "Interest",
        "Total",
        "Monthly",
        "Status",
        "Applied",
        "Disbursed",
        "Due",
        "Paid",
        "Balance",
      ],
      ...apps.map((a, i) => [
        i + 1,
        a.user?.name || "",
        a.user?.email || "",
        a.user?.phone || "",
        Number(a.amount || 0),
        a.purpose || "",
        `${a.duration_months || 0} months`,
        `${a.interest_rate || interestRate}%`,
        Number(a.total_repayable || 0),
        Number(a.monthly_instalment || 0),
        a.status || "",
        fmtDate(a.created_at),
        fmtDate(a.disbursed_at),
        fmtDate(a.due_date),
        Number(a.amount_paid || 0),
        Number(a.balance || 0),
      ]),
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([rows.map((r) => r.join("\t")).join("\n")], {
        type: "application/vnd.ms-excel",
      }),
    );
    a.download = `loan-report-${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
  };

  const generatePDF = (apps) => {
    const today = new Date().toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const rows = apps
      .map(
        (a, i) => `
      <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#fff"}">
        <td>${i + 1}</td>
        <td><div style="font-weight:600">${a.user?.name || "—"}</div><div style="font-size:10px;color:#888">${a.user?.email || ""}</div></td>
        <td>₦${Number(a.amount || 0).toLocaleString()}</td>
        <td>${a.purpose || "—"}</td>
        <td>${a.duration_months || "—"}mo</td>
        <td>${a.interest_rate || interestRate}%</td>
        <td>₦${Number(a.total_repayable || 0).toLocaleString()}</td>
        <td>₦${Number(a.monthly_instalment || 0).toLocaleString()}</td>
        <td style="color:${a.status === "completed" ? "#1a7a3a" : a.status === "rejected" ? "#cc0000" : "#b36b00"};font-weight:600">${a.status || "—"}</td>
        <td>₦${Number(a.amount_paid || 0).toLocaleString()}</td>
        <td>₦${Number(a.balance || 0).toLocaleString()}</td>
        <td>${fmtDate(a.created_at)}</td>
      </tr>`,
      )
      .join("");
    const win = window.open("", "_blank");
    if (!win) return showToast("Allow popups to download PDF.");
    win.document
      .write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ACHOICE Loan Report</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial;padding:28px;font-size:11px}
      h1{font-size:18px;color:#1f4d1f;margin-bottom:4px}
      table{width:100%;border-collapse:collapse;font-size:10px;margin-top:16px}
      th{background:#1f4d1f;color:#fff;padding:7px 8px;text-align:left;font-size:9px}
      td{padding:6px 8px;border-bottom:1px solid #eee}
      @media print{body{padding:16px}}</style></head>
      <body>
      <h1>ACHOICE LIMITED — Loan Report</h1>
      <p style="color:#888;font-size:11px;margin-top:4px">Generated: ${today} · Staff: ${user?.name || "Staff"} · Interest: ${interestRate}% · Total: ${apps.length} applications</p>
      <table><thead><tr>
        <th>#</th><th>Applicant</th><th>Amount</th><th>Purpose</th><th>Duration</th>
        <th>Rate</th><th>Total Repayable</th><th>Monthly</th><th>Status</th><th>Paid</th><th>Balance</th><th>Applied</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <p style="margin-top:20px;font-size:10px;color:#aaa;text-align:center">ACHOICE LIMITED · Confidential · ${today}</p>
      <script>window.onload=()=>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
    win.document.close();
  };

  const getStatusStyle = (status) =>
    ({
      pending: { background: "#fff8e7", color: "#b36b00" },
      approved: { background: "#eafaf0", color: "#1a7a3a" },
      disbursed: { background: "#e7f0ff", color: "#1a4fa0" },
      active: { background: "#e7f0ff", color: "#1a4fa0" },
      rejected: { background: "#fff0f0", color: "#cc0000" },
      completed: { background: "#f0f0f0", color: "#555" },
      successful: { background: "#eafaf0", color: "#1a7a3a" },
      failed: { background: "#fff0f0", color: "#cc0000" },
    })[status] || { background: "#f0f0f0", color: "#555" };

  // ✅ Fixed: use correct type values from API
  const docTypeIcon = (t) =>
    ({
      nin_document: "🪪",
      bvn_document: "🏦",
      statement_of_account: "📊",
      collateral_document: "🏠",
      collateral_image: "📸",
      other: "📄",
    })[t] || "📄";

  const docTypeLabel = (t) =>
    ({
      nin_document: "NIN Document",
      bvn_document: "BVN Document",
      statement_of_account: "Bank Statement",
      collateral_document: "Collateral",
      collateral_image: "Collateral Image",
      other: "Other",
    })[t] || (t || "Document").replace(/_/g, " ");

  const filteredApps = applications
    .filter((a) => appFilter === "all" || a.status === appFilter)
    .filter(
      (a) =>
        !appSearch ||
        (a.user?.name || "").toLowerCase().includes(appSearch.toLowerCase()) ||
        (a.purpose || "").toLowerCase().includes(appSearch.toLowerCase()),
    );

  const filteredRepayments = repayments.filter(
    (r) =>
      !repaySearch ||
      (r.user?.name || r.loan?.user?.name || "")
        .toLowerCase()
        .includes(repaySearch.toLowerCase()) ||
      (r.payment_reference || "")
        .toLowerCase()
        .includes(repaySearch.toLowerCase()),
  );

  const approvalPreview = (() => {
    if (!approvalModal || !approvalDuration) return null;
    const amount = Number(approvalModal.amount);
    const months = Number(approvalDuration);
    const interest = (amount * interestRate) / 100;
    const total = amount + interest;
    return {
      amount,
      months,
      interest,
      total,
      monthly: Math.ceil(total / months),
    };
  })();

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .loan-staff-sidebar {
            width: min(280px, 82vw) !important;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: 2px 0 16px rgba(0,0,0,0.25);
            z-index: 600;
          }
          .loan-staff-sidebar.loan-sidebar-open { transform: translateX(0); }
          .loan-staff-main { margin-left: 0 !important; padding: 16px !important; }
          .loan-staff-hamburger {
            display: flex !important; align-items: center; justify-content: center;
            width: 40px; height: 40px; border-radius: 10px; border: 1px solid #e8e4dc;
            background: #fff; font-size: 18px; cursor: pointer; flex-shrink: 0;
          }
          .loan-sidebar-close { display: block !important; }
          .loan-backdrop-open {
            display: block !important; position: fixed; inset: 0;
            background: rgba(0,0,0,0.45); z-index: 550;
          }
        }
      `}</style>
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {mobileNavOpen && (
        <div className="loan-backdrop-open" style={{ display: "none" }} onClick={() => setMobileNavOpen(false)} />
      )}

      {/* Approval Modal */}
      {approvalModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalBox}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>✓ Approve Loan Application</h2>
              <button
                style={s.modalClose}
                onClick={() => setApprovalModal(null)}
              >
                ✕
              </button>
            </div>
            <div style={s.modalBody}>
              <div style={s.modalLoanInfo}>
                <div style={s.modalLoanAmount}>
                  ₦{Number(approvalModal.amount).toLocaleString()}
                </div>
                <div style={s.modalLoanMeta}>
                  👤 {approvalModal.user?.name} · {approvalModal.purpose}
                </div>
              </div>
              <div style={s.modalField}>
                <div style={s.modalLabel}>
                  Interest Rate{" "}
                  <span style={s.modalLabelNote}>— from Loan Settings</span>
                </div>
                <div style={s.interestDisplay}>
                  <span style={s.interestDisplayRate}>{interestRate}%</span>
                  <span style={s.interestDisplayNote}>
                    {" "}
                    flat rate (cannot be changed)
                  </span>
                </div>
              </div>
              <div style={s.modalField}>
                <div style={s.modalLabel}>
                  Loan Duration{" "}
                  <span style={s.modalLabelNote}>
                    — select from approved options
                  </span>
                </div>
                {loanSettings?.durations?.length > 0 ? (
                  <div style={s.durationGrid}>
                    {loanSettings.durations.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        style={{
                          ...s.durationBtn,
                          ...(Number(approvalDuration) === d.months
                            ? s.durationBtnActive
                            : {}),
                        }}
                        onClick={() => setApprovalDuration(d.months.toString())}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    style={s.modalInput}
                    type="number"
                    value={approvalDuration}
                    onChange={(e) => setApprovalDuration(e.target.value)}
                    placeholder="e.g. 6"
                  />
                )}
              </div>
              {approvalPreview && (
                <div style={s.previewBox}>
                  <div style={s.previewBoxTitle}>📊 Loan Summary Preview</div>
                  <div style={s.previewBoxGrid}>
                    {[
                      [
                        "Principal",
                        `₦${approvalPreview.amount.toLocaleString()}`,
                      ],
                      [
                        `Interest (${interestRate}%)`,
                        `₦${approvalPreview.interest.toLocaleString()}`,
                      ],
                      [
                        "Total Repayable",
                        `₦${approvalPreview.total.toLocaleString()}`,
                      ],
                      [
                        "Monthly Instalment",
                        `₦${approvalPreview.monthly.toLocaleString()}`,
                      ],
                      ["Duration", `${approvalPreview.months} months`],
                    ].map(([label, val]) => (
                      <div key={label} style={s.previewBoxItem}>
                        <div style={s.previewBoxLabel}>{label}</div>
                        <div style={s.previewBoxVal}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={s.modalFooter}>
              <button
                style={s.modalCancelBtn}
                onClick={() => setApprovalModal(null)}
              >
                Cancel
              </button>
              <button
                style={
                  approving || !approvalDuration
                    ? s.modalApproveBtnDisabled
                    : s.modalApproveBtn
                }
                onClick={handleConfirmApproval}
                disabled={approving || !approvalDuration}
              >
                {approving ? "⏳ Processing..." : "✓ Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repayment Schedule Modal (view-only) */}
      {scheduleModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalBox}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>📋 Repayment Schedule</h2>
              <button
                style={s.modalClose}
                onClick={() => {
                  setScheduleModal(null);
                  setScheduleData(null);
                }}
              >
                ✕
              </button>
            </div>
            <div style={s.modalBody}>
              <div style={s.modalLoanInfo}>
                <div style={s.modalLoanAmount}>
                  {toMoney(scheduleModal.amount)}
                </div>
                <div style={s.modalLoanMeta}>
                  👤 {scheduleModal.user?.name} · {scheduleModal.purpose}
                </div>
              </div>

              {scheduleLoading ? (
                <p style={s.loading}>Loading schedule...</p>
              ) : !scheduleData?.schedule?.length ? (
                <p style={s.loading}>No installments found for this loan.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["#", "Due Date", "Amount Due", "Paid", "Status"].map(
                          (h) => (
                            <th
                              key={h}
                              style={{
                                textAlign: "left",
                                fontSize: 11,
                                color: "#888",
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                padding: "8px 6px",
                                borderBottom: "2px solid #f0f0f0",
                              }}
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleData.schedule.map((inst) => (
                        <tr key={inst.installment_number}>
                          <td style={{ padding: "10px 6px", fontSize: 13 }}>
                            {inst.installment_number}
                          </td>
                          <td style={{ padding: "10px 6px", fontSize: 13 }}>
                            {fmtDate(inst.due_date)}
                          </td>
                          <td style={{ padding: "10px 6px", fontSize: 13 }}>
                            {toMoney(inst.total_payable)}
                          </td>
                          <td style={{ padding: "10px 6px", fontSize: 13 }}>
                            {toMoney(inst.amount_paid)}
                          </td>
                          <td style={{ padding: "10px 6px", fontSize: 13 }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "3px 10px",
                                borderRadius: 99,
                                textTransform: "capitalize",
                                background:
                                  inst.status === "paid"
                                    ? "#eafaf0"
                                    : inst.status === "overdue"
                                      ? "#fdecec"
                                      : "#f0f0f0",
                                color:
                                  inst.status === "paid"
                                    ? "#1a7a3a"
                                    : inst.status === "overdue"
                                      ? "#cc0000"
                                      : "#666",
                              }}
                            >
                              {inst.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={"loan-staff-sidebar" + (mobileNavOpen ? " loan-sidebar-open" : "")} style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <img src={LOGO_PATH} alt="Achoice" style={s.logoImg} />
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Loan Staff</div>
          </div>
          <button
            className="loan-sidebar-close"
            style={{ display: "none", marginLeft: "auto", background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav style={s.sidebarNav}>
          {[
            { icon: "📊", label: "Dashboard", tab: "dashboard" },
            {
              icon: "📋",
              label: "Applications",
              tab: "applications",
              badgeKey: "applications",
            },
            { icon: "💳", label: "Repayments", tab: "repayments" },
            { icon: "🔍", label: "User History", tab: "history" },
            { icon: "📋", label: "Complaints", path: "/staff/complaints" },
          ].map((item) => (
            <div
              key={item.tab || item.path}
              style={{
                ...s.sidebarItem,
                ...(activeTab === item.tab ? s.sidebarItemActive : {}),
              }}
              onClick={() => {
                item.path ? navigate(item.path) : setActiveTab(item.tab);
                setMobileNavOpen(false);
              }}
            >
              <span>{item.icon}</span> {item.label}
              {item.badgeKey && badges[item.badgeKey] > 0 && (
                <span style={s.navBadge}>{badges[item.badgeKey]}</span>
              )}
            </div>
          ))}

          {/* Combined dashboard: staff with both can_manage_loans and
              can_manage_agro see the Agro Staff nav here too. Items navigate
              to the Agro Staff dashboard's own route/tab rather than
              rendering its content inline — the two dashboards stay
              separate pages, this just surfaces both nav sections together. */}
          {(user?.staff_profile?.can_manage_agro || user?.role === "admin") && (
            <>
              <div style={s.navSectionLabel}>Agro/Sales Staff</div>
              {[
                { icon: "📊", label: "Agro Dashboard", path: "/staff/agro" },
                {
                  icon: "📦",
                  label: "Orders",
                  path: "/staff/agro?tab=orders",
                },
                {
                  icon: "🏪",
                  label: "Sellers",
                  path: "/staff/agro?tab=sellers",
                },
                {
                  icon: "💸",
                  label: "Remittances",
                  path: "/staff/agro?tab=remittances",
                },
              ].map((item) => (
                <div
                  key={item.path}
                  style={s.sidebarItem}
                  onClick={() => {
                    navigate(item.path);
                    setMobileNavOpen(false);
                  }}
                >
                  <span>{item.icon}</span> {item.label}
                </div>
              ))}
            </>
          )}
        </nav>
        <div style={s.sidebarFooter}>
          <div style={s.staffName}>{user?.name}</div>
          <div style={s.staffRole}>
            {user?.role === "admin" ? "Administrator" : "Loan Staff"}
          </div>
          {user?.role === "admin" && (
            <button
              style={s.adminBackBtn}
              onClick={() => navigate("/admin/dashboard")}
            >
              ⬅ Admin Dashboard
            </button>
          )}
          <button
            style={s.logoutBtn}
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="loan-staff-main" style={s.main}>
        <button
          className="loan-staff-hamburger"
          style={{ display: "none", marginBottom: 16 }}
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div>
            <h1 style={s.pageTitle}>My Loan Dashboard</h1>
            <p style={s.pageSub}>
              Welcome, {user?.name?.split(" ")[0]}.&nbsp; Interest rate:{" "}
              <strong style={{ color: "#1f4d1f" }}>
                {interestRate || "—"}%
              </strong>{" "}
              flat (from loan settings)
            </p>

            <div style={s.sectionLabel}>Dashboard Summary</div>
            {stats ? (
              <div style={s.statsGrid}>
                {[
                  {
                    label: "Total Applications",
                    value: stats.applications?.total || 0,
                    icon: "📋",
                    color: "#1f4d1f",
                  },
                  {
                    label: "Pending Review",
                    value: stats.applications?.pending || 0,
                    icon: "⏳",
                    color: "#b36b00",
                  },
                  {
                    label: "Approved",
                    value: stats.applications?.approved || 0,
                    icon: "✅",
                    color: "#1a7a3a",
                  },
                  {
                    label: "Rejected",
                    value: stats.applications?.rejected || 0,
                    icon: "❌",
                    color: "#cc0000",
                  },
                  {
                    label: "Disbursed",
                    value: stats.applications?.disbursed || 0,
                    icon: "💸",
                    color: "#1a4fa0",
                  },
                  {
                    label: "Completed",
                    value: stats.applications?.completed || 0,
                    icon: "🎉",
                    color: "#555",
                  },
                  {
                    label: "Total Collected",
                    value: toMoney(stats.repayments?.total_collected),
                    icon: "💰",
                    color: "#1a7a3a",
                  },
                  {
                    label: "Overdue Loans",
                    value: stats.repayments?.overdue_loans || 0,
                    icon: "⚠️",
                    color: "#cc0000",
                  },
                  {
                    label: "Docs Pending Review",
                    value: stats.documents?.pending_review || 0,
                    icon: "📄",
                    color: "#b36b00",
                  },
                ].map((stat) => (
                  <div key={stat.label} style={s.statCard}>
                    <div style={s.statTop}>
                      <div style={s.statLabel}>{stat.label}</div>
                      <div style={s.statIcon}>{stat.icon}</div>
                    </div>
                    <div style={{ ...s.statValue, color: stat.color }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : statsError ? (
              <div
                style={{
                  background: "#fff0f0",
                  border: "1px solid #f3b3b3",
                  borderRadius: 10,
                  padding: "14px 16px",
                  color: "#a81f1f",
                  fontSize: 13.5,
                }}
              >
                ⚠️ {statsError}{" "}
                <span
                  style={{ textDecoration: "underline", cursor: "pointer", fontWeight: 600 }}
                  onClick={loadStats}
                >
                  Try again
                </span>
              </div>
            ) : (
              <p style={s.loading}>
                {statsLoading ? "Loading dashboard stats..." : "No data available."}
              </p>
            )}

            <div style={s.quickActions}>
              <div style={s.quickActionsTitle}>Quick Actions</div>
              <div style={s.quickActionsRow}>
                <button
                  style={s.quickBtn}
                  onClick={() => {
                    setActiveTab("applications");
                    setAppFilter("pending");
                  }}
                >
                  ⏳ Review Pending ({stats?.applications?.pending || 0})
                </button>
                <button
                  style={s.quickBtn}
                  onClick={() => setActiveTab("repayments")}
                >
                  💳 View Repayments
                </button>
              </div>
            </div>

            <div style={s.reportsCard}>
              <div style={s.reportsCardTitle}>📊 Download Loan Reports</div>
              <div style={s.reportsCardSub}>
                Downloads all applications directly from server
              </div>
              <div style={s.downloadBtns}>
                <button
                  style={
                    downloading
                      ? s.dlBtnDisabled
                      : { ...s.dlBtn, background: "#cc0000" }
                  }
                  onClick={() => handleDownloadReport("pdf")}
                  disabled={downloading}
                >
                  {downloading ? "⏳ Preparing..." : "📄 PDF"}
                </button>
                <button
                  style={
                    downloading
                      ? s.dlBtnDisabled
                      : { ...s.dlBtn, background: "#217346" }
                  }
                  onClick={() => handleDownloadReport("excel")}
                  disabled={downloading}
                >
                  {downloading ? "⏳ Preparing..." : "📊 Excel"}
                </button>
                <button
                  style={
                    downloading
                      ? s.dlBtnDisabled
                      : { ...s.dlBtn, background: "#1a4fa0" }
                  }
                  onClick={() => handleDownloadReport("csv")}
                  disabled={downloading}
                >
                  {downloading ? "⏳ Preparing..." : "📋 CSV"}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* APPLICATIONS */}
        {activeTab === "applications" && (
          <div>
            <h1 style={s.pageTitle}>Loan Applications</h1>
            <div style={s.filterRow}>
              <div style={s.filterTabs}>
                {[
                  "all",
                  "pending",
                  "approved",
                  "disbursed",
                  "active",
                  "rejected",
                  "completed",
                ].map((tab) => (
                  <button
                    key={tab}
                    style={appFilter === tab ? s.filterTabActive : s.filterTab}
                    onClick={() => setAppFilter(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab !== "all" &&
                      applications.filter((a) => a.status === tab).length >
                        0 && (
                        <span style={s.tabCount}>
                          {applications.filter((a) => a.status === tab).length}
                        </span>
                      )}
                  </button>
                ))}
              </div>
              <input
                style={s.searchInput}
                placeholder="Search by name or purpose..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
              />
            </div>

            {appsLoading && <p style={s.loading}>Loading applications...</p>}

            {filteredApps.map((app) => {
              const appDocs = docsMap[app.id] || [];
              const verifiedCount = appDocs.filter((d) => d.is_verified).length;
              return (
                <div key={app.id} style={s.appCard}>
                  <div style={s.appHeader}>
                    <div>
                      <div style={s.appAmount}>{toMoney(app.amount)}</div>
                      <div style={s.appMeta}>
                        👤 {app.user?.name} · ✉ {app.user?.email}
                        {app.user?.phone && ` · 📞 ${app.user.phone}`}
                      </div>
                      <div style={s.appPurpose}>{app.purpose}</div>
                    </div>
                    <div style={s.appHeaderRight}>
                      <div
                        style={{
                          ...s.statusBadge,
                          ...getStatusStyle(app.status),
                        }}
                      >
                        {app.status}
                      </div>
                      <div style={s.appDate}>{fmtDate(app.created_at)}</div>
                    </div>
                  </div>

                  <div style={s.appDetails}>
                    {[
                      ["Duration", `${app.duration_months || "—"} months`],
                      [
                        "Interest Rate",
                        app.interest_rate
                          ? `${app.interest_rate}%`
                          : `${interestRate}% (default)`,
                      ],
                      ["Total Repayable", toMoney(app.total_repayable)],
                      ["Monthly Instalment", toMoney(app.monthly_instalment)],
                      ["Amount Paid", toMoney(app.amount_paid)],
                      ["Balance", toMoney(app.balance)],
                      ["Disbursed", fmtDate(app.disbursed_at)],
                      ["Due Date", fmtDate(app.due_date)],
                    ].map(([label, val]) => (
                      <div key={label} style={s.appDetail}>
                        <div style={s.appDetailLabel}>{label}</div>
                        <div style={s.appDetailVal}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {(app.nin_number || app.bvn_number) && (
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        marginBottom: 14,
                        flexWrap: "wrap",
                      }}
                    >
                      {app.nin_number && (
                        <span
                          style={{
                            fontSize: 12,
                            background: "#e7f0ff",
                            color: "#1a4fa0",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontWeight: 600,
                          }}
                        >
                          🪪 NIN: {app.nin_number}
                        </span>
                      )}
                      {app.bvn_number && (
                        <span
                          style={{
                            fontSize: 12,
                            background: "#e7f0ff",
                            color: "#1a4fa0",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontWeight: 600,
                          }}
                        >
                          🏦 BVN: {app.bvn_number}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {app.status === "pending" && (
                    <div style={s.actionGroup}>
                      <div style={s.actionGroupLabel}>
                        Review this application — {appDocs.length} document(s)
                        uploaded, {verifiedCount} verified
                      </div>
                      <div style={s.actionBtns}>
                        <button
                          style={s.approveBtn}
                          onClick={() => handleOpenApproval(app)}
                        >
                          ✓ Approve Loan
                        </button>
                        <button
                          style={
                            rejecting === app.id
                              ? s.rejectBtnDisabled
                              : s.rejectBtn
                          }
                          onClick={() => handleReject(app.id)}
                          disabled={rejecting === app.id}
                        >
                          {rejecting === app.id ? "Processing..." : "✕ Reject"}
                        </button>
                      </div>
                    </div>
                  )}

                  {app.status === "approved" && (
                    <div style={s.actionGroup}>
                      <div style={s.actionGroupLabel}>
                        Step 2 — Disburse (only after manual bank transfer)
                      </div>
                      <div style={s.borrowerBox}>
                        👤 {app.user?.name} · ✉ {app.user?.email}
                        {app.user?.phone && ` · 📞 ${app.user?.phone}`}
                      </div>
                      <button
                        style={
                          disbursing === app.id
                            ? s.disburseBtnDisabled
                            : s.disburseBtn
                        }
                        onClick={() => handleDisburse(app)}
                        disabled={disbursing === app.id}
                      >
                        {disbursing === app.id
                          ? "⏳ Processing..."
                          : "💸 Confirm Disbursement & Activate Repayment Schedule"}
                      </button>
                    </div>
                  )}

                  {(app.status === "disbursed" || app.status === "active") && (
                    <div style={s.activeNote}>
                      {app.status === "disbursed"
                        ? "✅ Disbursed — repayment schedule active."
                        : "🔄 Active — borrower making repayments."}
                      {Number(app.amount_paid) > 0 && (
                        <span style={{ marginLeft: 12, fontWeight: 600 }}>
                          Paid: {toMoney(app.amount_paid)} · Balance:{" "}
                          {toMoney(app.balance)}
                        </span>
                      )}
                      <button
                        style={s.scheduleLinkBtn}
                        onClick={() => handleViewSchedule(app)}
                      >
                        📋 View Repayment Schedule
                      </button>
                    </div>
                  )}
                  {app.status === "rejected" && (
                    <div style={s.rejectedNote}>
                      ✕ Rejected
                      {app.rejection_reason ? `: ${app.rejection_reason}` : ""}
                    </div>
                  )}
                  {app.status === "completed" && (
                    <div style={s.completedNote}>
                      🎉 Fully repaid on {fmtDate(app.completed_at)}.
                    </div>
                  )}

                  {/* Documents */}
                  <div style={s.docsSection}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#333",
                          }}
                        >
                          📎 Documents
                        </span>
                        {appDocs.length > 0 && (
                          <span
                            style={{
                              background: "#1f4d1f",
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 99,
                            }}
                          >
                            {appDocs.length} uploaded · {verifiedCount} verified
                          </span>
                        )}
                        {appDocs.length === 0 &&
                          docsMap[app.id] !== undefined && (
                            <span
                              style={{
                                fontSize: 11,
                                color: "#cc0000",
                                fontWeight: 600,
                              }}
                            >
                              ⚠️ No documents
                            </span>
                          )}
                      </div>
                      <button
                        style={s.docsToggleBtn}
                        onClick={() => handleViewDocs(app.id)}
                      >
                        {expandedDocs === app.id ? "Hide" : "View"} Documents
                        {appDocs.length > 0 && (
                          <span style={s.docsBadge}>{appDocs.length}</span>
                        )}
                      </button>
                    </div>

                    {/* Doc summary badges when collapsed */}
                    {appDocs.length > 0 && expandedDocs !== app.id && (
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                          marginBottom: 8,
                        }}
                      >
                        {appDocs.map((doc) => (
                          <span
                            key={doc.id}
                            style={{
                              fontSize: 11,
                              background: doc.is_verified
                                ? "#eafaf0"
                                : "#fff8e7",
                              color: doc.is_verified ? "#1a7a3a" : "#b36b00",
                              padding: "3px 10px",
                              borderRadius: 99,
                              border: `1px solid ${doc.is_verified ? "#a8d5a8" : "#f0c050"}`,
                            }}
                          >
                            {docTypeIcon(doc.type)}{" "}
                            {doc.type_label || docTypeLabel(doc.type)}{" "}
                            {doc.is_verified ? "✓" : "⏳"}
                          </span>
                        ))}
                      </div>
                    )}

                    {expandedDocs === app.id && (
                      <div style={s.docsPanel}>
                        <div style={s.docsPanelTitle}>
                          📁 Documents ({appDocs.length} uploaded,{" "}
                          {verifiedCount} verified)
                        </div>

                        {docsLoading && docsMap[app.id] === undefined ? (
                          <p style={s.loading}>Loading documents...</p>
                        ) : appDocs.length === 0 ? (
                          <div style={s.noDocsBox}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>
                              📄
                            </div>
                            <p style={s.noDocsText}>
                              No documents uploaded yet.
                            </p>
                          </div>
                        ) : (
                          <div style={s.docsCardGrid}>
                            {appDocs.map((doc) => (
                              <div key={doc.id} style={s.docCard}>
                                <div style={s.docCardIcon}>
                                  {docTypeIcon(doc.type)}
                                </div>
                                <div style={s.docCardBody}>
                                  <div style={s.docCardType}>
                                    {doc.type_label || docTypeLabel(doc.type)}
                                  </div>
                                  <div style={s.docCardName}>
                                    {doc.original_name ||
                                      doc.file_name ||
                                      doc.name ||
                                      "Document"}
                                  </div>
                                  <div style={s.docCardDate}>
                                    📅 {fmtDate(doc.created_at)}
                                  </div>
                                  {doc.is_verified && (
                                    <div
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        color: "#1a7a3a",
                                        background: "#eafaf0",
                                        padding: "2px 6px",
                                        borderRadius: 4,
                                        marginTop: 4,
                                        display: "inline-block",
                                      }}
                                    >
                                      ✓ Verified
                                    </div>
                                  )}
                                </div>
                                <div style={s.docCardActions}>
                                  {(doc.file_url || doc.url) && (
                                    <a
                                      href={doc.file_url || doc.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={s.viewDocBtn}
                                    >
                                      👁 View
                                    </a>
                                  )}
                                  {(doc.file_url || doc.url) && (
                                    <a
                                      href={doc.file_url || doc.url}
                                      download
                                      style={s.dlDocBtn}
                                    >
                                      ⬇ Save
                                    </a>
                                  )}
                                  {!doc.is_verified && (
                                    <button
                                      style={s.verifyDocBtn}
                                      onClick={() =>
                                        handleVerifyDoc(doc.id, app.id)
                                      }
                                    >
                                      ✓ Verify
                                    </button>
                                  )}
                                  <button
                                    style={s.delDocBtn}
                                    onClick={() =>
                                      handleDeleteDoc(doc.id, app.id)
                                    }
                                  >
                                    🗑
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={s.uploadSection}>
                          <div style={s.uploadSectionTitle}>
                            ⬆ Upload Additional Document
                          </div>
                          <div style={s.uploadRow}>
                            <select
                              style={s.uploadSelect}
                              value={docForm.type}
                              onChange={(e) =>
                                setDocForm((p) => ({
                                  ...p,
                                  type: e.target.value,
                                }))
                              }
                            >
                              <option value="nin_document">NIN Document</option>
                              <option value="bvn_document">BVN Document</option>
                              <option value="statement_of_account">
                                Bank Statement
                              </option>
                              <option value="collateral_document">
                                Collateral Document
                              </option>
                              <option value="collateral_image">
                                Collateral Image
                              </option>
                              <option value="other">Other Document</option>
                            </select>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                              style={s.uploadInput}
                              onChange={(e) =>
                                setDocForm((p) => ({
                                  ...p,
                                  file: e.target.files[0],
                                }))
                              }
                            />
                            <button
                              style={
                                uploadingDoc ? s.uploadBtnDisabled : s.uploadBtn
                              }
                              type="button"
                              onClick={() => handleUploadDoc(app.id)}
                              disabled={uploadingDoc}
                            >
                              {uploadingDoc ? "⏳ Uploading..." : "⬆ Upload"}
                            </button>
                          </div>
                          {docForm.file && (
                            <div style={s.fileSelected}>
                              Selected: <strong>{docForm.file.name}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {!appsLoading && filteredApps.length === 0 && (
              <div style={s.emptyBox}>
                <div style={s.emptyIcon}>📋</div>
                <p style={s.emptyText}>
                  No {appFilter === "all" ? "" : appFilter} applications found.
                </p>
              </div>
            )}
          </div>
        )}

        {/* REPAYMENTS */}
        {activeTab === "repayments" && (
          <div>
            <h1 style={s.pageTitle}>Repayment History</h1>
            <input
              style={{
                ...s.searchInput,
                marginBottom: 20,
                width: "100%",
                maxWidth: 420,
              }}
              placeholder="Search by borrower or reference..."
              value={repaySearch}
              onChange={(e) => setRepaySearch(e.target.value)}
            />
            {repaymentsLoading && (
              <p style={s.loading}>Loading repayments...</p>
            )}
            <div style={s.tableCard}>
              <table style={s.table}>
                <thead>
                  <tr style={s.tableHead}>
                    <th style={s.th}>Borrower</th>
                    <th style={s.th}>Amount</th>
                    <th style={s.th}>Reference</th>
                    <th style={s.th}>Balance After</th>
                    <th style={s.th}>Paid On</th>
                    <th style={s.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepayments.map((r, i) => (
                    <tr
                      key={r.id || i}
                      style={{
                        ...s.tableRow,
                        background:
                          r.status === "successful" ? "#f0fff4" : "#fff",
                      }}
                    >
                      <td style={s.td}>
                        <div style={s.repayName}>
                          {r.user?.name || r.loan?.user?.name || "—"}
                        </div>
                        <div style={s.repayEmail}>
                          {r.user?.email || r.loan?.user?.email || ""}
                        </div>
                      </td>
                      <td
                        style={{ ...s.td, fontWeight: 700, color: "#1f4d1f" }}
                      >
                        {toMoney(r.amount)}
                      </td>
                      <td style={{ ...s.td, fontSize: 11, color: "#888" }}>
                        {r.payment_reference
                          ? r.payment_reference.slice(-14)
                          : "—"}
                      </td>
                      <td style={s.td}>{toMoney(r.balance_after)}</td>
                      <td style={s.td}>{fmtDate(r.paid_at || r.updated_at)}</td>
                      <td style={s.td}>
                        <span
                          style={{
                            ...s.statusBadge,
                            ...getStatusStyle(r.status),
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!repaymentsLoading && filteredRepayments.length === 0 && (
                <div style={s.emptyBox}>
                  <p style={s.emptyText}>No repayments found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* USER HISTORY */}
        {activeTab === "history" && (
          <div>
            <h1 style={s.pageTitle}>User Loan History</h1>
            <p style={s.pageSub}>
              Look up any user's complete loan and repayment history.
            </p>
            <div style={s.historySearch}>
              <input
                style={s.historyInput}
                type="number"
                placeholder="Enter user ID..."
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleViewUserHistory()}
              />
              <button
                style={s.historyBtn}
                onClick={handleViewUserHistory}
                disabled={userHistoryLoading}
              >
                {userHistoryLoading ? "Loading..." : "🔍 Look Up"}
              </button>
            </div>
            {userHistory && (
              <div>
                <div style={s.userInfoCard}>
                  <div style={s.userAvatar}>
                    {userHistory.user?.name?.charAt(0) || "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={s.userName}>{userHistory.user?.name}</div>
                    <div style={s.userEmail}>{userHistory.user?.email}</div>
                    <div style={s.userPhone}>{userHistory.user?.phone}</div>
                  </div>
                  <div style={s.userStats}>
                    {[
                      [(userHistory.loans || []).length, "Total Loans"],
                      [toMoney(userHistory.total_borrowed), "Total Borrowed"],
                      [toMoney(userHistory.total_repaid), "Total Repaid"],
                    ].map(([val, label]) => (
                      <div key={label} style={s.userStat}>
                        <div style={s.userStatVal}>{val}</div>
                        <div style={s.userStatLabel}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {(userHistory.loans || []).map((loan) => (
                  <div key={loan.id} style={s.historyLoanCard}>
                    <div style={s.historyLoanHeader}>
                      <div>
                        <div style={s.historyLoanAmount}>
                          {toMoney(loan.amount)}
                        </div>
                        <div style={s.historyLoanMeta}>
                          {loan.purpose} · {loan.duration_months} months ·{" "}
                          {loan.interest_rate}%
                        </div>
                      </div>
                      <div
                        style={{
                          ...s.statusBadge,
                          ...getStatusStyle(loan.status),
                        }}
                      >
                        {loan.status}
                      </div>
                    </div>
                    <div style={s.historyLoanDetails}>
                      <span>Total: {toMoney(loan.total_repayable)}</span>
                      <span>Paid: {toMoney(loan.amount_paid)}</span>
                      <span>Balance: {toMoney(loan.balance)}</span>
                      <span>Applied: {fmtDate(loan.created_at)}</span>
                      {loan.disbursed_at && (
                        <span>Disbursed: {fmtDate(loan.disbursed_at)}</span>
                      )}
                      {loan.due_date && (
                        <span>Due: {fmtDate(loan.due_date)}</span>
                      )}
                    </div>
                    {loan.repayments?.filter((r) => r.status === "successful")
                      .length > 0 && (
                      <div style={s.historyRepayments}>
                        <div style={s.historyRepaymentsTitle}>
                          ✅{" "}
                          {
                            loan.repayments.filter(
                              (r) => r.status === "successful",
                            ).length
                          }{" "}
                          confirmed repayment(s)
                        </div>
                        {loan.repayments
                          .filter((r) => r.status === "successful")
                          .map((r, i) => (
                            <div key={i} style={s.historyRepayRow}>
                              <span>{fmtDate(r.paid_at)}</span>
                              <span
                                style={{ fontWeight: 600, color: "#1f4d1f" }}
                              >
                                {toMoney(r.amount)}
                              </span>
                              <span style={{ color: "#888", fontSize: 11 }}>
                                {r.payment_reference?.slice(-14)}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

const s = {
  page: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "Arial, sans-serif",
  },
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    background: "#1f4d1f",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: 8,
    fontSize: 14,
    zIndex: 9999,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    background: "#fff",
    borderRadius: 14,
    width: "100%",
    maxWidth: 560,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    overflow: "hidden",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 24px",
    background: "#1f4d1f",
    flexShrink: 0,
  },
  modalTitle: { fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 },
  modalClose: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "#fff",
    width: 28,
    height: 28,
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: 14,
  },
  modalBody: { flex: 1, overflowY: "auto", padding: 24 },
  modalLoanInfo: {
    background: "#f0f7ec",
    border: "1px solid #a8d5a8",
    borderRadius: 10,
    padding: "14px 18px",
    marginBottom: 20,
  },
  modalLoanAmount: {
    fontSize: 26,
    fontWeight: 700,
    color: "#1f4d1f",
    marginBottom: 4,
  },
  modalLoanMeta: { fontSize: 13, color: "#555" },
  modalField: { marginBottom: 20 },
  modalLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#333",
    marginBottom: 8,
    display: "block",
  },
  modalLabelNote: { fontSize: 11, color: "#888", fontWeight: 400 },
  interestDisplay: {
    background: "#f0f7ec",
    border: "1px solid #a8d5a8",
    borderRadius: 8,
    padding: "14px 18px",
    display: "flex",
    alignItems: "baseline",
    gap: 8,
  },
  interestDisplayRate: { fontSize: 24, fontWeight: 700, color: "#1f4d1f" },
  interestDisplayNote: { fontSize: 12, color: "#888" },
  durationGrid: { display: "flex", flexWrap: "wrap", gap: 10 },
  durationBtn: {
    padding: "10px 18px",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fff",
    color: "#333",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "inherit",
  },
  durationBtnActive: {
    border: "2px solid #1f4d1f",
    background: "#f0f7ec",
    color: "#1f4d1f",
    fontWeight: 700,
  },
  modalInput: {
    width: "100%",
    padding: "11px 14px",
    border: "1px solid #ddd",
    borderRadius: 7,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  },
  previewBox: {
    background: "#f7f5f0",
    borderRadius: 10,
    padding: "16px 20px",
    border: "1px solid #e8e4dc",
  },
  previewBoxTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  previewBoxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
  },
  previewBoxItem: {},
  previewBoxLabel: { fontSize: 11, color: "#888", marginBottom: 3 },
  previewBoxVal: { fontSize: 15, fontWeight: 600, color: "#111" },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    padding: "16px 24px",
    borderTop: "1px solid #eee",
    flexShrink: 0,
  },
  modalCancelBtn: {
    padding: "10px 22px",
    background: "#f5f5f5",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 600,
  },
  modalApproveBtn: {
    padding: "10px 28px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 700,
    fontSize: 14,
  },
  modalApproveBtnDisabled: {
    padding: "10px 28px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "not-allowed",
    fontFamily: "inherit",
    fontSize: 14,
  },
  sidebar: {
    width: 240,
    background: "#1f4d1f",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
  },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 20,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  logoImg: { width: 40, height: 40, objectFit: "contain" },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: "#fff" },
  sidebarLogoSub: { fontSize: 10, color: "#a8d5a8" },
  sidebarNav: { flex: 1, padding: "16px 0" },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 20px",
    color: "#a8d5a8",
    fontSize: 14,
    cursor: "pointer",
  },
  sidebarItemActive: {
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    borderLeft: "3px solid #f0c050",
  },
  navBadge: {
    marginLeft: "auto",
    background: "#cc0000",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: 99,
  },
  navSectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#7ca87c",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    padding: "16px 20px 6px",
  },
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  staffName: { fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 2 },
  staffRole: { fontSize: 11, color: "#a8d5a8", marginBottom: 10 },
  adminBackBtn: {
    width: "100%",
    padding: 8,
    background: "rgba(240,192,80,0.2)",
    color: "#f0c050",
    border: "1px solid rgba(240,192,80,0.4)",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
    marginBottom: 8,
    fontWeight: 600,
  },
  logoutBtn: {
    width: "100%",
    padding: 8,
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  main: { flex: 1, marginLeft: 240, padding: 32, minWidth: 0 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: "#111", marginBottom: 6 },
  pageSub: { fontSize: 14, color: "#888", marginBottom: 24 },
  loading: { textAlign: "center", color: "#888", padding: 40 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1f4d1f",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: "2px solid #e8e4dc",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 14,
    marginBottom: 24,
  },
  statCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 18,
  },
  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statLabel: { fontSize: 12, color: "#888" },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 22, fontWeight: 700 },
  quickActions: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 20,
    marginBottom: 24,
  },
  quickActionsTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  quickActionsRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  quickBtn: {
    padding: "10px 20px",
    background: "#f0f7ec",
    color: "#1f4d1f",
    border: "1px solid #a8d5a8",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  reportsCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 20,
    marginBottom: 24,
  },
  reportsCardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111",
    marginBottom: 4,
  },
  reportsCardSub: { fontSize: 13, color: "#888", marginBottom: 16 },
  downloadBtns: { display: "flex", gap: 12, flexWrap: "wrap" },
  dlBtn: {
    padding: "10px 22px",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  dlBtnDisabled: {
    padding: "10px 22px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  applyCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8e4dc",
    padding: 28,
    marginBottom: 24,
  },
  applyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  applyTitle: { fontSize: 18, fontWeight: 700, color: "#1f4d1f", margin: 0 },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#888",
  },
  submittedSuccess: { textAlign: "center", padding: "40px 20px" },
  submittedIcon: { fontSize: 48, marginBottom: 16 },
  submittedTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1f4d1f",
    marginBottom: 10,
  },
  submittedText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 1.7,
    marginBottom: 24,
    maxWidth: 500,
    margin: "0 auto 24px",
  },
  submittedNewBtn: {
    padding: "12px 28px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  formSection: { marginBottom: 24 },
  formSectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1f4d1f",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: "1px solid #f0f0f0",
  },
  interestBanner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#f0f7ec",
    border: "1px solid #a8d5a8",
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 16,
  },
  interestBannerTitle: { fontSize: 12, color: "#555", marginBottom: 2 },
  interestBannerRate: { fontSize: 20, fontWeight: 700, color: "#1f4d1f" },
  sellerSearchInput: {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  },
  sellerSearching: { padding: "10px 16px", fontSize: 13, color: "#888" },
  sellerDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #ddd",
    borderTop: "none",
    borderRadius: "0 0 8px 8px",
    zIndex: 100,
    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
    maxHeight: 280,
    overflowY: "auto",
  },
  sellerDropdownItem: {
    padding: "12px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #f5f5f5",
  },
  sellerDropdownName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111",
    marginBottom: 3,
  },
  sellerDropdownMeta: { fontSize: 12, color: "#555", marginBottom: 2 },
  sellerNoResults: {
    padding: "12px 16px",
    fontSize: 13,
    color: "#888",
    background: "#f7f5f0",
    borderRadius: 6,
  },
  selectedSellerCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#f0f7ec",
    border: "2px solid #1f4d1f",
    borderRadius: 10,
    padding: "14px 16px",
    marginTop: 12,
  },
  selectedSellerName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#1f4d1f",
    marginBottom: 3,
  },
  clearSellerBtn: {
    padding: "7px 16px",
    background: "#fff",
    color: "#555",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  applyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
  },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 12, fontWeight: 600, color: "#444" },
  input: {
    padding: "11px 12px",
    border: "1px solid #ddd",
    borderRadius: 7,
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
  },
  req: { color: "#cc0000" },
  loanPreview: {
    background: "#f7f5f0",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    border: "1px solid #e8e4dc",
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 14,
  },
  previewItem: {},
  previewLabel: { fontSize: 11, color: "#888", marginBottom: 2 },
  previewVal: { fontSize: 15, fontWeight: 700, color: "#1f4d1f" },
  docNote: {
    fontSize: 12,
    color: "#888",
    marginBottom: 14,
    fontStyle: "italic",
  },
  docsGrid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
  },
  docUploadField: { display: "flex", flexDirection: "column", gap: 6 },
  fileInput: {
    padding: 8,
    border: "1px dashed #ccc",
    borderRadius: 7,
    fontSize: 13,
    background: "#fafafa",
    cursor: "pointer",
  },
  fileSelected: {
    fontSize: 12,
    color: "#1a7a3a",
    fontWeight: 600,
    padding: "4px 8px",
    background: "#eafaf0",
    borderRadius: 5,
  },
  submitBtn: {
    width: "100%",
    padding: 14,
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  submitBtnDisabled: {
    width: "100%",
    padding: 14,
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  filterRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  filterTabs: { display: "flex", gap: 8, flexWrap: "wrap" },
  filterTab: {
    padding: "8px 14px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 13,
    color: "#555",
    cursor: "pointer",
    background: "#fff",
    fontFamily: "inherit",
  },
  filterTabActive: {
    padding: "8px 14px",
    border: "1px solid #1f4d1f",
    borderRadius: 6,
    fontSize: 13,
    color: "#fff",
    cursor: "pointer",
    background: "#1f4d1f",
    fontFamily: "inherit",
  },
  tabCount: {
    marginLeft: 5,
    background: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontWeight: 700,
    padding: "1px 5px",
    borderRadius: 99,
  },
  searchInput: {
    padding: "10px 16px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    minWidth: 240,
    fontFamily: "inherit",
  },
  appCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 22,
    marginBottom: 16,
  },
  appHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    flexWrap: "wrap",
    gap: 10,
  },
  appAmount: {
    fontSize: 26,
    fontWeight: 700,
    color: "#1f4d1f",
    marginBottom: 4,
  },
  appMeta: { fontSize: 13, color: "#888", marginBottom: 3 },
  appPurpose: {
    fontSize: 13,
    color: "#555",
    fontStyle: "italic",
    textTransform: "capitalize",
  },
  appHeaderRight: { textAlign: "right" },
  appDate: { fontSize: 12, color: "#aaa", marginTop: 6 },
  appDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 12,
    padding: "14px 0",
    borderTop: "1px solid #eee",
    borderBottom: "1px solid #eee",
    marginBottom: 14,
  },
  appDetail: {},
  appDetailLabel: { fontSize: 11, color: "#888", marginBottom: 3 },
  appDetailVal: { fontSize: 13, fontWeight: 600, color: "#111" },
  statusBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 99,
    textTransform: "capitalize",
  },
  actionGroup: {
    background: "#f0f7ec",
    borderRadius: 8,
    padding: 16,
    border: "1px solid #c5ddb8",
    marginBottom: 14,
  },
  actionGroupLabel: {
    fontSize: 12,
    color: "#555",
    fontStyle: "italic",
    marginBottom: 10,
  },
  actionBtns: { display: "flex", gap: 10, flexWrap: "wrap" },
  approveBtn: {
    padding: "9px 22px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  rejectBtn: {
    padding: "9px 22px",
    background: "#fff",
    color: "#cc0000",
    border: "1px solid #cc0000",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  rejectBtnDisabled: {
    padding: "9px 22px",
    background: "#fff",
    color: "#ccc",
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: 13,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  borrowerBox: {
    background: "#fff",
    borderRadius: 6,
    padding: "8px 12px",
    marginBottom: 12,
    fontSize: 13,
    color: "#333",
    border: "1px solid #e8e4dc",
  },
  disburseBtn: {
    padding: "11px 24px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  disburseBtnDisabled: {
    padding: "11px 24px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 14,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  activeNote: {
    background: "#eafaf0",
    color: "#1a7a3a",
    padding: "12px 16px",
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 14,
  },
  scheduleLinkBtn: {
    display: "block",
    marginTop: 8,
    background: "none",
    border: "none",
    color: "#1f4d1f",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
  },
  rejectedNote: {
    background: "#fff0f0",
    color: "#cc0000",
    padding: "12px 16px",
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 14,
  },
  completedNote: {
    background: "#f0f0f0",
    color: "#555",
    padding: "12px 16px",
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 14,
  },
  docsSection: { borderTop: "1px solid #f0f0f0", paddingTop: 14 },
  docsToggleBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    background: "#f7f5f0",
    color: "#555",
    border: "1px solid #e8e4dc",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  docsBadge: {
    background: "#1f4d1f",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 99,
  },
  docsPanel: {
    marginTop: 14,
    background: "#f7f5f0",
    borderRadius: 8,
    padding: 16,
  },
  docsPanelTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#333",
    marginBottom: 14,
  },
  noDocsBox: { textAlign: "center", padding: "24px 0" },
  noDocsText: { fontSize: 13, color: "#888" },
  docsCardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  docCard: {
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e8e4dc",
    padding: 14,
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
  docCardIcon: { fontSize: 28, flexShrink: 0 },
  docCardBody: { flex: 1, minWidth: 0 },
  docCardType: {
    fontSize: 10,
    fontWeight: 700,
    color: "#1f4d1f",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  docCardName: {
    fontSize: 12,
    color: "#333",
    marginBottom: 3,
    wordBreak: "break-all",
  },
  docCardDate: { fontSize: 10, color: "#aaa" },
  docCardActions: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    flexShrink: 0,
  },
  viewDocBtn: {
    padding: "5px 10px",
    background: "#e7f0ff",
    color: "#1a4fa0",
    borderRadius: 5,
    fontSize: 11,
    fontWeight: 600,
    textDecoration: "none",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  dlDocBtn: {
    padding: "5px 10px",
    background: "#eafaf0",
    color: "#1a7a3a",
    borderRadius: 5,
    fontSize: 11,
    fontWeight: 600,
    textDecoration: "none",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  verifyDocBtn: {
    padding: "5px 10px",
    background: "#f0f7ec",
    color: "#1a7a3a",
    border: "1px solid #a8d5a8",
    borderRadius: 5,
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 600,
  },
  delDocBtn: {
    padding: "5px 10px",
    background: "#fff0f0",
    color: "#cc0000",
    border: "1px solid #ffa39e",
    borderRadius: 5,
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  uploadSection: {
    borderTop: "1px solid #e8e4dc",
    paddingTop: 14,
    marginTop: 4,
  },
  uploadSectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#555",
    marginBottom: 10,
  },
  uploadRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  uploadSelect: {
    padding: "9px 12px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
  },
  uploadInput: {
    flex: 1,
    minWidth: 180,
    padding: 6,
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 13,
  },
  uploadBtn: {
    padding: "9px 18px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  uploadBtnDisabled: {
    padding: "9px 18px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  tableCard: {
    background: "#fff",
    borderRadius: 12,
    overflowX: "auto",
    border: "1px solid #e8e4dc",
  },
  table: { width: "100%", minWidth: 640, borderCollapse: "collapse" },
  tableHead: { background: "#f7f5f0", borderBottom: "2px solid #eee" },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontSize: 11,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: { borderTop: "1px solid #f5f5f5" },
  td: { padding: "14px 16px", verticalAlign: "middle", fontSize: 13 },
  repayName: { fontWeight: 600, color: "#111", marginBottom: 2 },
  repayEmail: { fontSize: 11, color: "#888" },
  historySearch: { display: "flex", gap: 12, marginBottom: 24 },
  historyInput: {
    flex: 1,
    maxWidth: 300,
    padding: "11px 16px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
  },
  historyBtn: {
    padding: "11px 24px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  userInfoCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8e4dc",
    padding: 20,
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  userAvatar: {
    width: 52,
    height: 52,
    background: "#1f4d1f",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f0c050",
    fontWeight: 700,
    fontSize: 22,
    flexShrink: 0,
  },
  userName: { fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 3 },
  userEmail: { fontSize: 13, color: "#888", marginBottom: 2 },
  userPhone: { fontSize: 13, color: "#888" },
  userStats: { marginLeft: "auto", display: "flex", gap: 24 },
  userStat: { textAlign: "center" },
  userStatVal: { fontSize: 18, fontWeight: 700, color: "#1f4d1f" },
  userStatLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  historyLoanCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 18,
    marginBottom: 14,
  },
  historyLoanHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  historyLoanAmount: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1f4d1f",
    marginBottom: 4,
  },
  historyLoanMeta: { fontSize: 12, color: "#888", textTransform: "capitalize" },
  historyLoanDetails: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    fontSize: 12,
    color: "#555",
    padding: "10px 0",
    borderTop: "1px solid #eee",
    marginBottom: 10,
  },
  historyRepayments: { background: "#f7f5f0", borderRadius: 8, padding: 14 },
  historyRepaymentsTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#333",
    marginBottom: 10,
  },
  historyRepayRow: {
    display: "flex",
    gap: 20,
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid #eee",
    fontSize: 12,
    flexWrap: "wrap",
  },
  emptyBox: {
    textAlign: "center",
    padding: "40px 0",
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: "#888" },
};
