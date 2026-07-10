import { useState, useEffect } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";


export default function ManageLoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [deciding, setDeciding] = useState(null);
  const [disbursing, setDisbursing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loanSettings, setLoanSettings] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(null);
  const [approveForm, setApproveForm] = useState({
    interest_rate: "",
    duration_months: "",
  });
  const [expandedLoan, setExpandedLoan] = useState(null);
  const [search, setSearch] = useState("");

  // Documents state
  const [expandedDocs, setExpandedDocs] = useState(null);
  const [docsMap, setDocsMap] = useState({});
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docForm, setDocForm] = useState({ type: "nin_document", file: null });
  const [verifyingDoc, setVerifyingDoc] = useState(null);

  const fetchLoans = () => {
    setLoading(true);
    Promise.all([api.get("/admin/loans"), api.get("/settings/loan")])
      .then(([loansRes, settingsRes]) => {
        const raw = loansRes.data?.data || loansRes.data;
        setLoans(Array.isArray(raw) ? raw : []);
        setLoanSettings(settingsRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // Auto-load docs for all loans
  useEffect(() => {
    if (loans.length === 0) return;
    loans.forEach((loan) => {
      if (docsMap[loan.id] === undefined) {
        fetchDocsForLoan(loan.id);
      }
    });
  }, [loans]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // ✅ Single working endpoint — confirmed by Sherif
  const fetchDocsForLoan = async (loanId) => {
    try {
      const r = await api.get(`/loans/${loanId}/documents`);
      const raw = r.data?.documents || r.data?.data || r.data;
      setDocsMap((prev) => ({
        ...prev,
        [loanId]: Array.isArray(raw) ? raw : [],
      }));
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      if (status === 403) {
        setDocsMap((prev) => ({
          ...prev,
          [loanId]: `403: ${msg || "Forbidden"}`,
        }));
      } else {
        setDocsMap((prev) => ({ ...prev, [loanId]: [] }));
      }
    }
  };

  const handleViewDocs = async (loanId) => {
    if (expandedDocs === loanId) {
      setExpandedDocs(null);
      return;
    }
    setExpandedDocs(loanId);
    setDocsLoading(true);
    try {
      await fetchDocsForLoan(loanId);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleVerifyDoc = async (docId, loanId) => {
    setVerifyingDoc(docId);
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
    } finally {
      setVerifyingDoc(null);
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
      await fetchDocsForLoan(loanId);
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
      showToast("Failed to delete document.");
    }
  };

  const handleDecision = async (loanId, decision) => {
    if (decision === "approved") {
      const loan = loans.find((l) => l.id === loanId);
      setShowApproveModal(loan);
      setApproveForm({
        interest_rate: loan.interest_rate ?? loanSettings?.default_interest ?? "5",
        duration_months: loan.duration_months || "6",
      });
      return;
    }
    if (!window.confirm("Reject this loan application?")) return;
    const rejection_reason = window.prompt("Enter rejection reason:");
    if (!rejection_reason) return;
    setDeciding(loanId);
    try {
      const res = await api.patch(`/admin/loans/${loanId}/decision`, {
        decision: "rejected",
        rejection_reason,
      });
      const updated = res.data?.loan || res.data;
      setLoans(
        loans.map((l) =>
          l.id === loanId ? { ...l, ...updated, status: "rejected" } : l,
        ),
      );
      showToast("✅ Loan rejected. Buyer notified.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to process decision.");
    } finally {
      setDeciding(null);
    }
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    const loan = showApproveModal;
    setDeciding(loan.id);
    setShowApproveModal(null);
    try {
      const res = await api.patch(`/admin/loans/${loan.id}/decision`, {
        decision: "approved",
        duration_months: Number(approveForm.duration_months),
      });
      const updated = res.data?.loan || res.data;
      setLoans(
        loans.map((l) =>
          l.id === loan.id ? { ...l, ...updated, status: "approved" } : l,
        ),
      );
      showToast("✅ Loan approved! Email & SMS sent to buyer.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve loan.");
    } finally {
      setDeciding(null);
    }
  };

  const handleDisburse = async (loan) => {
    if (
      !window.confirm(
        `Confirm disbursement for ${loan.user?.name || "Applicant"}?\n\nAmount: ₦${Number(loan.amount).toLocaleString()}\n\n⚠️ Only click OK AFTER you have transferred the money manually.`,
      )
    )
      return;
    setDisbursing(loan.id);
    try {
      await api.patch(`/admin/loans/${loan.id}/disburse`);
      showToast(
        "✅ Loan disbursed! Repayment schedule activated. SMS sent to buyer.",
      );
      fetchLoans();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Disbursement failed. Please try again.",
      );
    } finally {
      setDisbursing(null);
    }
  };

  const handleViewRepayments = (loanId) => {
    setExpandedLoan((prev) => (prev === loanId ? null : loanId));
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

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";
  const toMoney = (val) =>
    val != null && !isNaN(Number(val))
      ? `₦${Number(val).toLocaleString()}`
      : "—";

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

  const filtered = loans
    .filter((l) => filter === "all" || l.status === filter)
    .filter(
      (l) =>
        !search ||
        l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.purpose?.toLowerCase().includes(search.toLowerCase()),
    );

  const statusCounts = [
    "pending",
    "approved",
    "disbursed",
    "active",
    "rejected",
    "completed",
  ].reduce(
    (acc, s) => ({ ...acc, [s]: loans.filter((l) => l.status === s).length }),
    {},
  );

  return (
    <>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Approval Modal */}
      {showApproveModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalBox}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>✓ Approve Loan</h2>
              <button
                style={s.modalClose}
                onClick={() => setShowApproveModal(null)}
              >
                ✕
              </button>
            </div>
            <div style={s.modalBody}>
              <div style={s.modalLoanInfo}>
                <div style={s.modalLoanAmount}>
                  ₦{Number(showApproveModal.amount).toLocaleString()}
                </div>
                <div style={s.modalLoanApplicant}>
                  {showApproveModal.user?.name} — {showApproveModal.purpose}
                </div>
              </div>
              <form onSubmit={handleApproveSubmit}>
                <div style={s.modalField}>
                  <label style={s.modalLabel}>
                    Interest Rate (%){" "}
                    <span style={s.modalLabelNote}>
                      — locked to what the buyer applied at, not editable
                    </span>
                  </label>
                  <div style={s.modalRateDisplay}>
                    {approveForm.interest_rate}% flat
                  </div>
                </div>
                <div style={s.modalField}>
                  <label style={s.modalLabel}>
                    Loan Duration{" "}
                    <span style={s.modalLabelNote}>
                      — locked to buyer's application
                    </span>
                  </label>
                  <div style={s.modalRateDisplay}>
                    {approveForm.duration_months} month
                    {Number(approveForm.duration_months) === 1 ? "" : "s"}
                  </div>
                </div>
                {approveForm.duration_months && (
                  <div style={s.loanPreview}>
                    <div style={s.previewTitle}>Loan Summary Preview</div>
                    <div style={s.previewGrid}>
                      {(() => {
                        const rate = Number(approveForm.interest_rate);
                        const amount = Number(showApproveModal.amount);
                        const months = Number(approveForm.duration_months);
                        const interest = (amount * rate) / 100;
                        const total = amount + interest;
                        const monthly = Math.ceil(total / months);
                        return [
                          ["Principal", `₦${amount.toLocaleString()}`],
                          [
                            "Interest",
                            `₦${interest.toLocaleString()} (${rate}%)`,
                          ],
                          ["Total Repayable", `₦${total.toLocaleString()}`],
                          [
                            "Monthly Instalment",
                            `₦${monthly.toLocaleString()}`,
                          ],
                          [
                            "Duration",
                            `${months} month${months === 1 ? "" : "s"}`,
                          ],
                        ].map(([label, val]) => (
                          <div key={label} style={s.previewItem}>
                            <div style={s.previewLabel}>{label}</div>
                            <div style={s.previewVal}>{val}</div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
                <div style={s.modalFooter}>
                  <button
                    type="button"
                    style={s.modalCancelBtn}
                    onClick={() => setShowApproveModal(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={s.modalApproveBtn}>
                    ✓ Confirm Approval
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <AdminLayout
        title="Loan Applications"
        subtitle={`${loans.length} total applications`}
        badges={{ "/admin/loans": statusCounts.pending }}
        headerActions={
          <>
            <button
              style={s.refreshBtn}
              onClick={fetchLoans}
              disabled={loading}
            >
              {loading ? "⏳" : "🔄"} Refresh
            </button>
            <div style={s.flowBar}>
              {["pending", "approved", "disbursed", "active", "completed"].map(
                (step, i, arr) => (
                  <div key={step} style={s.flowStep}>
                    <div
                      style={{
                        ...s.flowDot,
                        background:
                          statusCounts[step] > 0
                            ? "#f0c050"
                            : "rgba(255,255,255,0.3)",
                      }}
                    />
                    <div style={s.flowLabel}>
                      {step}{" "}
                      {statusCounts[step] > 0 ? `(${statusCounts[step]})` : ""}
                    </div>
                    {i < arr.length - 1 && <div style={s.flowArrow}>→</div>}
                  </div>
                ),
              )}
            </div>
          </>
        }
      >
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
                style={filter === tab ? s.filterTabActive : s.filterTab}
                onClick={() => setFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab !== "all" && statusCounts[tab] > 0 && (
                  <span
                    style={{
                      ...s.tabBadge,
                      background: tab === "pending" ? "#cc0000" : "#888",
                    }}
                  >
                    {statusCounts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search by name, email or purpose..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p style={s.message}>Loading loans...</p>}
        {!loading && filtered.length === 0 && (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>💰</div>
            <p style={s.emptyText}>
              No {filter === "all" ? "" : filter} loans found
            </p>
          </div>
        )}

        {filtered.map((loan) => {
          const loanRepayments = Array.isArray(loan.repayments)
            ? loan.repayments
            : [];
          const successfulRepayments = loanRepayments.filter(
            (r) => r.status === "successful",
          );
          const appDocs = Array.isArray(docsMap[loan.id])
            ? docsMap[loan.id]
            : [];
          const docsError =
            typeof docsMap[loan.id] === "string" ? docsMap[loan.id] : null;
          const verifiedCount = appDocs.filter((d) => d.is_verified).length;

          return (
            <div key={loan.id} style={s.loanCard}>
              <div style={s.loanHeader}>
                <div>
                  <div style={s.loanAmount}>{toMoney(loan.amount)}</div>
                  <div style={s.loanApplicant}>
                    {loan.user?.name || "Applicant"} — {loan.user?.email || ""}
                  </div>
                  {loan.user?.phone && (
                    <div style={{ fontSize: 12, color: "#aaa" }}>
                      📞 {loan.user.phone}
                    </div>
                  )}
                </div>
                <div style={s.loanHeaderRight}>
                  <div
                    style={{ ...s.statusBadge, ...getStatusStyle(loan.status) }}
                  >
                    {loan.status}
                  </div>
                  {loan.auto_approved && (
                    <div style={s.autoApprovedBadge}>⚡ Auto-Approved</div>
                  )}
                  {successfulRepayments.length > 0 && (
                    <div style={s.repayCountBadge}>
                      {successfulRepayments.length} payment
                      {successfulRepayments.length > 1 ? "s" : ""} confirmed
                    </div>
                  )}
                </div>
              </div>

              <div style={s.loanDetails}>
                {[
                  ["Purpose", loan.purpose],
                  ["Amount", toMoney(loan.amount)],
                  ["Duration", `${loan.duration_months || "—"} months`],
                  [
                    "Interest Rate",
                    loan.interest_rate ? `${loan.interest_rate}%` : "—",
                  ],
                  ["Total Repayable", toMoney(loan.total_repayable)],
                  ["Monthly Instalment", toMoney(loan.monthly_instalment)],
                  [
                    "Repayment Schedule",
                    loan.repayment_preference
                      ? loan.repayment_preference === "weekly"
                        ? "Weekly"
                        : "Monthly"
                      : "—",
                  ],
                  [
                    "Total Instalments",
                    loan.total_instalments != null
                      ? loan.total_instalments
                      : "—",
                  ],
                  ["Amount Paid", toMoney(loan.amount_paid)],
                  ["Balance", toMoney(loan.balance)],
                  [
                    "Months Paid",
                    loan.months_paid != null
                      ? `${loan.months_paid} / ${loan.duration_months}`
                      : "—",
                  ],
                  ["Applied On", fmtDate(loan.created_at)],
                  ["Disbursed On", fmtDate(loan.disbursed_at)],
                  ["Due Date", fmtDate(loan.due_date)],
                ].map(([label, val]) => (
                  <div key={label} style={s.loanDetail}>
                    <div style={s.loanDetailLabel}>{label}</div>
                    <div style={s.loanDetailValue}>{val}</div>
                  </div>
                ))}
              </div>

              {(loan.nin_number || loan.bvn_number) && (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 14,
                    flexWrap: "wrap",
                  }}
                >
                  {loan.nin_number && (
                    <span style={s.idBadge}>🪪 NIN: {loan.nin_number}</span>
                  )}
                  {loan.bvn_number && (
                    <span style={s.idBadge}>🏦 BVN: {loan.bvn_number}</span>
                  )}
                </div>
              )}

              {/* Pending */}
              {loan.status === "pending" && (
                <div style={s.actionRow}>
                  <div style={s.actionNote}>
                    Step 1 — Review and approve or reject this application
                    {appDocs.length > 0 && (
                      <span
                        style={{
                          marginLeft: 8,
                          color: "#1f4d1f",
                          fontWeight: 600,
                        }}
                      >
                        📎 {appDocs.length} doc(s) uploaded, {verifiedCount}{" "}
                        verified
                      </span>
                    )}
                    {appDocs.length === 0 &&
                      docsMap[loan.id] !== undefined &&
                      !docsError && (
                        <span style={{ marginLeft: 8, color: "#cc0000" }}>
                          ⚠️ No documents uploaded
                        </span>
                      )}
                  </div>
                  <div style={s.actionBtns}>
                    <button
                      style={
                        deciding === loan.id
                          ? s.approveBtnDisabled
                          : s.approveBtn
                      }
                      onClick={() => handleDecision(loan.id, "approved")}
                      disabled={deciding === loan.id}
                    >
                      {deciding === loan.id
                        ? "Processing..."
                        : "✓ Approve Loan"}
                    </button>
                    <button
                      style={
                        deciding === loan.id ? s.rejectBtnDisabled : s.rejectBtn
                      }
                      onClick={() => handleDecision(loan.id, "rejected")}
                      disabled={deciding === loan.id}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Approved */}
              {loan.status === "approved" && (
                <div style={s.disburseSection}>
                  <div style={s.disburseTitle}>Step 2 — Disburse the Loan</div>
                  <div style={s.disburseInstructions}>
                    <div style={s.disburseStep}>
                      <div style={s.disburseStepNum}>1</div>
                      <div>
                        Transfer <strong>{toMoney(loan.amount)}</strong> to the
                        borrower's bank account manually
                      </div>
                    </div>
                    <div style={s.disburseStep}>
                      <div style={s.disburseStepNum}>2</div>
                      <div>
                        After confirming the transfer, click below to activate
                        the repayment schedule
                      </div>
                    </div>
                  </div>
                  {loan.user && (
                    <div style={s.borrowerBox}>
                      <div style={s.borrowerName}>👤 {loan.user.name}</div>
                      <div style={s.borrowerDetail}>{loan.user.email}</div>
                      {loan.user.phone && (
                        <div style={s.borrowerDetail}>📞 {loan.user.phone}</div>
                      )}
                    </div>
                  )}
                  <button
                    style={
                      disbursing === loan.id
                        ? s.disburseBtnDisabled
                        : s.disburseBtn
                    }
                    onClick={() => handleDisburse(loan)}
                    disabled={disbursing === loan.id}
                  >
                    {disbursing === loan.id
                      ? "⏳ Processing..."
                      : "💸 Confirm Disbursement & Activate Schedule"}
                  </button>
                </div>
              )}

              {/* Disbursed / Active */}
              {(loan.status === "disbursed" || loan.status === "active") && (
                <div style={s.activeSection}>
                  <div style={s.activeSectionRow}>
                    <div>
                      <div style={s.activeInfo}>
                        {loan.status === "disbursed"
                          ? "✅ Disbursed — repayment schedule activated."
                          : "🔄 Active — buyer is making repayments."}
                      </div>
                      <div style={s.repaymentSummary}>
                        {successfulRepayments.length > 0 ? (
                          <span style={{ color: "#1a7a3a" }}>
                            ✓ {successfulRepayments.length} payment
                            {successfulRepayments.length > 1 ? "s" : ""}{" "}
                            confirmed · ₦
                            {successfulRepayments
                              .reduce(
                                (sum, r) => sum + Number(r.amount || 0),
                                0,
                              )
                              .toLocaleString()}{" "}
                            received
                          </span>
                        ) : (
                          <span style={{ color: "#888" }}>
                            No confirmed payments yet
                          </span>
                        )}
                      </div>
                    </div>
                    {successfulRepayments.length > 0 && (
                      <button
                        style={s.viewRepaymentsBtn}
                        onClick={() => handleViewRepayments(loan.id)}
                      >
                        {expandedLoan === loan.id ? "Hide" : "View"} Repayments
                        ({successfulRepayments.length})
                      </button>
                    )}
                  </div>
                  {expandedLoan === loan.id &&
                    successfulRepayments.length > 0 && (
                      <div style={{ overflowX: "auto" }}>
                      <div style={s.repaymentsTable}>
                        <div style={s.repaymentsHead}>
                          <span>#</span>
                          <span>Paid On</span>
                          <span>Amount</span>
                          <span>Reference</span>
                          <span>Balance After</span>
                          <span>Status</span>
                        </div>
                        {successfulRepayments.map((r, i) => (
                          <div
                            key={r.id || i}
                            style={{
                              ...s.repaymentsRow,
                              background: "#f0fff4",
                            }}
                          >
                            <span style={{ color: "#888" }}>
                              {r.instalment_number || i + 1}
                            </span>
                            <span>{fmtDate(r.paid_at || r.updated_at)}</span>
                            <span style={{ color: "#1f4d1f", fontWeight: 600 }}>
                              {toMoney(r.amount)}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                color: "#888",
                                wordBreak: "break-all",
                              }}
                            >
                              {r.payment_reference
                                ? r.payment_reference.slice(-12)
                                : "—"}
                            </span>
                            <span>{toMoney(r.balance_after)}</span>
                            <span>
                              <span
                                style={{
                                  ...s.statusBadge,
                                  ...getStatusStyle(r.status),
                                  fontSize: 10,
                                  padding: "2px 8px",
                                }}
                              >
                                {r.status}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                      </div>
                    )}
                </div>
              )}

              {loan.status === "rejected" && (
                <div style={s.rejectedNote}>
                  ✕ Rejected
                  {loan.rejection_reason ? `: ${loan.rejection_reason}` : ""}
                </div>
              )}
              {loan.status === "completed" && (
                <div style={s.completedNote}>
                  🎉 Fully repaid and completed on {fmtDate(loan.completed_at)}.
                </div>
              )}

              {/* Documents Section */}
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
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{ fontSize: 13, fontWeight: 700, color: "#333" }}
                    >
                      📎 Documents
                    </span>
                    {appDocs.length > 0 && (
                      <span style={s.docCountBadge}>
                        {appDocs.length} uploaded · {verifiedCount} verified
                      </span>
                    )}
                    {docsError && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#cc0000",
                          fontWeight: 600,
                        }}
                      >
                        ⛔ 403 — Contact Sherif
                      </span>
                    )}
                    {!docsError &&
                      appDocs.length === 0 &&
                      docsMap[loan.id] !== undefined && (
                        <span style={{ fontSize: 11, color: "#888" }}>
                          No documents uploaded
                        </span>
                      )}
                    {docsMap[loan.id] === undefined && (
                      <span style={{ fontSize: 11, color: "#aaa" }}>
                        Loading...
                      </span>
                    )}
                  </div>
                  <button
                    style={s.docsToggleBtn}
                    onClick={() => handleViewDocs(loan.id)}
                  >
                    {expandedDocs === loan.id ? "Hide" : "View"} Documents
                    {appDocs.length > 0 && (
                      <span style={s.docsBadge}>{appDocs.length}</span>
                    )}
                  </button>
                </div>

                {/* Quick badges when collapsed */}
                {appDocs.length > 0 && expandedDocs !== loan.id && (
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
                          padding: "3px 10px",
                          borderRadius: 99,
                          border: "1px solid",
                          background: doc.is_verified ? "#eafaf0" : "#fff8e7",
                          color: doc.is_verified ? "#1a7a3a" : "#b36b00",
                          borderColor: doc.is_verified ? "#a8d5a8" : "#f0c050",
                        }}
                      >
                        {docTypeIcon(doc.type)}{" "}
                        {doc.type_label || docTypeLabel(doc.type)}{" "}
                        {doc.is_verified ? "✓" : "⏳"}
                      </span>
                    ))}
                  </div>
                )}

                {expandedDocs === loan.id && (
                  <div style={s.docsPanel}>
                    <div style={s.docsPanelTitle}>
                      📁 Documents ({appDocs.length} uploaded, {verifiedCount}{" "}
                      verified)
                    </div>

                    {docsLoading && docsMap[loan.id] === undefined ? (
                      <p
                        style={{
                          textAlign: "center",
                          color: "#888",
                          padding: 20,
                        }}
                      >
                        Loading documents...
                      </p>
                    ) : docsError ? (
                      <div
                        style={{
                          background: "#fff0f0",
                          border: "1px solid #ffb3b3",
                          borderRadius: 8,
                          padding: 16,
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#cc0000",
                            marginBottom: 6,
                          }}
                        >
                          ⛔ Cannot Load Documents
                        </div>
                        <div style={{ fontSize: 12, color: "#cc0000" }}>
                          {docsError}
                        </div>
                        <button
                          style={{
                            marginTop: 10,
                            padding: "7px 14px",
                            background: "#1f4d1f",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 12,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                          onClick={() => fetchDocsForLoan(loan.id)}
                        >
                          🔄 Retry
                        </button>
                      </div>
                    ) : appDocs.length === 0 ? (
                      <div style={s.noDocsBox}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                        <p style={{ fontSize: 13, color: "#888" }}>
                          No documents uploaded yet for this application.
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
                              {doc.is_verified ? (
                                <div style={s.verifiedBadge}>✓ Verified</div>
                              ) : (
                                <div style={s.pendingBadge}>
                                  ⏳ Pending review
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
                                  style={
                                    verifyingDoc === doc.id
                                      ? s.verifyDocBtnDisabled
                                      : s.verifyDocBtn
                                  }
                                  onClick={() =>
                                    handleVerifyDoc(doc.id, loan.id)
                                  }
                                  disabled={verifyingDoc === doc.id}
                                >
                                  {verifyingDoc === doc.id ? "⏳" : "✓ Verify"}
                                </button>
                              )}
                              <button
                                style={s.delDocBtn}
                                onClick={() => handleDeleteDoc(doc.id, loan.id)}
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload */}
                    <div style={s.uploadSection}>
                      <div style={s.uploadSectionTitle}>
                        ⬆ Upload Additional Document
                      </div>
                      <div style={s.uploadRow}>
                        <select
                          style={s.uploadSelect}
                          value={docForm.type}
                          onChange={(e) =>
                            setDocForm((p) => ({ ...p, type: e.target.value }))
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
                          onClick={() => handleUploadDoc(loan.id)}
                          disabled={uploadingDoc}
                        >
                          {uploadingDoc ? "⏳ Uploading..." : "⬆ Upload"}
                        </button>
                      </div>
                      {docForm.file && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#1a7a3a",
                            marginTop: 6,
                          }}
                        >
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
      </AdminLayout>
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
    fontWeight: 500,
    zIndex: 999,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
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
  sidebarBadge: {
    marginLeft: "auto",
    background: "#cc0000",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 99,
  },
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
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
  main: { flex: 1, marginLeft: 240, padding: 32 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#111",
    marginBottom: 4,
  },
  headerSub: { fontSize: 14, color: "#888" },
  headerRight: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "flex-end",
  },
  refreshBtn: {
    padding: "8px 16px",
    background: "#fff",
    color: "#1f4d1f",
    border: "1px solid #1f4d1f",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  flowBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#1f4d1f",
    padding: "10px 16px",
    borderRadius: 8,
    flexWrap: "wrap",
  },
  flowStep: { display: "flex", alignItems: "center", gap: 6 },
  flowDot: { width: 8, height: 8, borderRadius: "50%" },
  flowLabel: { fontSize: 11, color: "#a8d5a8", fontWeight: 500 },
  flowArrow: { fontSize: 11, color: "rgba(255,255,255,0.3)" },
  filterRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  filterTabs: { display: "flex", gap: 8, flexWrap: "wrap" },
  searchInput: {
    padding: "10px 16px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    minWidth: 260,
    fontFamily: "inherit",
  },
  filterTab: {
    padding: "8px 16px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 13,
    color: "#555",
    cursor: "pointer",
    background: "#fff",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  filterTabActive: {
    padding: "8px 16px",
    border: "1px solid #1f4d1f",
    borderRadius: 6,
    fontSize: 13,
    color: "#fff",
    cursor: "pointer",
    background: "#1f4d1f",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  tabBadge: {
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "1px 6px",
    borderRadius: 99,
  },
  message: { textAlign: "center", color: "#666", padding: 40 },
  emptyBox: {
    textAlign: "center",
    padding: "60px 0",
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: "#888" },
  loanCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 24,
    marginBottom: 16,
  },
  loanHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 10,
  },
  loanHeaderRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
  },
  loanAmount: {
    fontSize: 28,
    fontWeight: 700,
    color: "#1f4d1f",
    marginBottom: 4,
  },
  loanApplicant: { fontSize: 13, color: "#888" },
  statusBadge: {
    fontSize: 12,
    fontWeight: 600,
    padding: "5px 14px",
    borderRadius: 99,
    textTransform: "capitalize",
  },
  repayCountBadge: {
    fontSize: 11,
    color: "#1a4fa0",
    background: "#e7f0ff",
    padding: "3px 10px",
    borderRadius: 99,
    fontWeight: 600,
  },
  autoApprovedBadge: {
    fontSize: 11,
    color: "#b36b00",
    background: "#fff8e7",
    padding: "3px 10px",
    borderRadius: 99,
    fontWeight: 600,
  },
  loanDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 14,
    padding: "16px 0",
    borderTop: "1px solid #eee",
    borderBottom: "1px solid #eee",
    marginBottom: 16,
  },
  loanDetail: {},
  loanDetailLabel: { fontSize: 11, color: "#888", marginBottom: 3 },
  loanDetailValue: {
    fontSize: 13,
    fontWeight: 600,
    color: "#111",
    textTransform: "capitalize",
  },
  idBadge: {
    fontSize: 12,
    background: "#e7f0ff",
    color: "#1a4fa0",
    padding: "4px 10px",
    borderRadius: 6,
    fontWeight: 600,
  },
  actionRow: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 14,
  },
  actionNote: { fontSize: 12, color: "#888", fontStyle: "italic" },
  actionBtns: { display: "flex", gap: 10 },
  approveBtn: {
    padding: "10px 24px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  approveBtnDisabled: {
    padding: "10px 24px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  rejectBtn: {
    padding: "10px 24px",
    background: "#fff",
    color: "#cc0000",
    border: "1px solid #cc0000",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  rejectBtnDisabled: {
    padding: "10px 24px",
    background: "#fff",
    color: "#ccc",
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: 14,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  disburseSection: {
    background: "#f0f7ec",
    borderRadius: 8,
    padding: 20,
    border: "1px solid #c5ddb8",
    marginBottom: 14,
  },
  disburseTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1f4d1f",
    marginBottom: 14,
  },
  disburseInstructions: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 16,
  },
  disburseStep: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: 13,
    color: "#444",
  },
  disburseStepNum: {
    width: 24,
    height: 24,
    background: "#1f4d1f",
    color: "#fff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  borrowerBox: {
    background: "#fff",
    borderRadius: 6,
    padding: "10px 14px",
    marginBottom: 14,
    border: "1px solid #e8e4dc",
  },
  borrowerName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#111",
    marginBottom: 4,
  },
  borrowerDetail: { fontSize: 12, color: "#888", marginBottom: 2 },
  disburseBtn: {
    padding: "12px 24px",
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
    padding: "12px 24px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 14,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  activeSection: {
    background: "#eafaf0",
    borderRadius: 8,
    padding: 16,
    border: "1px solid #c5ddb8",
    marginBottom: 14,
  },
  activeSectionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 8,
  },
  activeInfo: {
    fontSize: 13,
    color: "#1a7a3a",
    fontWeight: 500,
    marginBottom: 4,
  },
  repaymentSummary: { display: "flex", gap: 10, fontSize: 12 },
  viewRepaymentsBtn: {
    padding: "7px 16px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  repaymentsTable: {
    marginTop: 12,
    border: "1px solid #e8e4dc",
    borderRadius: 8,
    overflow: "hidden",
  },
  repaymentsHead: {
    display: "grid",
    gridTemplateColumns:
      "30px minmax(80px,1fr) minmax(80px,1fr) minmax(110px,1.5fr) minmax(80px,1fr) 80px",
    padding: "8px 14px",
    background: "#f7f5f0",
    fontSize: 11,
    fontWeight: 700,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    gap: 8,
    minWidth: 520,
    whiteSpace: "nowrap",
  },
  repaymentsRow: {
    display: "grid",
    gridTemplateColumns:
      "30px minmax(80px,1fr) minmax(80px,1fr) minmax(110px,1.5fr) minmax(80px,1fr) 80px",
    padding: "10px 14px",
    borderTop: "1px solid #f0f0f0",
    fontSize: 12,
    alignItems: "center",
    gap: 8,
    minWidth: 520,
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
  docCountBadge: {
    background: "#1f4d1f",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 10px",
    borderRadius: 99,
  },
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
  docsCardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
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
  docCardDate: { fontSize: 10, color: "#aaa", marginBottom: 4 },
  verifiedBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: "#1a7a3a",
    background: "#eafaf0",
    padding: "2px 6px",
    borderRadius: 4,
    display: "inline-block",
  },
  pendingBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: "#b36b00",
    background: "#fff8e7",
    padding: "2px 6px",
    borderRadius: 4,
    display: "inline-block",
  },
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
  verifyDocBtnDisabled: {
    padding: "5px 10px",
    background: "#f0f0f0",
    color: "#aaa",
    border: "1px solid #ddd",
    borderRadius: 5,
    fontSize: 11,
    cursor: "not-allowed",
    fontFamily: "inherit",
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
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
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
    maxWidth: 520,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    background: "#1f4d1f",
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 },
  modalClose: {
    background: "rgba(255,255,255,0.15)",
    border: "none",
    color: "#fff",
    width: 28,
    height: 28,
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: 14,
  },
  modalBody: { padding: 24 },
  modalLoanInfo: {
    background: "#f0f7ec",
    borderRadius: 8,
    padding: "14px 16px",
    marginBottom: 20,
    border: "1px solid #c5ddb8",
  },
  modalLoanAmount: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1f4d1f",
    marginBottom: 4,
  },
  modalLoanApplicant: {
    fontSize: 13,
    color: "#555",
    textTransform: "capitalize",
  },
  modalField: { marginBottom: 20 },
  modalLabel: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#444",
    marginBottom: 8,
  },
  modalLabelNote: { fontSize: 11, color: "#888", fontWeight: 400 },
  modalRateDisplay: {
    background: "#f0f7ec",
    border: "1px solid #c5ddb8",
    borderRadius: 7,
    padding: "12px 16px",
    fontSize: 18,
    fontWeight: 700,
    color: "#1f4d1f",
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
  loanPreview: {
    background: "#f7f5f0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    border: "1px solid #e8e4dc",
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 10,
  },
  previewItem: {},
  previewLabel: { fontSize: 11, color: "#888", marginBottom: 2 },
  previewVal: { fontSize: 14, fontWeight: 600, color: "#111" },
  modalFooter: { display: "flex", gap: 12, justifyContent: "flex-end" },
  modalCancelBtn: {
    padding: "10px 20px",
    background: "#f5f5f5",
    color: "#555",
    border: "1px solid #ddd",
    borderRadius: 7,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 600,
  },
  modalApproveBtn: {
    padding: "10px 24px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 700,
    fontSize: 14,
  },
};
