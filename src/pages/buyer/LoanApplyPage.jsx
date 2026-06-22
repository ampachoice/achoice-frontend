import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import BuyerDropdown from '../../components/buyer/BuyerDropdown';

const LOGO_PATH = '/achoice logo.png';

export default function LoanApplyPage() {
  const navigate = useNavigate();
  const [loanConfig, setLoanConfig]       = useState(null);
  const [loading, setLoading]             = useState(true);
  const [step, setStep]                   = useState(1);
  const [submitting, setSubmitting]       = useState(false);
  const [success, setSuccess]             = useState(false);
  const [error, setError]                 = useState(null);
  const [cartCount, setCartCount]         = useState(0);
  const [loanForm, setLoanForm]           = useState({ amount:'', purpose:'', duration_months:'', repayment_preference:'monthly' });
  const [identityForm, setIdentityForm]   = useState({ nin_number:'', bvn_number:'' });
  const [documents, setDocuments]         = useState({ nin_document:null, bvn_document:null, bank_statement:null, collateral_document:null, other:null });
  const [uploadProgress, setUploadProgress] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms]         = useState(false);

  useEffect(() => {
    if (document.getElementById('lap-style')) return;
    const el = document.createElement('style');
    el.id = 'lap-style';
    el.textContent = `
      * { box-sizing:border-box; }
      body { margin:0; }
      .lap-wrap { min-height:100vh; background:#f7f5f0; font-family:Arial,sans-serif; }

      /* ── NAV ── */
      .lap-nav { background:#fff; border-bottom:1px solid #e8e4dc; padding:12px 48px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; gap:12px; }
      .lap-nav-brand { display:flex; align-items:center; gap:10px; cursor:pointer; flex-shrink:0; }
      .lap-nav-logo  { width:42px; height:42px; object-fit:contain; }
      .lap-nav-name  { font-size:14px; font-weight:700; color:#1f4d1f; line-height:1.2; }
      .lap-nav-tag   { font-size:10px; color:#888; }
      .lap-nav-links { display:flex; gap:24px; align-items:center; }
      .lap-nav-link  { color:#555; font-size:14px; cursor:pointer; }
      .lap-cart-icon { font-size:22px; cursor:pointer; position:relative; }
      .lap-cart-badge { position:absolute; top:-6px; right:-8px; background:#f0c050; color:#1f4d1f; font-size:10px; font-weight:700; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; }

      /* ── HERO ── */
      .lap-hero { background:#1a3d1a; padding:40px 48px; }
      .lap-hero-inner { max-width:900px; margin:0 auto; }
      .lap-hero-badge { display:inline-block; background:#f0c050; color:#1a3d1a; font-size:11px; font-weight:700; padding:4px 14px; border-radius:99px; margin-bottom:14px; }
      .lap-hero-title { font-size:30px; font-weight:700; color:#fff; margin:0 0 10px; }
      .lap-hero-sub   { font-size:14px; color:#a8d5a8; margin:0 0 24px; }
      .lap-hero-stats { display:flex; gap:28px; align-items:center; flex-wrap:wrap; }
      .lap-hero-stat  { }
      .lap-hero-stat-val   { font-size:20px; font-weight:700; color:#f0c050; }
      .lap-hero-stat-label { font-size:10px; color:#a8d5a8; margin-top:2px; }

      /* ── STEP BAR ── */
      .lap-step-bar { display:flex; align-items:center; justify-content:center; padding:22px 16px; gap:0; overflow-x:auto; }
      .lap-step-item { display:flex; align-items:center; gap:6px; flex-shrink:0; }
      .lap-step-circle { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0; transition:all .3s; }
      .lap-step-label  { font-size:12px; white-space:nowrap; }
      .lap-step-line   { width:36px; height:2px; margin:0 6px; flex-shrink:0; }

      /* ── LAYOUT ── */
      .lap-container { max-width:1040px; margin:0 auto; padding:0 48px 60px; }
      .lap-layout { display:grid; grid-template-columns:1fr 260px; gap:22px; align-items:start; }
      .lap-form-col { }

      /* ── CARD ── */
      .lap-card { background:#fff; border-radius:14px; border:1px solid #e8e4dc; padding:28px 30px; margin-bottom:16px; }
      .lap-card-step  { font-size:11px; font-weight:700; color:#1f4d1f; text-transform:uppercase; letter-spacing:1px; margin-bottom:5px; }
      .lap-card-title { font-size:20px; font-weight:700; color:#111; margin:0 0 5px; }
      .lap-card-sub   { font-size:13px; color:#888; margin:0 0 22px; }

      /* ── FIELDS ── */
      .lap-field  { margin-bottom:20px; }
      .lap-label  { display:block; font-size:13px; font-weight:600; color:#333; margin-bottom:7px; }
      .lap-req    { color:#cc0000; }
      .lap-opt    { font-size:11px; color:#aaa; font-weight:400; }
      .lap-input  { width:100%; padding:12px 14px; border:1.5px solid #ddd; border-radius:9px; font-size:14px; font-family:inherit; outline:none; transition:border .2s; }
      .lap-input:focus { border-color:#1f4d1f; }
      .lap-hint   { font-size:12px; color:#888; margin-top:5px; }

      /* Duration buttons */
      .lap-dur-grid { display:flex; flex-wrap:wrap; gap:10px; }
      .lap-dur-btn  { padding:10px 16px; border:1.5px solid #ddd; border-radius:8px; background:#fff; color:#333; cursor:pointer; font-size:13px; font-family:inherit; transition:all .2s; }
      .lap-dur-btn-active { border:2px solid #1f4d1f; background:#f0f7ec; color:#1f4d1f; font-weight:700; }

      /* Radio cards */
      .lap-radio-group { display:flex; gap:12px; }
      .lap-radio-card  { flex:1; padding:14px; border:1.5px solid #ddd; border-radius:9px; cursor:pointer; text-align:center; transition:all .2s; }
      .lap-radio-active { border:2px solid #1f4d1f; background:#f0f7ec; }
      .lap-radio-label  { font-size:14px; font-weight:600; color:#1f4d1f; }
      .lap-radio-sub    { font-size:12px; color:#888; margin-top:4px; }

      /* Summary box */
      .lap-summary { background:#f0f7ec; border:1px solid #c5ddb8; border-radius:10px; padding:16px 18px; margin-bottom:18px; }
      .lap-summary-title { font-size:12px; font-weight:700; color:#1f4d1f; margin-bottom:10px; text-transform:uppercase; letter-spacing:.5px; }
      .lap-summary-row   { display:flex; justify-content:space-between; margin-bottom:7px; font-size:13px; }
      .lap-summary-label { color:#555; }
      .lap-summary-val   { font-weight:600; color:#111; }

      /* Info notice */
      .lap-notice { background:#fff8e7; border:1px solid #f0c050; border-radius:8px; padding:12px 14px; font-size:13px; color:#7a5c00; margin-bottom:18px; }

      /* Document fields */
      .lap-doc-field { background:#f7f5f0; border-radius:10px; padding:16px; margin-bottom:12px; }
      .lap-doc-head  { display:flex; align-items:flex-start; gap:12px; margin-bottom:10px; }
      .lap-doc-icon  { font-size:22px; flex-shrink:0; }
      .lap-doc-label { font-size:14px; font-weight:600; color:#111; margin-bottom:3px; }
      .lap-doc-desc  { font-size:12px; color:#888; line-height:1.5; }
      .lap-file-input { width:100%; padding:8px; border:1px dashed #ccc; border-radius:7px; font-size:13px; background:#fff; cursor:pointer; }
      .lap-file-selected { display:flex; align-items:center; gap:8px; margin-top:8px; font-size:12px; color:#1a7a3a; background:#eafaf0; padding:7px 10px; border-radius:6px; }
      .lap-file-size   { color:#888; }
      .lap-file-remove { background:none; border:none; cursor:pointer; color:#cc0000; font-size:14px; margin-left:auto; }

      /* Review sections */
      .lap-review-section { background:#f7f5f0; border-radius:10px; padding:16px; margin-bottom:14px; }
      .lap-review-title   { font-size:12px; font-weight:700; color:#1f4d1f; margin-bottom:10px; text-transform:uppercase; letter-spacing:.5px; }
      .lap-review-grid    { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:8px; }
      .lap-review-label   { font-size:11px; color:#888; margin-bottom:2px; }
      .lap-review-val     { font-size:13px; font-weight:600; color:#111; text-transform:capitalize; }
      .lap-edit-btn       { background:none; border:1px solid #ddd; border-radius:5px; padding:4px 12px; font-size:11px; color:#555; cursor:pointer; font-family:inherit; }
      .lap-doc-review-row { display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px solid #eee; font-size:13px; }
      .lap-doc-ok   { color:#1a7a3a; font-size:12px; }
      .lap-doc-none { color:#aaa; font-size:12px; }

      /* Terms */
      .lap-terms-box   { background:#f0f7ec; border:1px solid #c5ddb8; border-radius:10px; padding:16px; margin-bottom:18px; }
      .lap-terms-label { display:flex; align-items:flex-start; gap:12px; cursor:pointer; }
      .lap-terms-cb    { margin-top:2px; width:18px; height:18px; flex-shrink:0; cursor:pointer; }
      .lap-terms-text  { font-size:13px; color:#333; line-height:1.6; }
      .lap-terms-link  { background:none; border:none; color:#1f4d1f; font-weight:700; font-size:13px; cursor:pointer; text-decoration:underline; padding:0; font-family:inherit; }

      /* Error */
      .lap-error { background:#fff0f0; border:1px solid #ffb3b3; border-radius:8px; padding:12px 14px; font-size:13px; color:#cc0000; margin-bottom:14px; }

      /* Buttons */
      .lap-btn-row { display:flex; gap:12px; }
      .lap-next-btn { flex:1; padding:14px; background:#1f4d1f; color:#fff; border:none; border-radius:9px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; }
      .lap-back-btn { padding:14px 20px; background:#fff; color:#555; border:1.5px solid #ddd; border-radius:9px; font-size:14px; cursor:pointer; font-family:inherit; }
      .lap-submit-btn     { flex:1; padding:14px; background:#1f4d1f; color:#fff; border:none; border-radius:9px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; }
      .lap-submit-btn-dis { flex:1; padding:14px; background:#ccc; color:#fff; border:none; border-radius:9px; font-size:15px; cursor:not-allowed; font-family:inherit; }

      /* RIGHT PANEL */
      .lap-info-col { display:flex; flex-direction:column; gap:14px; position:sticky; top:80px; }
      .lap-info-card { background:#1f4d1f; border-radius:12px; padding:20px; }
      .lap-info-title { font-size:13px; font-weight:700; color:#fff; margin-bottom:14px; }
      .lap-info-item  { display:flex; align-items:flex-start; gap:9px; margin-bottom:10px; }
      .lap-info-icon  { color:#f0c050; font-weight:700; font-size:13px; flex-shrink:0; }
      .lap-info-text  { color:#a8d5a8; font-size:13px; line-height:1.5; }
      .lap-terms-card { background:#fff; border-radius:12px; border:1px solid #e8e4dc; padding:16px; }
      .lap-terms-card-title { font-size:13px; font-weight:700; color:#111; margin-bottom:12px; }
      .lap-terms-row        { display:flex; justify-content:space-between; margin-bottom:9px; }
      .lap-terms-row-label  { font-size:12px; color:#888; }
      .lap-terms-row-val    { font-size:12px; font-weight:600; color:#1f4d1f; }
      .lap-step-guide       { background:#fff; border-radius:12px; border:1px solid #e8e4dc; padding:16px; }
      .lap-step-guide-title { font-size:13px; font-weight:700; color:#111; margin-bottom:14px; }
      .lap-step-guide-item  { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
      .lap-step-guide-num   { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }
      .lap-step-guide-label { font-size:13px; }

      /* SUCCESS */
      .lap-success-wrap { display:flex; align-items:center; justify-content:center; min-height:70vh; padding:16px; }
      .lap-success-card { background:#fff; border-radius:14px; border:1px solid #e8e4dc; padding:40px 32px; max-width:480px; width:100%; text-align:center; }
      .lap-success-circle { width:72px; height:72px; background:#1f4d1f; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:32px; color:#fff; margin:0 auto 20px; }
      .lap-success-title { font-size:22px; font-weight:700; color:#111; margin-bottom:10px; }
      .lap-success-text  { font-size:14px; color:#666; line-height:1.7; margin-bottom:22px; }
      .lap-upload-status-box   { background:#f7f5f0; border-radius:8px; padding:14px; margin-bottom:22px; text-align:left; }
      .lap-upload-status-title { font-size:11px; font-weight:700; color:#555; text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px; }
      .lap-upload-status-row   { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:13px; }
      .lap-upload-badge { font-size:11px; font-weight:600; padding:3px 10px; border-radius:99px; }
      .lap-success-btn { width:100%; padding:13px; background:#1f4d1f; color:#fff; border:none; border-radius:9px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; margin-bottom:10px; }
      .lap-outline-btn { width:100%; padding:13px; background:#fff; color:#1f4d1f; border:2px solid #1f4d1f; border-radius:9px; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; }

      /* TERMS MODAL */
      .lap-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:1000; display:flex; align-items:center; justify-content:center; padding:16px; }
      .lap-modal-box     { background:#fff; border-radius:14px; width:100%; max-width:580px; max-height:88vh; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,0.3); }
      .lap-modal-header  { display:flex; justify-content:space-between; align-items:center; padding:18px 22px; background:#1f4d1f; border-radius:14px 14px 0 0; flex-shrink:0; }
      .lap-modal-title   { font-size:16px; font-weight:700; color:#fff; margin:0; }
      .lap-modal-close   { background:rgba(255,255,255,0.2); border:none; color:#fff; width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:14px; }
      .lap-modal-body    { flex:1; overflow-y:auto; padding:20px 22px; }
      .lap-term-item     { margin-bottom:18px; }
      .lap-term-title    { font-size:14px; font-weight:700; color:#1f4d1f; margin-bottom:5px; }
      .lap-term-text     { font-size:13px; color:#555; line-height:1.7; }
      .lap-modal-footer  { display:flex; gap:10px; padding:14px 22px; border-top:1px solid #eee; flex-shrink:0; }
      .lap-modal-agree   { flex:1; padding:11px; background:#1f4d1f; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
      .lap-modal-dismiss { padding:11px 18px; background:#f5f5f5; color:#555; border:1px solid #ddd; border-radius:8px; font-size:14px; cursor:pointer; font-family:inherit; }

      /* ════════════ TABLET ════════════ */
      @media (max-width:860px) {
        .lap-nav { padding:10px 20px; }
        .lap-nav-links { display:none; }
        .lap-hero { padding:28px 20px; }
        .lap-hero-title { font-size:24px; }
        .lap-container { padding:0 20px 48px; }
        .lap-layout { grid-template-columns:1fr; }
        .lap-info-col { display:grid; grid-template-columns:1fr 1fr; gap:12px; position:static; }
        .lap-step-guide { display:none; }
      }

      /* ════════════ MOBILE ════════════ */
      @media (max-width:580px) {
        .lap-nav { padding:8px 12px; }
        .lap-nav-logo { width:36px; height:36px; }
        .lap-nav-name { font-size:13px; }
        .lap-hero { padding:22px 14px; }
        .lap-hero-title { font-size:20px; }
        .lap-hero-stats { gap:16px; }
        .lap-hero-stat-val { font-size:17px; }
        .lap-container { padding:0 12px 56px; }

        /* Step bar — compact */
        .lap-step-bar { padding:14px 8px; gap:0; justify-content:flex-start; }
        .lap-step-circle { width:28px; height:28px; font-size:12px; }
        .lap-step-label  { font-size:10px; }
        .lap-step-line   { width:20px; margin:0 3px; }

        /* Card */
        .lap-card { padding:18px 14px; border-radius:12px; }
        .lap-card-title { font-size:18px; }

        /* Duration grid — wrap freely */
        .lap-dur-btn { padding:9px 12px; font-size:12px; }

        /* Radio group — stack on mobile */
        .lap-radio-group { flex-direction:column; gap:10px; }
        .lap-radio-card { padding:12px; }

        /* Inputs */
        .lap-input { font-size:16px; padding:13px 12px; }

        /* Review grid — 1 col */
        .lap-review-grid { grid-template-columns:1fr; gap:8px; }

        /* Button row — stack */
        .lap-btn-row { flex-direction:column; gap:10px; }
        .lap-back-btn { order:2; }
        .lap-next-btn, .lap-submit-btn, .lap-submit-btn-dis { order:1; font-size:16px; padding:15px; }
        .lap-back-btn { text-align:center; }

        /* Info col — 1 col on small mobile */
        .lap-info-col { grid-template-columns:1fr; }

        /* Success card */
        .lap-success-card { padding:28px 16px; }
        .lap-modal-box { max-height:92vh; }
        .lap-modal-body { padding:16px; }
      }
    `;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((acc, item) => acc + (item.quantity || 1), 0));
    api.get('/settings/loan')
      .then(res => setLoanConfig(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const interestRate = parseFloat(loanConfig?.default_interest || 10);
  const minAmount    = parseInt(loanConfig?.min_amount || 50000);
  const maxAmount    = parseInt(loanConfig?.max_amount || 5000000);
  const purposes     = loanConfig?.purposes || [];
  const durations    = loanConfig?.durations || [];
  const calcInterest = Number(loanForm.amount) * interestRate / 100;
  const calcTotal    = Number(loanForm.amount) + calcInterest;
  const calcMonthly  = loanForm.duration_months ? Math.ceil(calcTotal / Number(loanForm.duration_months)) : 0;
  const calcWeekly   = loanForm.duration_months ? Math.ceil(calcTotal / (Number(loanForm.duration_months) * 4)) : 0;

  const validateStep1 = () => {
    const amt = Number(loanForm.amount);
    if (!amt || amt < minAmount || amt > maxAmount) { setError(`Amount must be between ₦${minAmount.toLocaleString()} and ₦${maxAmount.toLocaleString()}`); return false; }
    if (!loanForm.purpose) { setError('Please select a loan purpose.'); return false; }
    if (!loanForm.duration_months) { setError('Please select a loan duration.'); return false; }
    setError(null); return true;
  };
  const validateStep2 = () => {
    if (!identityForm.nin_number || identityForm.nin_number.length !== 11) { setError('Please enter a valid 11-digit NIN number.'); return false; }
    if (!identityForm.bvn_number || identityForm.bvn_number.length !== 11) { setError('Please enter a valid 11-digit BVN number.'); return false; }
    setError(null); return true;
  };
  const validateStep3 = () => {
    if (!documents.nin_document) { setError('Please upload your NIN document.'); return false; }
    if (!documents.bvn_document) { setError('Please upload your BVN document.'); return false; }
    if (!documents.bank_statement) { setError('Please upload your bank statement.'); return false; }
    setError(null); return true;
  };
  const nextStep = () => {
    if (step===1 && !validateStep1()) return;
    if (step===2 && !validateStep2()) return;
    if (step===3 && !validateStep3()) return;
    setStep(s => s+1); window.scrollTo(0,0);
  };
  const prevStep = () => { setStep(s => s-1); setError(null); window.scrollTo(0,0); };

  const handleSubmit = async () => {
    if (!agreedToTerms) { setError('Please agree to the Terms and Conditions before submitting.'); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await api.post('/loans/apply', {
        amount: Number(loanForm.amount), purpose: loanForm.purpose,
        duration_months: Number(loanForm.duration_months),
        repayment_preference: loanForm.repayment_preference,
        nin_number: identityForm.nin_number, bvn_number: identityForm.bvn_number,
      });
      const loanId = res.data?.loan?.id || res.data?.data?.id || res.data?.id;
      if (loanId) {
        const docDefs = [
          { key:'nin_document',        type:'nin_document',         label:'NIN Document' },
          { key:'bvn_document',        type:'bvn_document',         label:'BVN Document' },
          { key:'bank_statement',      type:'statement_of_account', label:'Bank Statement' },
          { key:'collateral_document', type:'collateral_document',  label:'Collateral' },
          { key:'other',              type:'other',                label:'Other' },
        ];
        for (const def of docDefs) {
          if (!documents[def.key]) continue;
          setUploadProgress(p => ({ ...p, [def.key]:'uploading' }));
          const form = new FormData();
          form.append('document', documents[def.key]);
          form.append('type', def.type);
          form.append('description', def.label);
          try {
            await api.post(`/loans/${loanId}/documents`, form, { headers:{ 'Content-Type':'multipart/form-data' } });
            setUploadProgress(p => ({ ...p, [def.key]:'done' }));
          } catch { setUploadProgress(p => ({ ...p, [def.key]:'failed' })); }
        }
      }
      setSuccess(true);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) setError(Object.values(errors)[0][0]);
      else setError(err.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontSize:16, color:'#666' }}>Loading loan settings...</div>;

  const STEP_LABELS = ['Loan Details','Identity','Documents','Review'];

  if (success) return (
    <div className="lap-wrap">
      <nav className="lap-nav">
        <div className="lap-nav-brand" onClick={() => navigate('/')}>
          <img src={LOGO_PATH} alt="ACHOICE" className="lap-nav-logo" />
          <div><div className="lap-nav-name">ACHOICE LIMITED</div><div className="lap-nav-tag">Your needs our solutions</div></div>
        </div>
      </nav>
      <div className="lap-success-wrap">
        <div className="lap-success-card">
          <div className="lap-success-circle">✓</div>
          <h2 className="lap-success-title">Application Submitted!</h2>
          <p className="lap-success-text">
            Your loan application has been submitted successfully along with your documents.
            Our loan team will review everything and get back to you within 24 hours via SMS and email.
          </p>
          <div className="lap-upload-status-box">
            <div className="lap-upload-status-title">Document Upload Status</div>
            {Object.entries(uploadProgress).map(([key, status]) => (
              <div key={key} className="lap-upload-status-row">
                <span>{key.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                <span className="lap-upload-badge" style={{
                  background: status==='done' ? '#eafaf0' : status==='failed' ? '#fff0f0' : '#fff8e7',
                  color: status==='done' ? '#1a7a3a' : status==='failed' ? '#cc0000' : '#b36b00',
                }}>
                  {status==='done' ? '✓ Uploaded' : status==='failed' ? '✕ Failed' : '⏳ Uploading'}
                </span>
              </div>
            ))}
          </div>
          <button className="lap-success-btn" onClick={() => navigate('/loans/repay')}>View My Loan Status</button>
          <button className="lap-outline-btn" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    </div>
  );

  const TermsModal = () => (
    <div className="lap-modal-overlay" onClick={() => setShowTerms(false)}>
      <div className="lap-modal-box" onClick={e => e.stopPropagation()}>
        <div className="lap-modal-header">
          <h3 className="lap-modal-title">Terms and Conditions</h3>
          <button className="lap-modal-close" onClick={() => setShowTerms(false)}>✕</button>
        </div>
        <div className="lap-modal-body">
          {[
            { title:'1. Loan Agreement', text:'By submitting this application, you agree to repay the full loan amount plus interest within the agreed duration. ACHOICE LIMITED reserves the right to approve or reject any application.' },
            { title:'2. Interest Rate', text:`The current interest rate is ${interestRate}% flat on the principal amount. This rate is set by ACHOICE LIMITED and may be subject to change for future applications.` },
            { title:'3. Repayment Obligation', text:'You are legally obligated to make repayments as scheduled. Late or missed payments may attract penalties and affect your eligibility for future loans.' },
            { title:'4. Document Authenticity', text:'All documents submitted must be authentic and belong to you. Submission of false documents is a criminal offence and will result in immediate cancellation of the loan and potential legal action.' },
            { title:'5. NIN & BVN Verification', text:'Your NIN and BVN will be verified with the relevant government agencies. By applying, you consent to this verification.' },
            { title:'6. Collateral', text:'Where collateral is provided, ACHOICE LIMITED reserves the right to claim the collateral in the event of loan default after due notice has been given.' },
            { title:'7. Privacy', text:'Your personal information and documents will be stored securely and used only for loan processing. We will not share your data with third parties without your consent, except where required by law.' },
            { title:'8. Communication', text:'By applying, you agree to receive SMS, email and phone call communications from ACHOICE LIMITED regarding your loan application and repayment schedule.' },
            { title:'9. Governing Law', text:'This agreement is governed by the laws of the Federal Republic of Nigeria. Any disputes will be resolved in accordance with Nigerian law.' },
          ].map(item => (
            <div key={item.title} className="lap-term-item">
              <div className="lap-term-title">{item.title}</div>
              <div className="lap-term-text">{item.text}</div>
            </div>
          ))}
        </div>
        <div className="lap-modal-footer">
          <button className="lap-modal-agree" onClick={() => { setAgreedToTerms(true); setShowTerms(false); }}>✓ I Agree to These Terms</button>
          <button className="lap-modal-dismiss" onClick={() => setShowTerms(false)}>Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="lap-wrap">
      {showTerms && <TermsModal />}

      {/* Nav */}
      <nav className="lap-nav">
        <div className="lap-nav-brand" onClick={() => navigate('/')}>
          <img src={LOGO_PATH} alt="ACHOICE" className="lap-nav-logo" />
          <div><div className="lap-nav-name">ACHOICE LIMITED</div><div className="lap-nav-tag">Your needs our solutions</div></div>
        </div>
        <div className="lap-nav-links">
          <span className="lap-nav-link" onClick={() => navigate('/')}>Home</span>
          <span className="lap-nav-link" onClick={() => navigate('/products')}>Shop</span>
          <span className="lap-nav-link" onClick={() => navigate('/loans/repay')}>My Loans</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div className="lap-cart-icon" onClick={() => navigate('/cart')}>
            🛒 {cartCount > 0 && <span className="lap-cart-badge">{cartCount}</span>}
          </div>
          <BuyerDropdown cartCount={cartCount} />
        </div>
      </nav>

      {/* Hero */}
      <div className="lap-hero">
        <div className="lap-hero-inner">
          <div className="lap-hero-badge">ACHOICE Farm Finance</div>
          <h1 className="lap-hero-title">Apply for an Agricultural Loan</h1>
          <p className="lap-hero-sub">Quick, affordable loans for farmers and agro-businesses. Apply in minutes.</p>
          <div className="lap-hero-stats">
            {[
              { val:`₦${Number(maxAmount).toLocaleString()}`, label:'Max Loan' },
              { val:'24hrs',           label:'Decision Time' },
              { val:`${interestRate}%`,label:'Flat Rate' },
              { val:'Paystack',        label:'Repay Via' },
            ].map((stat, i, arr) => (
              <div key={stat.label} style={{ display:'flex', alignItems:'center', gap:i>0?14:0 }}>
                {i>0 && <div style={{ width:1, height:28, background:'rgba(255,255,255,0.2)', marginRight:14 }} />}
                <div className="lap-hero-stat">
                  <div className="lap-hero-stat-val">{stat.val}</div>
                  <div className="lap-hero-stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Bar */}
      <div className="lap-step-bar">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="lap-step-item">
            <div className="lap-step-circle" style={{ background: step>i+1?'#1f4d1f':step===i+1?'#1f4d1f':'#e8e4dc', color: step>=i+1?'#fff':'#999' }}>
              {step>i+1 ? '✓' : i+1}
            </div>
            <div className="lap-step-label" style={{ color: step>=i+1?'#1f4d1f':'#aaa', fontWeight: step===i+1?700:400 }}>{label}</div>
            {i < STEP_LABELS.length-1 && <div className="lap-step-line" style={{ background: step>i+1?'#1f4d1f':'#e8e4dc' }} />}
          </div>
        ))}
      </div>

      <div className="lap-container">
        <div className="lap-layout">
          <div className="lap-form-col">

            {error && <div className="lap-error">⚠️ {error}</div>}

            {/* STEP 1 */}
            {step===1 && (
              <div className="lap-card">
                <div className="lap-card-step">Step 1 of 4</div>
                <h2 className="lap-card-title">Loan Details</h2>
                <p className="lap-card-sub">Tell us how much you need and what for.</p>

                <div className="lap-field">
                  <label className="lap-label">Loan Amount (₦) <span className="lap-req">*</span></label>
                  <input className="lap-input" type="number" value={loanForm.amount}
                    onChange={e => setLoanForm(p => ({ ...p, amount:e.target.value }))}
                    placeholder={`₦${minAmount.toLocaleString()} — ₦${maxAmount.toLocaleString()}`}
                    min={minAmount} max={maxAmount} />
                  <div className="lap-hint">Min: ₦{minAmount.toLocaleString()} · Max: ₦{maxAmount.toLocaleString()}</div>
                </div>

                <div className="lap-field">
                  <label className="lap-label">Purpose of Loan <span className="lap-req">*</span></label>
                  <select className="lap-input" value={loanForm.purpose}
                    onChange={e => setLoanForm(p => ({ ...p, purpose:e.target.value }))}>
                    <option value="">Select purpose</option>
                    {purposes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>

                <div className="lap-field">
                  <label className="lap-label">Loan Duration <span className="lap-req">*</span></label>
                  <div className="lap-dur-grid">
                    {durations.map(d => (
                      <button key={d.id} type="button"
                        className={`lap-dur-btn ${String(loanForm.duration_months)===String(d.months) ? 'lap-dur-btn-active' : ''}`}
                        onClick={() => setLoanForm(p => ({ ...p, duration_months:String(d.months) }))}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lap-field">
                  <label className="lap-label">Repayment Preference <span className="lap-req">*</span></label>
                  <div className="lap-radio-group">
                    {[
                      { val:'monthly', label:'📅 Monthly', sub:`₦${calcMonthly.toLocaleString()}/month` },
                      { val:'weekly',  label:'📆 Weekly',  sub:`₦${calcWeekly.toLocaleString()}/week` },
                    ].map(opt => (
                      <label key={opt.val} className={`lap-radio-card ${loanForm.repayment_preference===opt.val ? 'lap-radio-active' : ''}`}>
                        <input type="radio" name="repayment_preference" value={opt.val}
                          checked={loanForm.repayment_preference===opt.val}
                          onChange={e => setLoanForm(p => ({ ...p, repayment_preference:e.target.value }))}
                          style={{ display:'none' }} />
                        <div className="lap-radio-label">{opt.label}</div>
                        {loanForm.amount>0 && loanForm.duration_months && <div className="lap-radio-sub">{opt.sub}</div>}
                      </label>
                    ))}
                  </div>
                </div>

                {loanForm.amount > 0 && (
                  <div className="lap-summary">
                    <div className="lap-summary-title">📊 Loan Summary Preview</div>
                    {[
                      ['Principal',`₦${Number(loanForm.amount).toLocaleString()}`],
                      [`Interest (${interestRate}%)`,`₦${calcInterest.toLocaleString()}`],
                      ['Total Repayable',`₦${calcTotal.toLocaleString()}`],
                      ...(loanForm.duration_months ? [['Monthly',`₦${calcMonthly.toLocaleString()}`],['Weekly',`₦${calcWeekly.toLocaleString()}`]] : []),
                    ].map(([l,v]) => (
                      <div key={l} className="lap-summary-row">
                        <span className="lap-summary-label">{l}</span>
                        <span className="lap-summary-val">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button className="lap-next-btn" onClick={nextStep}>Continue → Identity Verification</button>
              </div>
            )}

            {/* STEP 2 */}
            {step===2 && (
              <div className="lap-card">
                <div className="lap-card-step">Step 2 of 4</div>
                <h2 className="lap-card-title">Identity Verification</h2>
                <p className="lap-card-sub">Your NIN and BVN are required to verify your identity.</p>
                <div className="lap-notice">🔒 Your NIN and BVN will be verified with government databases. This information is kept strictly confidential.</div>
                {[
                  { label:'National Identification Number (NIN)', key:'nin_number', ph:'Enter your 11-digit NIN', hint:'Dial *346# on any MTN line to get your NIN' },
                  { label:'Bank Verification Number (BVN)',        key:'bvn_number', ph:'Enter your 11-digit BVN', hint:'Dial *565*0# on any bank line to get your BVN' },
                ].map(f => (
                  <div key={f.key} className="lap-field">
                    <label className="lap-label">{f.label} <span className="lap-req">*</span></label>
                    <input className="lap-input" type="text" value={identityForm[f.key]}
                      onChange={e => setIdentityForm(p => ({ ...p, [f.key]:e.target.value.replace(/\D/g,'') }))}
                      placeholder={f.ph} maxLength={11} />
                    <div className="lap-hint">
                      {identityForm[f.key].length}/11 digits
                      {identityForm[f.key].length===11 && <span style={{ color:'#1a7a3a', marginLeft:8 }}>✓ Valid length</span>}
                    </div>
                    <div className="lap-hint">{f.hint}</div>
                  </div>
                ))}
                <div className="lap-btn-row">
                  <button className="lap-back-btn" onClick={prevStep}>← Back</button>
                  <button className="lap-next-btn" onClick={nextStep}>Continue → Documents</button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step===3 && (
              <div className="lap-card">
                <div className="lap-card-step">Step 3 of 4</div>
                <h2 className="lap-card-title">Supporting Documents</h2>
                <p className="lap-card-sub">Upload clear scans or photos. Accepted: JPG, PNG, PDF. Max 5MB each.</p>
                <div className="lap-notice">📎 NIN document, BVN document and bank statement are required. Collateral is optional but increases approval chances.</div>
                {[
                  { key:'nin_document',        label:'NIN Document',            req:true,  desc:'Clear photo or scan of your National ID card, NIMC slip or NIN slip', icon:'🪪' },
                  { key:'bvn_document',        label:'BVN Document',            req:true,  desc:'Bank verification letter or statement header showing your BVN', icon:'🏦' },
                  { key:'bank_statement',      label:'Bank Statement',          req:true,  desc:'3-6 months bank statement from your primary bank account', icon:'📊' },
                  { key:'collateral_document', label:'Collateral Document',     req:false, desc:'Property deed, vehicle papers, or any asset document (optional)', icon:'🏠' },
                  { key:'other',              label:'Other Supporting Document',req:false, desc:'Any other document that supports your application (optional)', icon:'📄' },
                ].map(doc => (
                  <div key={doc.key} className="lap-doc-field">
                    <div className="lap-doc-head">
                      <div className="lap-doc-icon">{doc.icon}</div>
                      <div>
                        <div className="lap-doc-label">
                          {doc.label} {doc.req ? <span className="lap-req">*</span> : <span className="lap-opt">(optional)</span>}
                        </div>
                        <div className="lap-doc-desc">{doc.desc}</div>
                      </div>
                    </div>
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" className="lap-file-input"
                      onChange={e => setDocuments(p => ({ ...p, [doc.key]:e.target.files[0] }))} />
                    {documents[doc.key] && (
                      <div className="lap-file-selected">
                        ✅ {documents[doc.key].name}
                        <span className="lap-file-size">({(documents[doc.key].size/1024).toFixed(1)} KB)</span>
                        <button className="lap-file-remove" onClick={() => setDocuments(p => ({ ...p, [doc.key]:null }))}>✕</button>
                      </div>
                    )}
                  </div>
                ))}
                <div className="lap-btn-row">
                  <button className="lap-back-btn" onClick={prevStep}>← Back</button>
                  <button className="lap-next-btn" onClick={nextStep}>Continue → Review</button>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step===4 && (
              <div className="lap-card">
                <div className="lap-card-step">Step 4 of 4</div>
                <h2 className="lap-card-title">Review & Submit</h2>
                <p className="lap-card-sub">Review your application before submitting.</p>

                <div className="lap-review-section">
                  <div className="lap-review-title">💰 Loan Details</div>
                  <div className="lap-review-grid">
                    {[
                      ['Amount',`₦${Number(loanForm.amount).toLocaleString()}`],
                      ['Purpose',loanForm.purpose],
                      ['Duration',`${loanForm.duration_months} months`],
                      ['Interest',`${interestRate}% flat`],
                      ['Total',`₦${calcTotal.toLocaleString()}`],
                      ['Monthly',`₦${calcMonthly.toLocaleString()}`],
                      ['Repayment',loanForm.repayment_preference],
                    ].map(([l,v]) => (
                      <div key={l}><div className="lap-review-label">{l}</div><div className="lap-review-val">{v}</div></div>
                    ))}
                  </div>
                  <button className="lap-edit-btn" onClick={() => setStep(1)}>✏ Edit</button>
                </div>

                <div className="lap-review-section">
                  <div className="lap-review-title">🪪 Identity</div>
                  <div className="lap-review-grid">
                    <div><div className="lap-review-label">NIN</div><div className="lap-review-val">{'•'.repeat(7)+identityForm.nin_number.slice(-4)}</div></div>
                    <div><div className="lap-review-label">BVN</div><div className="lap-review-val">{'•'.repeat(7)+identityForm.bvn_number.slice(-4)}</div></div>
                  </div>
                  <button className="lap-edit-btn" onClick={() => setStep(2)}>✏ Edit</button>
                </div>

                <div className="lap-review-section">
                  <div className="lap-review-title">📎 Documents</div>
                  {[
                    { key:'nin_document',        label:'NIN Document' },
                    { key:'bvn_document',        label:'BVN Document' },
                    { key:'bank_statement',      label:'Bank Statement' },
                    { key:'collateral_document', label:'Collateral' },
                    { key:'other',              label:'Other' },
                  ].map(doc => (
                    <div key={doc.key} className="lap-doc-review-row">
                      <span>{doc.label}</span>
                      {documents[doc.key]
                        ? <span className="lap-doc-ok">✅ {documents[doc.key].name}</span>
                        : <span className="lap-doc-none">Not uploaded</span>}
                    </div>
                  ))}
                  <button className="lap-edit-btn" style={{ marginTop:8 }} onClick={() => setStep(3)}>✏ Edit</button>
                </div>

                <div className="lap-terms-box">
                  <label className="lap-terms-label">
                    <input type="checkbox" className="lap-terms-cb" checked={agreedToTerms}
                      onChange={e => setAgreedToTerms(e.target.checked)} />
                    <div className="lap-terms-text">
                      I have read and agree to the{' '}
                      <button className="lap-terms-link" type="button" onClick={() => setShowTerms(true)}>
                        Terms and Conditions
                      </button>
                      {' '}of ACHOICE LIMITED loan services. I confirm that all information provided is accurate and the documents submitted are genuine.
                    </div>
                  </label>
                </div>

                {error && <div className="lap-error">⚠️ {error}</div>}

                <div className="lap-btn-row">
                  <button className="lap-back-btn" onClick={prevStep}>← Back</button>
                  <button
                    className={submitting || !agreedToTerms ? 'lap-submit-btn-dis' : 'lap-submit-btn'}
                    onClick={handleSubmit} disabled={submitting || !agreedToTerms}>
                    {submitting ? '⏳ Submitting...' : '📋 Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Info Panel */}
          <div className="lap-info-col">
            <div className="lap-info-card">
              <div className="lap-info-title">Why ACHOICE Loans?</div>
              {[
                `Loans up to ₦${Number(maxAmount).toLocaleString()}`,
                'Decision within 24 hours',
                'Flexible weekly or monthly repayment',
                `${interestRate}% flat rate — no hidden charges`,
                'Repay securely via Paystack',
                'Dedicated loan officer support',
              ].map(item => (
                <div key={item} className="lap-info-item">
                  <span className="lap-info-icon">✓</span>
                  <span className="lap-info-text">{item}</span>
                </div>
              ))}
            </div>

            <div className="lap-terms-card">
              <div className="lap-terms-card-title">Current Loan Terms</div>
              {[
                ['Interest Rate', `${interestRate}% flat`],
                ['Min Amount', `₦${minAmount.toLocaleString()}`],
                ['Max Amount', `₦${maxAmount.toLocaleString()}`],
                ['Durations', durations.map(d => d.label).join(', ')],
              ].map(([l,v]) => (
                <div key={l} className="lap-terms-row">
                  <span className="lap-terms-row-label">{l}</span>
                  <span className="lap-terms-row-val">{v}</span>
                </div>
              ))}
            </div>

            <div className="lap-step-guide">
              <div className="lap-step-guide-title">Application Steps</div>
              {STEP_LABELS.map((label, i) => (
                <div key={label} className="lap-step-guide-item">
                  <div className="lap-step-guide-num"
                    style={{ background: step>i+1?'#1f4d1f':step===i+1?'#1f4d1f':'#e8e4dc', color: step>=i+1?'#fff':'#aaa' }}>
                    {step>i+1 ? '✓' : i+1}
                  </div>
                  <div className="lap-step-guide-label"
                    style={{ color: step>=i+1?'#111':'#aaa', fontWeight: step===i+1?700:400 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
