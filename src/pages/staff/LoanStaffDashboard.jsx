import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const LOGO_PATH = '/achoice logo.png';

export default function LoanStaffDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState('');

  // Dashboard
  const [stats, setStats] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [loanSettings, setLoanSettings] = useState(null);

  // Applications
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appFilter, setAppFilter] = useState('all');
  const [appSearch, setAppSearch] = useState('');
  const [deciding, setDeciding] = useState(null);
  const [disbursing, setDisbursing] = useState(null);

  // Documents per loan
  const [expandedDocs, setExpandedDocs] = useState(null);
  const [docsMap, setDocsMap] = useState({});
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docForm, setDocForm] = useState({ type: 'nin', file: null });

  // Repayments
  const [repayments, setRepayments] = useState([]);
  const [repaymentsLoading, setRepaymentsLoading] = useState(false);
  const [repaySearch, setRepaySearch] = useState('');

  // User History
  const [userHistory, setUserHistory] = useState(null);
  const [userHistoryLoading, setUserHistoryLoading] = useState(false);
  const [userIdInput, setUserIdInput] = useState('');

  // Apply on behalf
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyForm, setApplyForm] = useState({
    seller_id: '', amount: '', purpose: '', duration_months: '',
    repayment_preference: 'monthly', nin_number: '', bvn_number: '',
    documents: {},
  });
  const [applying, setApplying] = useState(false);
  const [sellerQuery, setSellerQuery] = useState('');
  const [sellerResults, setSellerResults] = useState([]);
  const [sellerSearching, setSellerSearching] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const debounceRef = useRef(null);

  let user = null;
  try { user = JSON.parse(localStorage.getItem('user')); } catch {}

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };
  const toMoney = (val) => `₦${Number(val || 0).toLocaleString()}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  // ── Load dashboard + settings ─────────────────────────────────────────────
  useEffect(() => {
    api.get('/staff/loan/dashboard').then(r => setStats(r.data)).catch(() => {});
    api.get('/staff/loan/my-stats').then(r => setMyStats(r.data)).catch(() => {});
    api.get('/settings/loan').then(r => setLoanSettings(r.data)).catch(() => {});
  }, []);

  // ── Load tab data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'applications') {
      setAppsLoading(true);
      api.get('/staff/loan/applications')
        .then(r => setApplications(r.data?.data || r.data || []))
        .catch(() => {})
        .finally(() => setAppsLoading(false));
    }
    if (activeTab === 'repayments') {
      setRepaymentsLoading(true);
      api.get('/staff/loan/repayments')
        .then(r => setRepayments(r.data?.data || r.data || []))
        .catch(() => {})
        .finally(() => setRepaymentsLoading(false));
    }
  }, [activeTab]);

  // ── Seller live search ────────────────────────────────────────────────────
  useEffect(() => {
    if (sellerQuery.length < 2) { setSellerResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSellerSearching(true);
      api.get('/staff/loan/sellers/search', { params: { q: sellerQuery } })
        .then(r => setSellerResults(r.data?.sellers || []))
        .catch(() => setSellerResults([]))
        .finally(() => setSellerSearching(false));
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [sellerQuery]);

  const handleSelectSeller = (seller) => {
    setSelectedSeller(seller);
    setApplyForm(p => ({ ...p, seller_id: seller.id }));
    setSellerQuery('');
    setSellerResults([]);
  };

  // ── Full loan lifecycle ───────────────────────────────────────────────────
  const handleDecision = async (loanId, decision) => {
    let payload = { decision };
    if (decision === 'rejected') {
      const reason = window.prompt('Enter rejection reason:');
      if (!reason) return;
      payload.rejection_reason = reason;
    }
    setDeciding(loanId);
    try {
      await api.patch(`/staff/loan/applications/${loanId}/decision`, payload);
      setApplications(p => p.map(a => a.id === loanId ? { ...a, status: decision } : a));
      showToast(`✅ Application ${decision}! Buyer notified.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to process decision.');
    } finally {
      setDeciding(null);
    }
  };

  const handleDisburse = async (loan) => {
    if (!window.confirm(
      `Confirm disbursement for ${loan.user?.name}?\n\nAmount: ₦${Number(loan.amount).toLocaleString()}\n\n⚠️ Only confirm AFTER manually transferring the money.`
    )) return;
    setDisbursing(loan.id);
    try {
      await api.patch(`/admin/loans/${loan.id}/disburse`);
      setApplications(p => p.map(a => a.id === loan.id
        ? { ...a, status: 'disbursed', disbursed_at: new Date().toISOString() }
        : a
      ));
      showToast('✅ Loan disbursed! Repayment schedule activated.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Disbursement failed.');
    } finally {
      setDisbursing(null);
    }
  };

  // ── Documents ─────────────────────────────────────────────────────────────
  const handleViewDocs = async (loanId) => {
    if (expandedDocs === loanId) { setExpandedDocs(null); return; }
    setExpandedDocs(loanId);
    if (docsMap[loanId]) return; // already loaded
    setDocsLoading(true);
    try {
      const r = await api.get(`/loans/${loanId}/documents`);
      // ✅ Handle all possible response shapes
      const raw = r.data?.data || r.data?.documents || r.data;
      setDocsMap(p => ({ ...p, [loanId]: Array.isArray(raw) ? raw : [] }));
    } catch {
      setDocsMap(p => ({ ...p, [loanId]: [] }));
    } finally {
      setDocsLoading(false);
    }
  };

  const handleUploadDoc = async (loanId) => {
    if (!docForm.file) return showToast('Please select a file.');
    setUploadingDoc(true);
    const form = new FormData();
    form.append('file', docForm.file);
    form.append('type', docForm.type);
    // ✅ also send document_type for compatibility
    form.append('document_type', docForm.type);
    try {
      await api.post(`/loans/${loanId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('✅ Document uploaded!');
      setDocForm({ type: 'nin', file: null });
      // Refresh docs for this loan
      const r = await api.get(`/loans/${loanId}/documents`);
      const raw = r.data?.data || r.data?.documents || r.data;
      setDocsMap(p => ({ ...p, [loanId]: Array.isArray(raw) ? raw : [] }));
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed. Check file type and size.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId, loanId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/loans/documents/${docId}`);
      setDocsMap(p => ({ ...p, [loanId]: (p[loanId] || []).filter(d => d.id !== docId) }));
      showToast('Document deleted.');
    } catch {
      showToast('Failed to delete document.');
    }
  };

  // ── User History ──────────────────────────────────────────────────────────
  const handleViewUserHistory = async () => {
    if (!userIdInput) return;
    setUserHistoryLoading(true);
    setUserHistory(null);
    try {
      const r = await api.get(`/staff/loan/users/${userIdInput}/history`);
      setUserHistory(r.data);
    } catch {
      showToast('User not found or has no loan history.');
    } finally {
      setUserHistoryLoading(false);
    }
  };

  // ── Apply on Behalf ───────────────────────────────────────────────────────
  const handleApplyOnBehalf = async (e) => {
    e.preventDefault();
    if (!applyForm.seller_id) return showToast('Please search and select a seller first.');
    const docs = applyForm.documents || {};
    if (!docs.nin_document)   return showToast('Please upload the NIN document.');
    if (!docs.bvn_document)   return showToast('Please upload the BVN document.');
    if (!docs.bank_statement) return showToast('Please upload the bank statement.');
    setApplying(true);
    try {
      const form = new FormData();
      form.append('seller_id',           Number(applyForm.seller_id));
      form.append('amount',              Number(applyForm.amount));
      form.append('purpose',             applyForm.purpose);
      form.append('duration_months',     Number(applyForm.duration_months));
      form.append('repayment_preference',applyForm.repayment_preference);
      form.append('nin_number',          applyForm.nin_number);
      form.append('bvn_number',          applyForm.bvn_number);
      if (docs.nin_document)        form.append('nin_document',        docs.nin_document);
      if (docs.bvn_document)        form.append('bvn_document',        docs.bvn_document);
      if (docs.bank_statement)      form.append('bank_statement',      docs.bank_statement);
      if (docs.collateral_document) form.append('collateral_document', docs.collateral_document);
      if (docs.other_document)      form.append('other_document',      docs.other_document);
      await api.post('/staff/loan/apply-for-seller', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('✅ Loan application submitted!');
      setShowApplyForm(false);
      setSelectedSeller(null);
      setApplyForm({ seller_id: '', amount: '', purpose: '', duration_months: '', repayment_preference: 'monthly', nin_number: '', bvn_number: '', documents: {} });
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) showToast(Object.values(errors)[0][0]);
      else showToast(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  // ── Download Reports ──────────────────────────────────────────────────────
  const handleDownloadReport = async (format) => {
    setDownloading(true);
    try {
      const r = await api.get('/staff/loan/reports/export', {
        params: { format, type: 'all' }, responseType: 'blob',
      });
      const ext = format === 'excel' ? 'xlsx' : format;
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `loan-report-${new Date().toISOString().slice(0,10)}.${ext}`; a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      if (format === 'csv') generateCSV();
      else if (format === 'excel') generateExcel();
      else generatePDF();
    } finally { setDownloading(false); }
  };

  const generateCSV = () => {
    const rows = [
      ['#','Applicant','Email','Phone','Amount','Purpose','Duration','Interest','Total','Monthly','Status','Applied','Disbursed','Due','Paid','Balance'],
      ...applications.map((a,i) => [
        i+1, a.user?.name||'', a.user?.email||'', a.user?.phone||'',
        a.amount, a.purpose, `${a.duration_months}mo`, `${a.interest_rate}%`,
        a.total_repayable||'', a.monthly_instalment||'', a.status,
        fmtDate(a.created_at), fmtDate(a.disbursed_at), fmtDate(a.due_date),
        a.amount_paid||0, a.balance||0,
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `loan-report-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const generateExcel = () => {
    const rows = [
      ['#','Applicant','Email','Phone','Amount','Purpose','Duration','Interest','Total','Monthly','Status','Applied','Disbursed','Due','Paid','Balance'],
      ...applications.map((a,i) => [
        i+1, a.user?.name, a.user?.email, a.user?.phone,
        Number(a.amount), a.purpose, a.duration_months, a.interest_rate,
        Number(a.total_repayable||0), Number(a.monthly_instalment||0), a.status,
        fmtDate(a.created_at), fmtDate(a.disbursed_at), fmtDate(a.due_date),
        Number(a.amount_paid||0), Number(a.balance||0),
      ]),
    ];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.map(r=>r.join('\t')).join('\n')], { type: 'application/vnd.ms-excel' }));
    a.download = `loan-report-${new Date().toISOString().slice(0,10)}.xls`; a.click();
  };

  const generatePDF = () => {
    const rate = Number(loanSettings?.default_interest || loanSettings?.interest_rate || 0);
    const rows = applications.map((a,i) => `
      <tr style="background:${i%2===0?'#f9f9f9':'#fff'}">
        <td>${i+1}</td><td>${a.user?.name||''}</td><td>₦${Number(a.amount).toLocaleString()}</td>
        <td>${a.purpose}</td><td>${a.duration_months}mo</td>
        <td style="color:${a.status==='completed'?'#1a7a3a':a.status==='rejected'?'#cc0000':'#b36b00'}">${a.status}</td>
        <td>₦${Number(a.amount_paid||0).toLocaleString()}</td>
        <td>₦${Number(a.balance||0).toLocaleString()}</td>
      </tr>`).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>ACHOICE Loan Report</title>
      <style>body{font-family:Arial;padding:32px}h1{color:#1f4d1f}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#1f4d1f;color:#fff;padding:10px 8px;text-align:left}td{padding:8px;border-bottom:1px solid #eee}@media print{button{display:none}}</style>
      </head><body>
      <h1>ACHOICE LIMITED — Loan Report</h1>
      <p>Generated: ${new Date().toLocaleDateString('en-NG',{year:'numeric',month:'long',day:'numeric'})} · Staff: ${user?.name} · Interest Rate: ${rate}%</p>
      <table><thead><tr><th>#</th><th>Applicant</th><th>Amount</th><th>Purpose</th><th>Duration</th><th>Status</th><th>Paid</th><th>Balance</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p style="margin-top:24px;font-size:11px;color:#888;text-align:center">ACHOICE LIMITED · Your needs our solutions · Confidential</p>
      <script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getStatusStyle = (status) => ({
    pending:    { background: '#fff8e7', color: '#b36b00' },
    approved:   { background: '#eafaf0', color: '#1a7a3a' },
    disbursed:  { background: '#e7f0ff', color: '#1a4fa0' },
    active:     { background: '#e7f0ff', color: '#1a4fa0' },
    rejected:   { background: '#fff0f0', color: '#cc0000' },
    completed:  { background: '#f0f0f0', color: '#555' },
    successful: { background: '#eafaf0', color: '#1a7a3a' },
    failed:     { background: '#fff0f0', color: '#cc0000' },
  }[status] || { background: '#f0f0f0', color: '#555' });

  const filteredApps = applications
    .filter(a => appFilter === 'all' || a.status === appFilter)
    .filter(a => !appSearch ||
      (a.user?.name||'').toLowerCase().includes(appSearch.toLowerCase()) ||
      (a.purpose||'').toLowerCase().includes(appSearch.toLowerCase())
    );

  const filteredRepayments = repayments.filter(r =>
    !repaySearch ||
    (r.user?.name||r.loan?.user?.name||'').toLowerCase().includes(repaySearch.toLowerCase()) ||
    (r.payment_reference||'').toLowerCase().includes(repaySearch.toLowerCase())
  );

  const docTypeIcon = (type) => ({ nin:'🪪', bvn:'🏦', bank_statement:'📊', collateral:'🏠', other:'📄' }[type] || '📄');
  const docTypeLabel = (type) => ({ nin:'NIN Document', bvn:'BVN Document', bank_statement:'Bank Statement', collateral:'Collateral', other:'Other' }[type] || type);

  // ── Preview loan calc ─────────────────────────────────────────────────────
  const previewLoan = () => {
    if (!applyForm.amount || !applyForm.duration_months) return null;
    const rate = Number(loanSettings?.default_interest || loanSettings?.interest_rate || 5);
    const amount = Number(applyForm.amount);
    const months = Number(applyForm.duration_months);
    const interest = amount * rate / 100;
    const total = amount + interest;
    return {
      rate, amount, months, interest, total,
      monthly: Math.ceil(total / months),
      weekly:  Math.ceil(total / months / 4),
    };
  };
  const preview = previewLoan();

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <img src={LOGO_PATH} alt="Achoice" style={s.logoImg} />
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Loan Staff</div>
          </div>
        </div>
        <nav style={s.sidebarNav}>
          {[
            { icon: '📊', label: 'Dashboard',    tab: 'dashboard' },
            { icon: '📋', label: 'Applications', tab: 'applications' },
            { icon: '💳', label: 'Repayments',   tab: 'repayments' },
            { icon: '🔍', label: 'User History', tab: 'history' },
          ].map(item => (
            <div key={item.tab}
              style={{ ...s.sidebarItem, ...(activeTab === item.tab ? s.sidebarItemActive : {}) }}
              onClick={() => setActiveTab(item.tab)}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
         <button style={s.backAdminBtn} onClick={() => navigate('/admin/dashboard')}>
  ← Admin Dashboard
</button>
        <div style={s.sidebarFooter}>
          <div style={s.staffName}>{user?.name}</div>
          <div style={s.staffRole}>Loan Staff</div>
          <button style={s.logoutBtn} onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</button>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>

        {/* ═══════════════ DASHBOARD ═══════════════ */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 style={s.pageTitle}>Loan Staff Dashboard</h1>
            <p style={s.pageSub}>Welcome back, {user?.name?.split(' ')[0]}. Interest rate: <strong>{loanSettings?.default_interest || loanSettings?.interest_rate || '—'}%</strong></p>

            {stats ? (
              <>
                <div style={s.sectionLabel}>Platform Overview</div>
                <div style={s.statsGrid}>
                  {[
                    { label: 'Total Applications', value: stats.total_applications||0,         icon:'📋', color:'#1f4d1f' },
                    { label: 'Pending Review',      value: stats.pending_applications||0,       icon:'⏳', color:'#b36b00' },
                    { label: 'Approved',            value: stats.approved_loans||0,             icon:'✅', color:'#1a7a3a' },
                    { label: 'Active Loans',        value: stats.active_loans||0,               icon:'🔄', color:'#1a4fa0' },
                    { label: 'Total Disbursed',     value: toMoney(stats.total_disbursed),      icon:'💸', color:'#1f4d1f' },
                    { label: 'Total Repaid',        value: toMoney(stats.total_repaid),         icon:'💰', color:'#1a7a3a' },
                    { label: 'Outstanding',         value: toMoney(stats.outstanding_balance),  icon:'⚠️', color:'#cc0000' },
                    { label: 'Completed',           value: stats.completed_loans||0,            icon:'🎉', color:'#555' },
                  ].map(stat => (
                    <div key={stat.label} style={s.statCard}>
                      <div style={s.statTop}><div style={s.statLabel}>{stat.label}</div><div style={s.statIcon}>{stat.icon}</div></div>
                      <div style={{ ...s.statValue, color: stat.color }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {myStats && (
                  <>
                    <div style={s.sectionLabel}>My Activity — {user?.name}</div>
                    <div style={s.myStatsGrid}>
                      {[
                        { label: 'I Reviewed',          value: myStats.total_reviewed||0,           icon:'📋', color:'#1f4d1f' },
                        { label: 'I Approved',          value: myStats.approved||0,                 icon:'✅', color:'#1a7a3a' },
                        { label: 'I Rejected',          value: myStats.rejected||0,                 icon:'✕',  color:'#cc0000' },
                        { label: 'Pending My Review',   value: myStats.pending_review||0,           icon:'⏳', color:'#b36b00' },
                        { label: 'Active (Mine)',        value: myStats.active_loans||0,             icon:'🔄', color:'#1a4fa0' },
                        { label: 'Disbursed (Mine)',     value: toMoney(myStats.total_disbursed),   icon:'💸', color:'#1f4d1f' },
                        { label: 'Repaid (Mine)',        value: toMoney(myStats.total_repaid),      icon:'💰', color:'#1a7a3a' },
                        { label: 'Outstanding (Mine)',   value: toMoney(myStats.outstanding),       icon:'⚠️', color:'#cc0000' },
                        { label: 'Completed (Mine)',     value: myStats.completed||0,               icon:'🎉', color:'#555' },
                      ].map(stat => (
                        <div key={stat.label} style={s.myStatCard}>
                          <div style={s.statTop}><div style={s.statLabel}>{stat.label}</div><div style={s.statIcon}>{stat.icon}</div></div>
                          <div style={{ ...s.statValue, color: stat.color }}>{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Quick Actions */}
                <div style={s.quickActions}>
                  <div style={s.quickActionsTitle}>Quick Actions</div>
                  <div style={s.quickActionsRow}>
                    <button style={s.quickBtn} onClick={() => { setActiveTab('applications'); setAppFilter('pending'); }}>⏳ Review Pending ({stats.pending_applications||0})</button>
                    <button style={s.quickBtn} onClick={() => setShowApplyForm(!showApplyForm)}>➕ Apply on Behalf of Seller</button>
                    <button style={s.quickBtn} onClick={() => setActiveTab('repayments')}>💳 View Repayments</button>
                  </div>
                </div>

                {/* Download Reports */}
                <div style={s.reportsCard}>
                  <div style={s.reportsCardTitle}>📊 Download Loan Reports</div>
                  <div style={s.reportsCardSub}>Export all loan data — interest rate: {loanSettings?.default_interest||'—'}%</div>
                  <div style={s.downloadBtns}>
                    <button style={downloading ? s.downloadBtnDisabled : { ...s.downloadBtn, background: '#cc0000' }} onClick={() => handleDownloadReport('pdf')} disabled={downloading}>📄 PDF</button>
                    <button style={downloading ? s.downloadBtnDisabled : { ...s.downloadBtn, background: '#1a7a3a' }} onClick={() => handleDownloadReport('excel')} disabled={downloading}>📊 Excel</button>
                    <button style={downloading ? s.downloadBtnDisabled : { ...s.downloadBtn, background: '#1a4fa0' }} onClick={() => handleDownloadReport('csv')} disabled={downloading}>📋 CSV</button>
                  </div>
                </div>

                {/* Apply on Behalf Form */}
                {showApplyForm && (
                  <div style={s.applyCard}>
                    <div style={s.applyHeader}>
                      <h3 style={s.applyTitle}>Apply Loan on Behalf of Seller</h3>
                      <button style={s.closeBtn} onClick={() => { setShowApplyForm(false); setSelectedSeller(null); setSellerQuery(''); setSellerResults([]); }}>✕</button>
                    </div>
                    <form onSubmit={handleApplyOnBehalf}>

                      {/* Step 1 — Find Seller */}
                      <div style={s.formSection}>
                        <div style={s.formSectionTitle}>Step 1 — Find Seller</div>
                        <div style={s.sellerSearchBox}>
                          <input style={s.sellerSearchInput} type="text" placeholder="Search by business name, owner name, email or phone..."
                            value={sellerQuery} onChange={e => { setSellerQuery(e.target.value); setSelectedSeller(null); setApplyForm(p => ({ ...p, seller_id: '' })); }} />
                          {sellerSearching && <div style={s.sellerSearching}>Searching...</div>}
                          {sellerResults.length > 0 && (
                            <div style={s.sellerDropdown}>
                              {sellerResults.map(seller => (
                                <div key={seller.id} style={s.sellerDropdownItem}
                                  onClick={() => handleSelectSeller(seller)}
                                  onMouseEnter={e => e.currentTarget.style.background='#f0f7ec'}
                                  onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                                  <div style={s.sellerDropdownName}>{seller.business_name}</div>
                                  <div style={s.sellerDropdownMeta}>👤 {seller.owner_name} · ✉ {seller.owner_email} · 📞 {seller.owner_phone}</div>
                                  <div style={s.sellerDropdownState}>📍 {seller.state} · Seller ID: {seller.id}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {sellerQuery.length >= 2 && !sellerSearching && sellerResults.length === 0 && (
                            <div style={s.sellerNoResults}>No sellers found for "{sellerQuery}"</div>
                          )}
                        </div>
                        {selectedSeller && (
                          <div style={s.selectedSellerCard}>
                            <div style={{ fontSize: 28 }}>🏪</div>
                            <div style={{ flex: 1 }}>
                              <div style={s.selectedSellerName}>{selectedSeller.business_name}</div>
                              <div style={s.selectedSellerMeta}>{selectedSeller.owner_name} · {selectedSeller.owner_email} · {selectedSeller.owner_phone}</div>
                              <div style={s.selectedSellerMeta}>📍 {selectedSeller.state} · Seller ID: {selectedSeller.id}</div>
                            </div>
                            <button type="button" style={s.clearSellerBtn} onClick={() => { setSelectedSeller(null); setApplyForm(p => ({ ...p, seller_id: '' })); }}>Change</button>
                          </div>
                        )}
                      </div>

                      {/* Step 2 — Loan Details */}
                      <div style={s.formSection}>
                        <div style={s.formSectionTitle}>Step 2 — Loan Details</div>
                        {loanSettings && (
                          <div style={s.interestNote}>
                            📌 Interest rate from settings: <strong>{loanSettings?.default_interest || loanSettings?.interest_rate}%</strong> flat
                          </div>
                        )}
                        <div style={s.applyGrid}>
                          <div style={s.field}>
                            <label style={s.label}>Loan Amount (₦) <span style={s.required}>*</span></label>
                            <input style={s.input} type="number" value={applyForm.amount}
                              onChange={e => setApplyForm(p => ({ ...p, amount: e.target.value }))}
                              placeholder={`Min ₦${Number(loanSettings?.min_amount||5000).toLocaleString()}`}
                              min={loanSettings?.min_amount||5000} max={loanSettings?.max_amount||5000000} required />
                          </div>
                          <div style={s.field}>
                            <label style={s.label}>Purpose <span style={s.required}>*</span></label>
                            <select style={s.input} value={applyForm.purpose} onChange={e => setApplyForm(p => ({ ...p, purpose: e.target.value }))} required>
                              <option value="">Select purpose</option>
                              {(loanSettings?.purposes||[]).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                          </div>
                          <div style={s.field}>
                            <label style={s.label}>Duration <span style={s.required}>*</span></label>
                            <select style={s.input} value={applyForm.duration_months} onChange={e => setApplyForm(p => ({ ...p, duration_months: e.target.value }))} required>
                              <option value="">Select duration</option>
                              {(loanSettings?.durations||[]).map(d => <option key={d.id} value={d.months}>{d.label}</option>)}
                            </select>
                          </div>
                          <div style={s.field}>
                            <label style={s.label}>Repayment Preference</label>
                            <select style={s.input} value={applyForm.repayment_preference} onChange={e => setApplyForm(p => ({ ...p, repayment_preference: e.target.value }))}>
                              <option value="monthly">Monthly</option>
                              <option value="weekly">Weekly</option>
                            </select>
                          </div>
                        </div>

                        {preview && (
                          <div style={s.loanPreview}>
                            <div style={s.previewTitle}>📊 Loan Preview (Interest: {preview.rate}% from settings)</div>
                            <div style={s.previewGrid}>
                              {[
                                ['Principal',          `₦${preview.amount.toLocaleString()}`],
                                [`Interest (${preview.rate}%)`, `₦${preview.interest.toLocaleString()}`],
                                ['Total Repayable',    `₦${preview.total.toLocaleString()}`],
                                ['Monthly Payment',    `₦${preview.monthly.toLocaleString()}`],
                                ['Weekly Payment',     `₦${preview.weekly.toLocaleString()}`],
                                ['Duration',           `${preview.months} months`],
                              ].map(([label,val]) => (
                                <div key={label} style={s.previewItem}>
                                  <div style={s.previewLabel}>{label}</div>
                                  <div style={s.previewVal}>{val}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Step 3 — Identity */}
                      <div style={s.formSection}>
                        <div style={s.formSectionTitle}>Step 3 — Identity Verification</div>
                        <div style={s.applyGrid}>
                          <div style={s.field}>
                            <label style={s.label}>NIN Number <span style={s.required}>*</span></label>
                            <input style={s.input} type="text" value={applyForm.nin_number}
                              onChange={e => setApplyForm(p => ({ ...p, nin_number: e.target.value }))}
                              placeholder="11-digit National ID Number" maxLength={11} required />
                          </div>
                          <div style={s.field}>
                            <label style={s.label}>BVN Number <span style={s.required}>*</span></label>
                            <input style={s.input} type="text" value={applyForm.bvn_number}
                              onChange={e => setApplyForm(p => ({ ...p, bvn_number: e.target.value }))}
                              placeholder="11-digit Bank Verification Number" maxLength={11} required />
                          </div>
                        </div>
                      </div>

                      {/* Step 4 — Documents */}
                      <div style={s.formSection}>
                        <div style={s.formSectionTitle}>Step 4 — Supporting Documents</div>
                        <p style={s.docNote}>Accepted: JPG, PNG, PDF. Max 5MB each.</p>
                        <div style={s.docsGrid2}>
                          {[
                            { key:'nin_document',        label:'NIN Document',   required:true,  desc:'National ID card or NIMC slip' },
                            { key:'bvn_document',        label:'BVN Document',   required:true,  desc:'Bank verification letter' },
                            { key:'bank_statement',      label:'Bank Statement', required:true,  desc:'Last 3-6 months' },
                            { key:'collateral_document', label:'Collateral',     required:false, desc:'Property deed, vehicle papers, etc.' },
                            { key:'other_document',      label:'Other',          required:false, desc:'Any additional document' },
                          ].map(doc => (
                            <div key={doc.key} style={s.docUploadField}>
                              <label style={s.label}>
                                {doc.label}{doc.required && <span style={s.required}> *</span>}
                                <span style={s.docDesc}> — {doc.desc}</span>
                              </label>
                              <input type="file" accept=".jpg,.jpeg,.png,.pdf"
                                style={s.fileInput}
                                onChange={e => setApplyForm(p => ({ ...p, documents: { ...(p.documents||{}), [doc.key]: e.target.files[0] } }))} />
                              {applyForm.documents?.[doc.key] && (
                                <div style={s.fileSelected}>✅ {applyForm.documents[doc.key].name}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <button type="submit" style={applying || !applyForm.seller_id ? s.submitBtnDisabled : s.submitBtn} disabled={applying || !applyForm.seller_id}>
                        {applying ? '⏳ Submitting...' : !applyForm.seller_id ? '⚠️ Select a seller first' : '📋 Submit Loan Application'}
                      </button>
                    </form>
                  </div>
                )}
              </>
            ) : <p style={s.loading}>Loading dashboard...</p>}
          </div>
        )}

        {/* ═══════════════ APPLICATIONS ═══════════════ */}
        {activeTab === 'applications' && (
          <div>
            <h1 style={s.pageTitle}>Loan Applications</h1>
            <div style={s.filterRow}>
              <div style={s.filterTabs}>
                {['all','pending','approved','disbursed','active','rejected','completed'].map(tab => (
                  <button key={tab} style={appFilter===tab ? s.filterTabActive : s.filterTab} onClick={() => setAppFilter(tab)}>
                    {tab.charAt(0).toUpperCase()+tab.slice(1)}
                    {tab!=='all' && applications.filter(a=>a.status===tab).length>0 && (
                      <span style={s.tabCount}>{applications.filter(a=>a.status===tab).length}</span>
                    )}
                  </button>
                ))}
              </div>
              <input style={s.searchInput} placeholder="Search by name or purpose..." value={appSearch} onChange={e => setAppSearch(e.target.value)} />
            </div>

            {appsLoading && <p style={s.loading}>Loading applications...</p>}

            {filteredApps.map(app => (
              <div key={app.id} style={s.appCard}>
                {/* Header */}
                <div style={s.appHeader}>
                  <div>
                    <div style={s.appAmount}>{toMoney(app.amount)}</div>
                    <div style={s.appMeta}>👤 {app.user?.name} · ✉ {app.user?.email}{app.user?.phone && ` · 📞 ${app.user.phone}`}</div>
                    <div style={s.appPurpose}>{app.purpose}</div>
                  </div>
                  <div style={s.appHeaderRight}>
                    <div style={{ ...s.statusBadge, ...getStatusStyle(app.status) }}>{app.status}</div>
                    <div style={s.appDate}>{fmtDate(app.created_at)}</div>
                  </div>
                </div>

                {/* Details */}
                <div style={s.appDetails}>
                  {[
                    ['Duration',           `${app.duration_months||'—'} months`],
                    ['Interest Rate',      app.interest_rate ? `${app.interest_rate}%` : '—'],
                    ['Total Repayable',    toMoney(app.total_repayable)],
                    ['Monthly Instalment', toMoney(app.monthly_instalment)],
                    ['Amount Paid',        toMoney(app.amount_paid)],
                    ['Balance',            toMoney(app.balance)],
                    ['Disbursed',          fmtDate(app.disbursed_at)],
                    ['Due Date',           fmtDate(app.due_date)],
                  ].map(([label,val]) => (
                    <div key={label} style={s.appDetail}>
                      <div style={s.appDetailLabel}>{label}</div>
                      <div style={s.appDetailVal}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* ✅ Full loan lifecycle actions */}
                <div style={s.lifecycleRow}>
                  {/* Pending → Approve/Reject */}
                  {app.status === 'pending' && (
                    <div style={s.actionGroup}>
                      <div style={s.actionGroupLabel}>Step 1 — Review Application</div>
                      <div style={s.actionBtns}>
                        <button style={deciding===app.id ? s.approveBtnDisabled : s.approveBtn}
                          onClick={() => handleDecision(app.id,'approved')} disabled={deciding===app.id}>
                          {deciding===app.id ? 'Processing...' : '✓ Approve'}
                        </button>
                        <button style={deciding===app.id ? s.rejectBtnDisabled : s.rejectBtn}
                          onClick={() => handleDecision(app.id,'rejected')} disabled={deciding===app.id}>
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Approved → Disburse */}
                  {app.status === 'approved' && (
                    <div style={s.actionGroup}>
                      <div style={s.actionGroupLabel}>Step 2 — Disburse Loan (after manual bank transfer)</div>
                      <div style={s.borrowerInfo}>
                        👤 {app.user?.name} · ✉ {app.user?.email}{app.user?.phone && ` · 📞 ${app.user?.phone}`}
                      </div>
                      <button style={disbursing===app.id ? s.disburseBtnDisabled : s.disburseBtn}
                        onClick={() => handleDisburse(app)} disabled={disbursing===app.id}>
                        {disbursing===app.id ? '⏳ Processing...' : '💸 Confirm Disbursement & Activate Schedule'}
                      </button>
                    </div>
                  )}

                  {/* Disbursed/Active info */}
                  {(app.status==='disbursed'||app.status==='active') && (
                    <div style={s.activeNote}>
                      {app.status==='disbursed' ? '✅ Disbursed — repayment schedule active.' : '🔄 Active — buyer making repayments.'}
                      {app.amount_paid > 0 && <span style={{ marginLeft: 12, fontWeight: 600 }}>Paid: {toMoney(app.amount_paid)} · Balance: {toMoney(app.balance)}</span>}
                    </div>
                  )}

                  {app.status==='rejected' && <div style={s.rejectedNote}>✕ Rejected{app.rejection_reason ? `: ${app.rejection_reason}` : ''}</div>}
                  {app.status==='completed' && <div style={s.completedNote}>🎉 Fully repaid and completed on {fmtDate(app.completed_at)}.</div>}
                </div>

                {/* ✅ Documents — view first, upload below */}
                <div style={s.docsSection}>
                  <button style={s.docsToggleBtn} onClick={() => handleViewDocs(app.id)}>
                    📎 {expandedDocs===app.id ? 'Hide' : 'View'} Documents
                    {docsMap[app.id]?.length > 0 && <span style={s.docsBadge}>{docsMap[app.id].length}</span>}
                  </button>

                  {expandedDocs===app.id && (
                    <div style={s.docsPanel}>
                      {docsLoading && !docsMap[app.id] ? (
                        <p style={s.loading}>Loading documents...</p>
                      ) : (
                        <>
                          {/* Existing documents */}
                          <div style={s.docsPanelTitle}>📁 Uploaded Documents ({(docsMap[app.id]||[]).length})</div>
                          {(docsMap[app.id]||[]).length === 0 ? (
                            <div style={s.noDocsBox}>
                              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                              <p style={s.noDocsText}>No documents uploaded for this application yet.</p>
                            </div>
                          ) : (
                            <div style={s.docsCardGrid}>
                              {(docsMap[app.id]||[]).map(doc => (
                                <div key={doc.id} style={s.docCard}>
                                  <div style={s.docCardIcon}>{docTypeIcon(doc.type)}</div>
                                  <div style={s.docCardBody}>
                                    <div style={s.docCardType}>{docTypeLabel(doc.type)}</div>
                                    <div style={s.docCardName}>{doc.original_name||doc.file_name||'Document'}</div>
                                    <div style={s.docCardDate}>📅 {fmtDate(doc.created_at)}</div>
                                  </div>
                                  <div style={s.docCardActions}>
                                    <a href={doc.url||doc.file_url} target="_blank" rel="noreferrer" style={s.viewDocBtn}>👁 View</a>
                                    <a href={doc.url||doc.file_url} download style={s.downloadDocBtn}>⬇ Download</a>
                                    <button style={s.deleteDocBtn} onClick={() => handleDeleteDoc(doc.id, app.id)}>🗑</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Upload new */}
                          <div style={s.uploadSection}>
                            <div style={s.uploadSectionTitle}>⬆ Upload New Document</div>
                            <div style={s.uploadRow}>
                              <select style={s.uploadSelect} value={docForm.type}
                                onChange={e => setDocForm(p => ({ ...p, type: e.target.value }))}>
                                <option value="nin">NIN Document</option>
                                <option value="bvn">BVN Document</option>
                                <option value="bank_statement">Bank Statement</option>
                                <option value="collateral">Collateral</option>
                                <option value="other">Other</option>
                              </select>
                              <input type="file" accept=".jpg,.jpeg,.png,.pdf" style={s.uploadInput}
                                onChange={e => setDocForm(p => ({ ...p, file: e.target.files[0] }))} />
                              <button style={uploadingDoc ? s.uploadBtnDisabled : s.uploadBtn}
                                type="button" onClick={() => handleUploadDoc(app.id)} disabled={uploadingDoc}>
                                {uploadingDoc ? '⏳ Uploading...' : '⬆ Upload'}
                              </button>
                            </div>
                            {docForm.file && (
                              <div style={s.fileSelected}>Selected: <strong>{docForm.file.name}</strong> ({(docForm.file.size/1024).toFixed(1)} KB)</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {!appsLoading && filteredApps.length===0 && (
              <div style={s.emptyBox}><div style={s.emptyIcon}>📋</div><p style={s.emptyText}>No {appFilter==='all'?'':appFilter} applications found.</p></div>
            )}
          </div>
        )}

        {/* ═══════════════ REPAYMENTS ═══════════════ */}
        {activeTab === 'repayments' && (
          <div>
            <h1 style={s.pageTitle}>Repayment History</h1>
            <input style={{ ...s.searchInput, marginBottom:20, width:'100%', maxWidth:400 }}
              placeholder="Search by name or reference..." value={repaySearch} onChange={e => setRepaySearch(e.target.value)} />
            {repaymentsLoading && <p style={s.loading}>Loading repayments...</p>}
            <div style={s.tableCard}>
              <table style={s.table}>
                <thead><tr style={s.tableHead}>
                  <th style={s.th}>Borrower</th><th style={s.th}>Amount</th>
                  <th style={s.th}>Reference</th><th style={s.th}>Balance After</th>
                  <th style={s.th}>Paid On</th><th style={s.th}>Status</th>
                </tr></thead>
                <tbody>
                  {filteredRepayments.map((r,i) => (
                    <tr key={r.id||i} style={{ ...s.tableRow, background: r.status==='successful'?'#f0fff4':'#fff' }}>
                      <td style={s.td}><div style={s.repayName}>{r.user?.name||r.loan?.user?.name||'—'}</div><div style={s.repayEmail}>{r.user?.email||r.loan?.user?.email||''}</div></td>
                      <td style={{ ...s.td, fontWeight:700, color:'#1f4d1f' }}>{toMoney(r.amount)}</td>
                      <td style={{ ...s.td, fontSize:11, color:'#888' }}>{r.payment_reference?r.payment_reference.slice(-14):'—'}</td>
                      <td style={s.td}>{toMoney(r.balance_after)}</td>
                      <td style={s.td}>{fmtDate(r.paid_at||r.updated_at)}</td>
                      <td style={s.td}><span style={{ ...s.statusBadge, ...getStatusStyle(r.status) }}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!repaymentsLoading && filteredRepayments.length===0 && <div style={s.emptyBox}><p style={s.emptyText}>No repayments found.</p></div>}
            </div>
          </div>
        )}

        {/* ═══════════════ USER HISTORY ═══════════════ */}
        {activeTab === 'history' && (
          <div>
            <h1 style={s.pageTitle}>User Loan History</h1>
            <p style={s.pageSub}>Look up any user's complete loan and repayment history by user ID.</p>
            <div style={s.historySearch}>
              <input style={s.historyInput} type="number" placeholder="Enter user ID..." value={userIdInput}
                onChange={e => setUserIdInput(e.target.value)} onKeyDown={e => e.key==='Enter' && handleViewUserHistory()} />
              <button style={s.historyBtn} onClick={handleViewUserHistory} disabled={userHistoryLoading}>
                {userHistoryLoading ? 'Loading...' : '🔍 Look Up'}
              </button>
            </div>
            {userHistory && (
              <div>
                <div style={s.userInfoCard}>
                  <div style={s.userAvatar}>{userHistory.user?.name?.charAt(0)||'?'}</div>
                  <div style={{ flex:1 }}>
                    <div style={s.userName}>{userHistory.user?.name}</div>
                    <div style={s.userEmail}>{userHistory.user?.email}</div>
                    <div style={s.userPhone}>{userHistory.user?.phone}</div>
                  </div>
                  <div style={s.userStats}>
                    {[
                      [userHistory.loans?.length||0, 'Total Loans'],
                      [toMoney(userHistory.total_borrowed), 'Total Borrowed'],
                      [toMoney(userHistory.total_repaid), 'Total Repaid'],
                    ].map(([val,label]) => (
                      <div key={label} style={s.userStat}>
                        <div style={s.userStatVal}>{val}</div>
                        <div style={s.userStatLabel}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {(userHistory.loans||[]).map(loan => (
                  <div key={loan.id} style={s.historyLoanCard}>
                    <div style={s.historyLoanHeader}>
                      <div><div style={s.historyLoanAmount}>{toMoney(loan.amount)}</div><div style={s.historyLoanMeta}>{loan.purpose} · {loan.duration_months} months</div></div>
                      <div style={{ ...s.statusBadge, ...getStatusStyle(loan.status) }}>{loan.status}</div>
                    </div>
                    <div style={s.historyLoanDetails}>
                      <span>Interest: {loan.interest_rate}%</span><span>Total: {toMoney(loan.total_repayable)}</span>
                      <span>Paid: {toMoney(loan.amount_paid)}</span><span>Balance: {toMoney(loan.balance)}</span>
                      <span>Applied: {fmtDate(loan.created_at)}</span>
                      {loan.disbursed_at && <span>Disbursed: {fmtDate(loan.disbursed_at)}</span>}
                    </div>
                    {loan.repayments?.filter(r=>r.status==='successful').length>0 && (
                      <div style={s.historyRepayments}>
                        <div style={s.historyRepaymentsTitle}>✅ {loan.repayments.filter(r=>r.status==='successful').length} confirmed payment(s)</div>
                        {loan.repayments.filter(r=>r.status==='successful').map((r,i) => (
                          <div key={i} style={s.historyRepayRow}>
                            <span>{fmtDate(r.paid_at)}</span>
                            <span style={{ fontWeight:600, color:'#1f4d1f' }}>{toMoney(r.amount)}</span>
                            <span style={{ color:'#888', fontSize:11 }}>{r.payment_reference?.slice(-12)}</span>
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
  );
}

const s = {
  page: { display:'flex', minHeight:'100vh', backgroundColor:'#f0f2f5', fontFamily:'Arial, sans-serif' },
  toast: { position:'fixed', top:20, right:20, background:'#1f4d1f', color:'#fff', padding:'12px 24px', borderRadius:8, fontSize:14, zIndex:9999, boxShadow:'0 4px 12px rgba(0,0,0,0.15)' },
  sidebar: { width:240, background:'#1f4d1f', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, height:'100vh' },
  sidebarLogo: { display:'flex', alignItems:'center', gap:10, padding:20, borderBottom:'1px solid rgba(255,255,255,0.1)' },
  logoImg: { width:40, height:40, objectFit:'contain' },
  sidebarLogoName: { fontSize:14, fontWeight:700, color:'#fff' },
  sidebarLogoSub: { fontSize:10, color:'#a8d5a8' },
  sidebarNav: { flex:1, padding:'16px 0' },
  sidebarItem: { display:'flex', alignItems:'center', gap:10, padding:'12px 20px', color:'#a8d5a8', fontSize:14, cursor:'pointer' },
  sidebarItemActive: { background:'rgba(255,255,255,0.15)', color:'#fff', borderLeft:'3px solid #f0c050' },
  sidebarFooter: { padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.1)' },
  staffName: { fontSize:13, fontWeight:600, color:'#fff', marginBottom:2 },
  staffRole: { fontSize:11, color:'#a8d5a8', marginBottom:10 },
  logoutBtn: { width:'100%', padding:8, background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, fontSize:13, cursor:'pointer', fontFamily:'inherit' },
  main: { flex:1, marginLeft:240, padding:32 },
  pageTitle: { fontSize:24, fontWeight:700, color:'#111', marginBottom:6 },
  pageSub: { fontSize:14, color:'#888', marginBottom:24 },
  loading: { textAlign:'center', color:'#888', padding:40 },
  sectionLabel: { fontSize:12, fontWeight:700, color:'#1f4d1f', textTransform:'uppercase', letterSpacing:1, marginBottom:12, paddingBottom:8, borderBottom:'2px solid #e8e4dc', marginTop:8 },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 },
  myStatsGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 },
  statCard: { background:'#fff', borderRadius:10, border:'1px solid #e8e4dc', padding:18 },
  myStatCard: { background:'#fff', borderRadius:10, border:'2px solid #e8e4dc', padding:16 },
  statTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  statLabel: { fontSize:12, color:'#888' },
  statIcon: { fontSize:20 },
  statValue: { fontSize:22, fontWeight:700 },
  quickActions: { background:'#fff', borderRadius:10, border:'1px solid #e8e4dc', padding:20, marginBottom:24 },
  quickActionsTitle: { fontSize:12, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:0.5, marginBottom:14 },
  quickActionsRow: { display:'flex', gap:12, flexWrap:'wrap' },
  quickBtn: { padding:'10px 20px', background:'#f0f7ec', color:'#1f4d1f', border:'1px solid #a8d5a8', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  reportsCard: { background:'#fff', borderRadius:10, border:'1px solid #e8e4dc', padding:20, marginBottom:24 },
  reportsCardTitle: { fontSize:16, fontWeight:700, color:'#111', marginBottom:4 },
  reportsCardSub: { fontSize:13, color:'#888', marginBottom:16 },
  downloadBtns: { display:'flex', gap:12, flexWrap:'wrap' },
  downloadBtn: { padding:'10px 22px', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  downloadBtnDisabled: { padding:'10px 22px', background:'#ccc', color:'#fff', border:'none', borderRadius:8, fontSize:13, cursor:'not-allowed', fontFamily:'inherit' },
  applyCard: { background:'#fff', borderRadius:12, border:'1px solid #e8e4dc', padding:28, marginBottom:24 },
  applyHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 },
  applyTitle: { fontSize:18, fontWeight:700, color:'#1f4d1f', margin:0 },
  closeBtn: { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#888' },
  formSection: { marginBottom:24 },
  formSectionTitle: { fontSize:12, fontWeight:700, color:'#1f4d1f', textTransform:'uppercase', letterSpacing:1, marginBottom:12, paddingBottom:8, borderBottom:'1px solid #f0f0f0' },
  interestNote: { background:'#f0f7ec', border:'1px solid #a8d5a8', borderRadius:7, padding:'10px 14px', fontSize:13, color:'#1f4d1f', marginBottom:14 },
  sellerSearchBox: { position:'relative', marginBottom:12 },
  sellerSearchInput: { width:'100%', padding:'12px 16px', border:'2px solid #ddd', borderRadius:8, fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' },
  sellerSearching: { padding:'10px 16px', fontSize:13, color:'#888' },
  sellerDropdown: { position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1px solid #ddd', borderTop:'none', borderRadius:'0 0 8px 8px', zIndex:100, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', maxHeight:280, overflowY:'auto' },
  sellerDropdownItem: { padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #f5f5f5' },
  sellerDropdownName: { fontSize:14, fontWeight:700, color:'#111', marginBottom:3 },
  sellerDropdownMeta: { fontSize:12, color:'#555', marginBottom:2 },
  sellerDropdownState: { fontSize:11, color:'#888' },
  sellerNoResults: { padding:'12px 16px', fontSize:13, color:'#888', background:'#f7f5f0', borderRadius:6 },
  selectedSellerCard: { display:'flex', alignItems:'center', gap:12, background:'#f0f7ec', border:'2px solid #1f4d1f', borderRadius:10, padding:'14px 16px' },
  selectedSellerName: { fontSize:15, fontWeight:700, color:'#1f4d1f', marginBottom:3 },
  selectedSellerMeta: { fontSize:12, color:'#555', marginBottom:2 },
  clearSellerBtn: { padding:'7px 16px', background:'#fff', color:'#555', border:'1px solid #ddd', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'inherit' },
  applyGrid: { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 },
  field: { display:'flex', flexDirection:'column', gap:5 },
  label: { fontSize:12, fontWeight:600, color:'#444' },
  input: { padding:'11px 12px', border:'1px solid #ddd', borderRadius:7, fontSize:13, fontFamily:'inherit', outline:'none' },
  required: { color:'#cc0000' },
  loanPreview: { background:'#f7f5f0', borderRadius:8, padding:16, marginTop:16, border:'1px solid #e8e4dc' },
  previewTitle: { fontSize:12, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:0.5, marginBottom:12 },
  previewGrid: { display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 },
  previewItem: {},
  previewLabel: { fontSize:11, color:'#888', marginBottom:2 },
  previewVal: { fontSize:14, fontWeight:600, color:'#111' },
  docNote: { fontSize:12, color:'#888', marginBottom:14, fontStyle:'italic' },
  docDesc: { fontSize:11, color:'#aaa', fontWeight:400 },
  docsGrid2: { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 },
  docUploadField: { display:'flex', flexDirection:'column', gap:6 },
  fileInput: { padding:8, border:'1px dashed #ccc', borderRadius:7, fontSize:13, background:'#f7f5f0', cursor:'pointer' },
  fileSelected: { fontSize:12, color:'#1a7a3a', fontWeight:600, padding:'4px 8px', background:'#eafaf0', borderRadius:5 },
  submitBtn: { width:'100%', padding:14, background:'#1f4d1f', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit' },
  submitBtnDisabled: { width:'100%', padding:14, background:'#ccc', color:'#fff', border:'none', borderRadius:8, fontSize:15, cursor:'not-allowed', fontFamily:'inherit' },
  filterRow: { display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, marginBottom:20, flexWrap:'wrap' },
  filterTabs: { display:'flex', gap:8, flexWrap:'wrap' },
  filterTab: { padding:'8px 14px', border:'1px solid #ddd', borderRadius:6, fontSize:13, color:'#555', cursor:'pointer', background:'#fff', fontFamily:'inherit' },
  filterTabActive: { padding:'8px 14px', border:'1px solid #1f4d1f', borderRadius:6, fontSize:13, color:'#fff', cursor:'pointer', background:'#1f4d1f', fontFamily:'inherit' },
  tabCount: { marginLeft:5, background:'rgba(255,255,255,0.3)', fontSize:11, fontWeight:700, padding:'1px 5px', borderRadius:99 },
  searchInput: { padding:'10px 16px', border:'1px solid #ddd', borderRadius:8, fontSize:14, outline:'none', minWidth:240, fontFamily:'inherit' },
  appCard: { background:'#fff', borderRadius:10, border:'1px solid #e8e4dc', padding:22, marginBottom:16 },
  appHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 },
  appAmount: { fontSize:26, fontWeight:700, color:'#1f4d1f', marginBottom:4 },
  appMeta: { fontSize:13, color:'#888', marginBottom:3 },
  appPurpose: { fontSize:13, color:'#555', fontStyle:'italic', textTransform:'capitalize' },
  appHeaderRight: { textAlign:'right' },
  appDate: { fontSize:12, color:'#aaa', marginTop:6 },
  appDetails: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, padding:'14px 0', borderTop:'1px solid #eee', borderBottom:'1px solid #eee', marginBottom:14 },
  appDetail: {},
  appDetailLabel: { fontSize:11, color:'#888', marginBottom:3 },
  appDetailVal: { fontSize:13, fontWeight:600, color:'#111' },
  statusBadge: { fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:99, textTransform:'capitalize' },
  lifecycleRow: { marginBottom:14 },
  actionGroup: { background:'#f0f7ec', borderRadius:8, padding:16, border:'1px solid #c5ddb8' },
  actionGroupLabel: { fontSize:12, color:'#888', fontStyle:'italic', marginBottom:10 },
  actionBtns: { display:'flex', gap:10 },
  approveBtn: { padding:'9px 22px', background:'#1f4d1f', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  approveBtnDisabled: { padding:'9px 22px', background:'#ccc', color:'#fff', border:'none', borderRadius:6, fontSize:13, cursor:'not-allowed', fontFamily:'inherit' },
  rejectBtn: { padding:'9px 22px', background:'#fff', color:'#cc0000', border:'1px solid #cc0000', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  rejectBtnDisabled: { padding:'9px 22px', background:'#fff', color:'#ccc', border:'1px solid #ccc', borderRadius:6, fontSize:13, cursor:'not-allowed', fontFamily:'inherit' },
  borrowerInfo: { background:'#fff', borderRadius:6, padding:'8px 12px', marginBottom:12, fontSize:13, color:'#333', border:'1px solid #e8e4dc' },
  disburseBtn: { padding:'11px 24px', background:'#1f4d1f', color:'#fff', border:'none', borderRadius:7, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  disburseBtnDisabled: { padding:'11px 24px', background:'#ccc', color:'#fff', border:'none', borderRadius:7, fontSize:14, cursor:'not-allowed', fontFamily:'inherit' },
  activeNote: { background:'#eafaf0', color:'#1a7a3a', padding:'12px 16px', borderRadius:6, fontSize:13 },
  rejectedNote: { background:'#fff0f0', color:'#cc0000', padding:'12px 16px', borderRadius:6, fontSize:13 },
  completedNote: { background:'#f0f0f0', color:'#555', padding:'12px 16px', borderRadius:6, fontSize:13 },
  docsSection: { borderTop:'1px solid #f0f0f0', paddingTop:14 },
  docsToggleBtn: { display:'flex', alignItems:'center', gap:8, padding:'8px 16px', background:'#f7f5f0', color:'#555', border:'1px solid #e8e4dc', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  docsBadge: { background:'#1f4d1f', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:99 },
  docsPanel: { marginTop:14, background:'#f7f5f0', borderRadius:8, padding:16 },
  docsPanelTitle: { fontSize:13, fontWeight:700, color:'#333', marginBottom:14 },
  noDocsBox: { textAlign:'center', padding:'24px 0' },
  noDocsText: { fontSize:13, color:'#888' },
  docsCardGrid: { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:16 },
  docCard: { background:'#fff', borderRadius:8, border:'1px solid #e8e4dc', padding:14, display:'flex', gap:10, alignItems:'flex-start' },
  docCardIcon: { fontSize:28, flexShrink:0 },
  docCardBody: { flex:1 },
  docCardType: { fontSize:11, fontWeight:700, color:'#1f4d1f', textTransform:'uppercase', marginBottom:3 },
  docCardName: { fontSize:13, color:'#333', marginBottom:3, wordBreak:'break-all' },
  docCardDate: { fontSize:11, color:'#aaa' },
  docCardActions: { display:'flex', flexDirection:'column', gap:6 },
  viewDocBtn: { padding:'5px 10px', background:'#e7f0ff', color:'#1a4fa0', borderRadius:5, fontSize:11, fontWeight:600, textDecoration:'none', textAlign:'center' },
  downloadDocBtn: { padding:'5px 10px', background:'#eafaf0', color:'#1a7a3a', borderRadius:5, fontSize:11, fontWeight:600, textDecoration:'none', textAlign:'center' },
  deleteDocBtn: { padding:'5px 10px', background:'#fff0f0', color:'#cc0000', border:'1px solid #ffa39e', borderRadius:5, fontSize:11, cursor:'pointer', fontFamily:'inherit' },
  uploadSection: { borderTop:'1px solid #e8e4dc', paddingTop:14, marginTop:4 },
  uploadSectionTitle: { fontSize:12, fontWeight:700, color:'#555', marginBottom:10 },
  uploadRow: { display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' },
  uploadSelect: { padding:'9px 12px', border:'1px solid #ddd', borderRadius:6, fontSize:13, fontFamily:'inherit', outline:'none' },
  uploadInput: { flex:1, minWidth:180, padding:6, border:'1px solid #ddd', borderRadius:6, fontSize:13 },
  uploadBtn: { padding:'9px 18px', background:'#1f4d1f', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  uploadBtnDisabled: { padding:'9px 18px', background:'#ccc', color:'#fff', border:'none', borderRadius:6, fontSize:13, cursor:'not-allowed', fontFamily:'inherit' },
  tableCard: { background:'#fff', borderRadius:12, overflow:'hidden', border:'1px solid #e8e4dc' },
  table: { width:'100%', borderCollapse:'collapse' },
  tableHead: { background:'#f7f5f0', borderBottom:'2px solid #eee' },
  th: { padding:'12px 16px', textAlign:'left', fontSize:11, color:'#666', textTransform:'uppercase', letterSpacing:0.5 },
  tableRow: { borderTop:'1px solid #f5f5f5' },
  td: { padding:'14px 16px', verticalAlign:'middle', fontSize:13 },
  repayName: { fontWeight:600, color:'#111', marginBottom:2 },
  repayEmail: { fontSize:11, color:'#888' },
  historySearch: { display:'flex', gap:12, marginBottom:24 },
  historyInput: { flex:1, maxWidth:300, padding:'11px 16px', border:'1px solid #ddd', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit' },
  historyBtn: { padding:'11px 24px', background:'#1f4d1f', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  userInfoCard: { background:'#fff', borderRadius:12, border:'1px solid #e8e4dc', padding:20, marginBottom:16, display:'flex', alignItems:'center', gap:16 },
  userAvatar: { width:52, height:52, background:'#1f4d1f', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#f0c050', fontWeight:700, fontSize:22, flexShrink:0 },
  userName: { fontSize:16, fontWeight:700, color:'#111', marginBottom:3 },
  userEmail: { fontSize:13, color:'#888', marginBottom:2 },
  userPhone: { fontSize:13, color:'#888' },
  userStats: { marginLeft:'auto', display:'flex', gap:24 },
  userStat: { textAlign:'center' },
  userStatVal: { fontSize:18, fontWeight:700, color:'#1f4d1f' },
  userStatLabel: { fontSize:11, color:'#888', marginTop:2 },
  historyLoanCard: { background:'#fff', borderRadius:10, border:'1px solid #e8e4dc', padding:18, marginBottom:14 },
  historyLoanHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 },
  historyLoanAmount: { fontSize:20, fontWeight:700, color:'#1f4d1f', marginBottom:4 },
  historyLoanMeta: { fontSize:12, color:'#888', textTransform:'capitalize' },
  historyLoanDetails: { display:'flex', gap:16, flexWrap:'wrap', fontSize:12, color:'#555', padding:'10px 0', borderTop:'1px solid #eee', marginBottom:10 },
  historyRepayments: { background:'#f7f5f0', borderRadius:8, padding:14 },
  historyRepaymentsTitle: { fontSize:12, fontWeight:700, color:'#333', marginBottom:10 },
  historyRepayRow: { display:'flex', gap:20, alignItems:'center', padding:'6px 0', borderBottom:'1px solid #eee', fontSize:12 },
  emptyBox: { textAlign:'center', padding:'40px 0', background:'#fff', borderRadius:10, border:'1px solid #e8e4dc' },
  emptyIcon: { fontSize:40, marginBottom:10 },
  emptyText: { fontSize:14, color:'#888' },
  backAdminBtn: { width: '100%', padding: 8, background: '#f0c050', color: '#1a3d1a', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 },
};