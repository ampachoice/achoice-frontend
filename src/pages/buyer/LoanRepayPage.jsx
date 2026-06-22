import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMyActiveLoan, getMyLoanHistory, repayLoan } from '../../services/loanService';
import api from '../../services/api';
import BuyerDropdown from '../../components/buyer/BuyerDropdown';

export default function LoanRepayPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [activeLoan, setActiveLoan]     = useState(null);
  const [loanHistory, setLoanHistory]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [repaying, setRepaying]         = useState(false);
  const [error, setError]               = useState(null);
  const [toast, setToast]               = useState('');
  const [repayAmount, setRepayAmount]   = useState('');
  const [selectedQuick, setSelectedQuick] = useState(null);
  const [cartCount, setCartCount]       = useState(0);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleView, setScheduleView] = useState('monthly');
  const [verifying, setVerifying]       = useState(false);
  const [lastReference, setLastReference] = useState(null);
  const [autoVerified, setAutoVerified] = useState(false);

  useEffect(() => {
    if (document.getElementById('lrp-style')) return;
    const el = document.createElement('style');
    el.id = 'lrp-style';
    el.textContent = `
      * { box-sizing:border-box; }
      body { margin:0; }
      .lrp-wrap { min-height:100vh; background:#f7f5f0; font-family:Arial,sans-serif; }

      /* ── TOAST ── */
      .lrp-toast { position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#1f4d1f; color:#fff; padding:13px 28px; border-radius:10px; font-size:14px; font-weight:600; z-index:9999; box-shadow:0 4px 20px rgba(0,0,0,0.15); white-space:nowrap; max-width:90vw; text-align:center; border:1px solid #f0c050; }

      /* ── VERIFY OVERLAY ── */
      .lrp-verify-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:2000; display:flex; align-items:center; justify-content:center; padding:16px; }
      .lrp-verify-box { background:#fff; border-radius:14px; padding:40px 32px; text-align:center; max-width:320px; width:100%; }
      .lrp-verify-icon { font-size:52px; margin-bottom:16px; }
      .lrp-verify-text { font-size:18px; font-weight:700; color:#1f4d1f; margin-bottom:8px; }
      .lrp-verify-sub  { font-size:13px; color:#888; }

      /* ── NAV ── */
      .lrp-nav { background:#1f4d1f; padding:10px 48px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; gap:12px; }
      .lrp-nav-left { display:flex; align-items:center; gap:10px; cursor:pointer; flex-shrink:0; }
      .lrp-nav-logo { width:36px; height:36px; border-radius:6px; }
      .lrp-nav-name { font-weight:700; font-size:16px; color:#fff; line-height:1.2; }
      .lrp-nav-name span { color:#f0c050; }
      .lrp-nav-motto { font-size:9px; color:#a8d5a8; }
      .lrp-nav-links { display:flex; gap:22px; align-items:center; }
      .lrp-nav-link  { color:#f0c050; font-size:14px; cursor:pointer; font-weight:500; }
      .lrp-nav-right { display:flex; align-items:center; gap:14px; }
      .lrp-cart-icon { font-size:22px; cursor:pointer; position:relative; color:#fff; }
      .lrp-cart-badge { position:absolute; top:-8px; right:-10px; background:#f0c050; color:#1f4d1f; font-size:10px; font-weight:700; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #1f4d1f; }

      /* ── CONTAINER ── */
      .lrp-container { max-width:880px; margin:0 auto; padding:32px 48px; }
      .lrp-title-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:22px; flex-wrap:wrap; gap:12px; }
      .lrp-page-title { font-size:26px; font-weight:700; color:#111; margin:0; }
      .lrp-refresh-btn { padding:9px 18px; background:#fff; color:#1f4d1f; border:1.5px solid #1f4d1f; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }

      /* ── BANNERS ── */
      .lrp-success-banner { background:#eafaf0; border:2px solid #1a7a3a; border-radius:10px; padding:14px 20px; margin-bottom:20px; font-size:14px; font-weight:600; color:#1a7a3a; text-align:center; }
      .lrp-verify-banner { background:#f0fff4; border:2px solid #1f4d1f; border-radius:10px; padding:16px 20px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; }
      .lrp-verify-banner-title { font-size:15px; font-weight:700; color:#1f4d1f; margin-bottom:4px; }
      .lrp-verify-banner-sub   { font-size:13px; color:#555; }
      .lrp-verify-btn     { padding:11px 22px; background:#1f4d1f; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap; }
      .lrp-verify-btn-dis { padding:11px 22px; background:#ccc; color:#fff; border:none; border-radius:8px; font-size:14px; cursor:not-allowed; font-family:inherit; }
      .lrp-error { background:#fff0f0; color:#cc0000; padding:12px 16px; border-radius:8px; margin-bottom:20px; font-size:14px; border:1px solid #ffb3b3; }

      /* ── HERO CARD ── */
      .lrp-hero { background:#1a3d1a; border-radius:14px; padding:26px 28px; margin-bottom:18px; display:grid; grid-template-columns:1fr 1fr; gap:28px; }
      .lrp-hero-badge { display:inline-block; font-size:10px; font-weight:700; padding:3px 10px; border-radius:99px; margin-bottom:10px; letter-spacing:1px; }
      .lrp-hero-amount { font-size:38px; font-weight:900; color:#fff; margin-bottom:4px; }
      .lrp-hero-sub    { font-size:12px; color:#a8d5a8; margin-bottom:14px; text-transform:capitalize; }
      .lrp-hero-stats  { display:flex; align-items:center; gap:14px; margin-bottom:12px; flex-wrap:wrap; }
      .lrp-hero-stat-val   { font-size:14px; font-weight:700; color:#f0c050; }
      .lrp-hero-stat-label { font-size:10px; color:#a8d5a8; margin-top:2px; }
      .lrp-hero-stat-div   { width:1px; height:26px; background:rgba(255,255,255,0.2); }
      .lrp-disbursed-info  { background:rgba(255,255,255,0.07); border-radius:7px; padding:8px 12px; font-size:12px; color:#a8d5a8; display:flex; flex-direction:column; gap:3px; }
      .lrp-pending-note    { background:rgba(240,192,80,0.15); border:1px solid rgba(240,192,80,0.3); border-radius:6px; padding:10px 14px; font-size:12px; color:#f0c050; margin-top:10px; }

      /* Progress side */
      .lrp-hero-right { display:flex; flex-direction:column; justify-content:center; }
      .lrp-progress-title { font-size:10px; color:#a8d5a8; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px; }
      .lrp-progress-pct   { font-size:26px; font-weight:700; color:#f0c050; margin-bottom:7px; }
      .lrp-progress-bg    { background:rgba(255,255,255,0.15); border-radius:99px; height:10px; margin-bottom:6px; overflow:hidden; }
      .lrp-progress-fill  { background:#f0c050; height:10px; border-radius:99px; transition:width .5s; }
      .lrp-progress-note  { font-size:11px; color:#a8d5a8; margin-bottom:14px; }
      .lrp-instalment-cards { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      .lrp-instalment-card  { background:rgba(255,255,255,0.08); border-radius:8px; padding:11px; text-align:center; }
      .lrp-instalment-icon  { font-size:17px; margin-bottom:3px; }
      .lrp-instalment-val   { font-size:13px; font-weight:700; color:#f0c050; }
      .lrp-instalment-label { font-size:9px; color:#a8d5a8; margin-top:2px; }

      /* ── STATS GRID ── */
      .lrp-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:16px; }
      .lrp-stat-card  { background:#fff; border-radius:10px; border:1px solid #e8e4dc; padding:15px; text-align:center; }
      .lrp-stat-icon  { font-size:22px; margin-bottom:6px; }
      .lrp-stat-val   { font-size:15px; font-weight:700; color:#111; margin-bottom:2px; }
      .lrp-stat-label { font-size:11px; color:#888; }

      /* ── FULL BALANCE BTN ── */
      .lrp-full-btn     { width:100%; padding:16px; background:#f0c050; color:#1a3d1a; border:none; border-radius:10px; font-size:16px; font-weight:900; cursor:pointer; margin-bottom:14px; font-family:inherit; letter-spacing:.3px; }
      .lrp-full-btn-dis { width:100%; padding:16px; background:#ccc; color:#fff; border:none; border-radius:10px; font-size:16px; cursor:not-allowed; margin-bottom:14px; font-family:inherit; }

      /* ── REPAY SECTION ── */
      .lrp-repay-section { background:#fff; border-radius:12px; border:1px solid #e8e4dc; padding:26px 28px; margin-bottom:16px; }
      .lrp-repay-title { font-size:17px; font-weight:700; color:#111; margin:0 0 5px; }
      .lrp-repay-sub   { font-size:13px; color:#888; margin:0 0 18px; }
      .lrp-quick-amts  { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:18px; }
      .lrp-quick-amt   { padding:10px 16px; border:1.5px solid #ddd; border-radius:7px; cursor:pointer; background:#fff; font-size:13px; font-family:inherit; font-weight:600; }
      .lrp-quick-amt-sel { padding:10px 16px; border:1.5px solid #1f4d1f; border-radius:7px; background:#1f4d1f; color:#fff; cursor:pointer; font-size:13px; font-family:inherit; font-weight:600; }
      .lrp-repay-form  { display:flex; gap:12px; flex-wrap:wrap; }
      .lrp-repay-input { flex:1; min-width:180px; padding:13px 16px; border:2px solid #1f4d1f; border-radius:9px; font-size:15px; outline:none; font-family:inherit; }
      .lrp-repay-btn     { padding:13px 22px; background:#f0c050; color:#1a3d1a; border:none; border-radius:9px; font-weight:700; cursor:pointer; font-size:14px; font-family:inherit; white-space:nowrap; }
      .lrp-repay-btn-dis { padding:13px 22px; background:#ccc; color:#fff; border:none; border-radius:9px; cursor:not-allowed; font-size:14px; font-family:inherit; }
      .lrp-repay-note  { font-size:12px; color:#888; margin-top:12px; text-align:center; }

      /* ── SCHEDULE BTN ── */
      .lrp-schedule-btn { display:block; margin:4px auto 0; padding:11px 24px; background:#fff; color:#1f4d1f; border:2px solid #1f4d1f; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }

      /* ── MANUAL VERIFY ── */
      .lrp-manual-verify { display:flex; align-items:center; justify-content:center; gap:12px; margin-top:14px; padding:12px; background:#f7f5f0; border-radius:8px; flex-wrap:wrap; }
      .lrp-manual-text { font-size:13px; color:#888; }
      .lrp-manual-btn  { padding:7px 16px; background:none; color:#1f4d1f; border:1.5px solid #1f4d1f; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }

      /* ── NO LOAN ── */
      .lrp-no-loan { background:#fff; border-radius:12px; border:2px dashed #c5ddb8; padding:60px 16px; text-align:center; }
      .lrp-no-loan-icon  { font-size:60px; margin-bottom:14px; }
      .lrp-no-loan-title { font-size:22px; font-weight:700; color:#111; margin-bottom:8px; }
      .lrp-no-loan-text  { color:#666; margin-bottom:22px; font-size:14px; }
      .lrp-apply-btn     { background:#1f4d1f; color:#fff; border:none; padding:14px 32px; border-radius:9px; cursor:pointer; font-size:15px; font-family:inherit; font-weight:700; }

      /* ── HISTORY ── */
      .lrp-history { background:#fff; border-radius:12px; border:1px solid #e8e4dc; padding:22px 28px; margin-top:22px; }
      .lrp-history-title { font-size:17px; font-weight:700; color:#111; margin:0 0 14px; }
      .lrp-history-item  { display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #f0f0f0; flex-wrap:wrap; gap:8px; }
      .lrp-history-left  { display:flex; align-items:center; gap:12px; }
      .lrp-history-dot   { width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0; }
      .lrp-history-amount { font-size:15px; font-weight:700; color:#111; }
      .lrp-history-meta   { font-size:12px; color:#888; margin-top:2px; }
      .lrp-history-badge  { font-size:11px; font-weight:600; padding:5px 14px; border-radius:99px; text-transform:capitalize; }

      /* ── SCHEDULE MODAL ── */
      .lrp-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:1000; padding:16px; }
      .lrp-modal-box     { background:#fff; border-radius:14px; width:100%; max-width:660px; max-height:90vh; overflow:hidden; display:flex; flex-direction:column; }
      .lrp-modal-header  { padding:18px 22px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; flex-shrink:0; }
      .lrp-modal-title   { font-size:17px; font-weight:700; color:#111; margin:0; }
      .lrp-modal-close   { background:none; border:none; font-size:20px; cursor:pointer; color:#888; }
      .lrp-modal-tabs    { display:flex; align-items:center; gap:8px; padding:12px 22px; border-bottom:1px solid #eee; flex-shrink:0; flex-wrap:wrap; }
      .lrp-modal-tab     { padding:7px 18px; border:1px solid #ddd; border-radius:6px; font-size:13px; color:#555; cursor:pointer; background:#fff; font-family:inherit; }
      .lrp-modal-tab-active { padding:7px 18px; border:1px solid #1f4d1f; border-radius:6px; font-size:13px; color:#fff; cursor:pointer; background:#1f4d1f; font-family:inherit; }
      .lrp-modal-tab-info { margin-left:auto; font-size:13px; color:#1f4d1f; font-weight:700; }
      .lrp-schedule-head { display:grid; grid-template-columns:40px 1fr 110px 100px; padding:9px 22px; background:#f7f5f0; font-size:11px; font-weight:700; color:#666; text-transform:uppercase; flex-shrink:0; }
      .lrp-schedule-body { overflow-y:auto; flex:1; }
      .lrp-schedule-row  { display:grid; grid-template-columns:40px 1fr 110px 100px; padding:11px 22px; border-bottom:1px solid #f5f5f5; align-items:center; font-size:13px; }
      .lrp-sched-num   { color:#888; }
      .lrp-sched-date  { color:#333; }
      .lrp-sched-amt   { font-weight:600; color:#111; }
      .lrp-paid-badge     { background:#eafaf0; color:#1a7a3a; font-size:11px; font-weight:600; padding:3px 8px; border-radius:99px; }
      .lrp-overdue-badge  { background:#fff0f0; color:#cc0000; font-size:11px; font-weight:600; padding:3px 8px; border-radius:99px; }
      .lrp-upcoming-badge { background:#f0f0f0; color:#888; font-size:11px; font-weight:600; padding:3px 8px; border-radius:99px; }
      .lrp-modal-summary { display:flex; justify-content:space-around; padding:12px 22px; border-top:1px solid #eee; font-size:13px; font-weight:600; flex-shrink:0; flex-wrap:wrap; gap:8px; }
      .lrp-modal-footer  { padding:12px 22px; border-top:1px solid #eee; text-align:right; flex-shrink:0; }
      .lrp-close-modal-btn { padding:10px 24px; background:#1f4d1f; color:#fff; border:none; border-radius:7px; cursor:pointer; font-family:inherit; font-weight:600; }

      /* ════════════ TABLET ════════════ */
      @media (max-width:768px) {
        .lrp-nav { padding:10px 16px; }
        .lrp-nav-links { display:none; }
        .lrp-container { padding:22px 20px; }
        .lrp-hero { grid-template-columns:1fr; gap:20px; padding:20px; }
        .lrp-stats-grid { grid-template-columns:repeat(2,1fr); }
        .lrp-repay-section { padding:20px; }
        .lrp-history { padding:18px 20px; }
      }

      /* ════════════ MOBILE ════════════ */
      @media (max-width:540px) {
        .lrp-nav { padding:8px 12px; }
        .lrp-nav-name { font-size:14px; }
        .lrp-container { padding:14px 12px; }
        .lrp-page-title { font-size:22px; }

        /* Hero */
        .lrp-hero { padding:16px 14px; gap:16px; border-radius:12px; }
        .lrp-hero-amount { font-size:30px; }
        .lrp-hero-stats { gap:10px; }
        .lrp-hero-stat-val { font-size:13px; }
        .lrp-instalment-cards { gap:8px; }
        .lrp-instalment-card { padding:9px; }
        .lrp-instalment-val { font-size:12px; }

        /* Stats */
        .lrp-stats-grid { grid-template-columns:1fr 1fr; gap:10px; }
        .lrp-stat-val { font-size:14px; }
        .lrp-stat-icon { font-size:20px; }

        /* Full balance btn */
        .lrp-full-btn, .lrp-full-btn-dis { font-size:15px; padding:15px; }

        /* Repay section */
        .lrp-repay-section { padding:16px 14px; border-radius:12px; }
        .lrp-repay-title { font-size:16px; }
        .lrp-quick-amts { gap:8px; }
        .lrp-quick-amt, .lrp-quick-amt-sel { padding:9px 12px; font-size:13px; }
        .lrp-repay-form { flex-direction:column; }
        .lrp-repay-input { min-width:100%; font-size:16px; }
        .lrp-repay-btn, .lrp-repay-btn-dis { width:100%; text-align:center; font-size:15px; padding:14px; }

        /* Verify banner */
        .lrp-verify-banner { flex-direction:column; gap:12px; }
        .lrp-verify-btn, .lrp-verify-btn-dis { width:100%; text-align:center; }

        /* History */
        .lrp-history { padding:14px 12px; border-radius:12px; }
        .lrp-history-item { flex-direction:column; align-items:flex-start; gap:10px; }
        .lrp-history-badge { align-self:flex-start; }

        /* Schedule modal */
        .lrp-modal-box { border-radius:12px 12px 0 0; margin-top:auto; max-height:85vh; }
        .lrp-schedule-head, .lrp-schedule-row { grid-template-columns:30px 1fr 90px 80px; padding:8px 14px; }
        .lrp-modal-header { padding:14px 16px; }
        .lrp-modal-tabs   { padding:10px 14px; }
        .lrp-modal-summary { padding:10px 14px; font-size:12px; }
        .lrp-modal-footer  { padding:10px 14px; }
      }
    `;
    document.head.appendChild(el);
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const fetchLoanData = () => {
    setLoading(true);
    Promise.all([getMyActiveLoan(), getMyLoanHistory()])
      .then(([activeRes, historyRes]) => {
        setActiveLoan(activeRes.data?.data || activeRes.data);
        setLoanHistory(historyRes.data?.data || historyRes.data || []);
      })
      .catch(() => setError('Failed to load loan information.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((acc, item) => acc + (item.quantity || 1), 0));

    const params   = new URLSearchParams(location.search);
    const urlRef   = params.get('reference') || params.get('trxref');
    const savedRef = localStorage.getItem('last_loan_reference');
    const reference = urlRef || savedRef;

    if (reference) {
      setLastReference(reference);
      localStorage.removeItem('last_loan_reference');
      window.history.replaceState({}, '', '/loans/repay');
      setVerifying(true);
      api.post('/loans/verify-payment', { reference })
        .then(res => {
          setAutoVerified(true);
          setLastReference(null);
          showToast(res.data?.message || '✅ Payment verified! Your loan balance has been updated.');
          fetchLoanData();
        })
        .catch(() => showToast('Payment received. Click "Verify Payment" to update your balance.'))
        .finally(() => setVerifying(false));
    }
    fetchLoanData();
  }, []);

  const handleVerifyPayment = async (customRef) => {
    const reference = customRef || lastReference;
    if (!reference) {
      const manualRef = window.prompt('Enter your Paystack payment reference:');
      if (!manualRef) return;
      return handleVerifyPayment(manualRef);
    }
    setVerifying(true);
    try {
      const result = await api.post('/loans/verify-payment', { reference });
      showToast(result.data?.message || '✅ Payment verified! Balance updated.');
      setLastReference(null);
      fetchLoanData();
    } catch (err) {
      showToast(err.response?.data?.message || '❌ Verification failed. Please contact support.');
    } finally { setVerifying(false); }
  };

  const handleRepayDirect = async (amount) => {
    if (!amount || parseFloat(amount) <= 0) return;
    setRepaying(true);
    try {
      const res = await repayLoan({ amount: Number(amount) });
      if (res.data?.payment_url) {
        if (res.data?.reference) localStorage.setItem('last_loan_reference', res.data.reference);
        showToast('Redirecting to Paystack secure checkout...');
        setTimeout(() => { window.location.href = res.data.payment_url; }, 800);
      } else {
        showToast('Repayment initiated successfully!');
        fetchLoanData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Repayment failed. Please try again.');
    } finally { setRepaying(false); }
  };

  const handleRepay = (e) => { e.preventDefault(); handleRepayDirect(repayAmount); };
  const handlePayFullBalance = () => { if (!loan || balance <= 0) return; handleRepayDirect(balance); };
  const handleQuickSelect = (amount) => { setSelectedQuick(amount); setRepayAmount(amount.toString()); };

  const getStatusStyle = (status) => ({
    pending:   { background:'#fff8e7', color:'#b36b00' },
    approved:  { background:'#eafaf0', color:'#1a7a3a' },
    disbursed: { background:'#e7f0ff', color:'#1a4fa0' },
    active:    { background:'#e7f0ff', color:'#1a4fa0' },
    rejected:  { background:'#fff0f0', color:'#cc0000' },
    completed: { background:'#f0f0f0', color:'#555' },
    paid:      { background:'#eafaf0', color:'#1a7a3a' },
  }[status] || { background:'#f0f0f0', color:'#555' });

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontSize:16, color:'#666' }}>Loading your loans...</div>;

  const loan              = activeLoan;
  const isActive          = loan && (loan.status === 'active' || loan.status === 'disbursed');
  const totalRepayment    = loan ? Number(loan.total_repayable || 0) : 0;
  const amountPaid        = loan ? Number(loan.amount_paid || 0) : 0;
  const balance           = loan ? Number(loan.balance || 0) : 0;
  const progress          = totalRepayment > 0 ? Math.round((amountPaid / totalRepayment) * 100) : 0;
  const durationMonths    = loan ? Number(loan.duration_months || 6) : 6;
  const monthlyInstalment = loan ? Number(loan.monthly_instalment || 0) : 0;
  const weeklyInstalment  = Math.ceil(monthlyInstalment / 4);
  const disbursedAt       = loan?.disbursed_at ? new Date(loan.disbursed_at) : null;
  const dueDate           = loan?.due_date ? new Date(loan.due_date) : null;
  const daysRemaining     = dueDate ? Math.max(0, Math.ceil((dueDate - new Date()) / (1000*60*60*24))) : null;
  const fmtDate           = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }) : '—';

  const generateSchedule = (view) => {
    if (!loan) return [];
    const startDate = disbursedAt || new Date();
    const instalments = view === 'monthly' ? durationMonths : durationMonths * 4;
    const amount = view === 'monthly' ? monthlyInstalment : weeklyInstalment;
    let cumPaid = amountPaid;
    return Array.from({ length: instalments }, (_, i) => {
      const date = new Date(startDate);
      if (view === 'monthly') date.setMonth(date.getMonth() + i + 1);
      else date.setDate(date.getDate() + (i+1)*7);
      const paid = cumPaid >= amount;
      if (paid) cumPaid -= amount;
      return { num:i+1, date, amount, paid, overdue: !paid && date < new Date() };
    });
  };

  const schedule     = generateSchedule(scheduleView);
  const quickAmounts = loan ? [Math.ceil(monthlyInstalment/2), monthlyInstalment, Math.ceil(monthlyInstalment*1.5)] : [];

  return (
    <div className="lrp-wrap">
      {toast && <div className="lrp-toast">{toast}</div>}

      {/* Verify overlay */}
      {verifying && (
        <div className="lrp-verify-overlay">
          <div className="lrp-verify-box">
            <div className="lrp-verify-icon">⏳</div>
            <div className="lrp-verify-text">Verifying your payment...</div>
            <div className="lrp-verify-sub">Please wait while we confirm with Paystack</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="lrp-nav">
        <div className="lrp-nav-left" onClick={() => navigate('/products')}>
          <img src="/android-chrome-192x192.png" alt="Logo" className="lrp-nav-logo" />
          <div>
            <div className="lrp-nav-name">ACHOICE <span>LOANS</span></div>
            <div className="lrp-nav-motto">Your needs our solutions</div>
          </div>
        </div>
        <div className="lrp-nav-links">
          <span className="lrp-nav-link" onClick={() => navigate('/')}>Home</span>
          <span className="lrp-nav-link" onClick={() => navigate('/loans/apply')}>Apply for Loan</span>
          <span className="lrp-nav-link" onClick={() => navigate('/orders')}>My Orders</span>
        </div>
        <div className="lrp-nav-right">
          <div className="lrp-cart-icon" onClick={() => navigate('/cart')}>
            🛒 {cartCount > 0 && <span className="lrp-cart-badge">{cartCount}</span>}
          </div>
          <BuyerDropdown cartCount={cartCount} />
        </div>
      </nav>

      <div className="lrp-container">
        <div className="lrp-title-row">
          <h1 className="lrp-page-title">My Loans</h1>
          <button className="lrp-refresh-btn" onClick={fetchLoanData} disabled={loading}>
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>

        {error && <div className="lrp-error">{error}</div>}

        {/* ✅ Auto-verified success banner */}
        {autoVerified && (
          <div className="lrp-success-banner">
            ✅ Payment verified automatically! Your loan balance has been updated.
          </div>
        )}

        {/* ✅ Manual verify banner */}
        {lastReference && !autoVerified && (
          <div className="lrp-verify-banner">
            <div>
              <div className="lrp-verify-banner-title">💳 Payment Received — Verification Pending</div>
              <div className="lrp-verify-banner-sub">Reference: <strong>{lastReference}</strong></div>
            </div>
            <button className={verifying ? 'lrp-verify-btn-dis' : 'lrp-verify-btn'}
              onClick={() => handleVerifyPayment(lastReference)} disabled={verifying}>
              {verifying ? '⏳ Verifying...' : '✅ Verify Payment'}
            </button>
          </div>
        )}

        {loan && loan.id ? (
          <>
            {/* Hero Card */}
            <div className="lrp-hero">
              <div>
                <div className="lrp-hero-badge" style={getStatusStyle(loan.status)}>
                  {loan.status?.toUpperCase()}
                </div>
                <div className="lrp-hero-amount">₦{Number(loan.amount).toLocaleString()}</div>
                <div className="lrp-hero-sub">{loan.purpose} — {durationMonths} months</div>
                <div className="lrp-hero-stats">
                  <div>
                    <div className="lrp-hero-stat-val">₦{totalRepayment.toLocaleString()}</div>
                    <div className="lrp-hero-stat-label">Total Repayable</div>
                  </div>
                  <div className="lrp-hero-stat-div" />
                  <div>
                    <div className="lrp-hero-stat-val">{loan.interest_rate || '—'}%</div>
                    <div className="lrp-hero-stat-label">Interest</div>
                  </div>
                  {daysRemaining !== null && (
                    <>
                      <div className="lrp-hero-stat-div" />
                      <div>
                        <div className="lrp-hero-stat-val" style={{ color: daysRemaining < 30 ? '#ff6b6b' : '#f0c050' }}>
                          {daysRemaining}d
                        </div>
                        <div className="lrp-hero-stat-label">Days Left</div>
                      </div>
                    </>
                  )}
                </div>
                {disbursedAt && (
                  <div className="lrp-disbursed-info">
                    <span>📅 Disbursed: <strong>{fmtDate(disbursedAt)}</strong></span>
                    {dueDate && <span>⏰ Due: <strong>{fmtDate(dueDate)}</strong></span>}
                  </div>
                )}
                {loan.status === 'approved' && (
                  <div className="lrp-pending-note">
                    ⏳ Loan approved! Admin will transfer funds to your bank account shortly.
                  </div>
                )}
              </div>
              <div className="lrp-hero-right">
                <div className="lrp-progress-title">Repayment Progress</div>
                <div className="lrp-progress-pct">{progress}%</div>
                <div className="lrp-progress-bg">
                  <div className="lrp-progress-fill" style={{ width:`${progress}%` }} />
                </div>
                <div className="lrp-progress-note">₦{amountPaid.toLocaleString()} paid of ₦{totalRepayment.toLocaleString()}</div>
                <div className="lrp-instalment-cards">
                  <div className="lrp-instalment-card">
                    <div className="lrp-instalment-icon">📅</div>
                    <div className="lrp-instalment-val">₦{monthlyInstalment.toLocaleString()}</div>
                    <div className="lrp-instalment-label">Monthly</div>
                  </div>
                  <div className="lrp-instalment-card">
                    <div className="lrp-instalment-icon">📆</div>
                    <div className="lrp-instalment-val">₦{weeklyInstalment.toLocaleString()}</div>
                    <div className="lrp-instalment-label">Weekly</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="lrp-stats-grid">
              {[
                { icon:'💰', val:`₦${amountPaid.toLocaleString()}`,  label:'Amount Paid' },
                { icon:'⏳', val:`₦${balance.toLocaleString()}`,       label:'Balance Left' },
                { icon:'📅', val:`${durationMonths} mo`,               label:'Duration' },
                { icon:'✅', val:`${progress}%`,                        label:'Completed' },
              ].map(item => (
                <div key={item.label} className="lrp-stat-card">
                  <div className="lrp-stat-icon">{item.icon}</div>
                  <div className="lrp-stat-val">{item.val}</div>
                  <div className="lrp-stat-label">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Pay Full Balance */}
            {isActive && balance > 0 && (
              <button className={repaying ? 'lrp-full-btn-dis' : 'lrp-full-btn'}
                onClick={handlePayFullBalance} disabled={repaying}>
                {repaying ? '⏳ Redirecting to Paystack...' : `💳 PAY FULL BALANCE — ₦${balance.toLocaleString()}`}
              </button>
            )}

            {/* Partial Repayment */}
            {isActive && (
              <div className="lrp-repay-section">
                <h2 className="lrp-repay-title">Make a Partial Repayment</h2>
                <p className="lrp-repay-sub">Choose a quick amount or enter a custom amount. Payment is verified automatically.</p>
                <div className="lrp-quick-amts">
                  {quickAmounts.map(amt => (
                    <button key={amt}
                      className={selectedQuick === amt ? 'lrp-quick-amt-sel' : 'lrp-quick-amt'}
                      onClick={() => handleQuickSelect(amt)}>
                      ₦{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleRepay} className="lrp-repay-form">
                  <input className="lrp-repay-input" type="number"
                    placeholder="Enter custom amount (₦)"
                    value={repayAmount}
                    onChange={e => { setRepayAmount(e.target.value); setSelectedQuick(null); }}
                    required />
                  <button type="submit" className={repaying ? 'lrp-repay-btn-dis' : 'lrp-repay-btn'} disabled={repaying}>
                    {repaying ? 'Redirecting...' : '💳 Pay with Paystack'}
                  </button>
                </form>
                <p className="lrp-repay-note">🔒 Secured by Paystack · Payment verified automatically on return</p>
              </div>
            )}

            {/* Schedule button */}
            <button className="lrp-schedule-btn" onClick={() => setShowScheduleModal(true)}>
              📋 View Full Repayment Schedule
            </button>

            {/* Manual verify fallback */}
            {!lastReference && isActive && (
              <div className="lrp-manual-verify">
                <span className="lrp-manual-text">Already paid but balance not updated?</span>
                <button className="lrp-manual-btn" onClick={() => handleVerifyPayment(null)}>
                  Verify Payment Manually
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="lrp-no-loan">
            <div className="lrp-no-loan-icon">💳</div>
            <h2 className="lrp-no-loan-title">No Active Loan</h2>
            <p className="lrp-no-loan-text">You currently have no active loan.</p>
            <button className="lrp-apply-btn" onClick={() => navigate('/loans/apply')}>Apply for a Loan</button>
          </div>
        )}

        {/* Loan History */}
        {loanHistory.length > 0 && (
          <div className="lrp-history">
            <h2 className="lrp-history-title">Loan History</h2>
            {loanHistory.map(l => (
              <div key={l.id} className="lrp-history-item">
                <div className="lrp-history-left">
                  <div className="lrp-history-dot" style={getStatusStyle(l.status)}>₦</div>
                  <div>
                    <div className="lrp-history-amount">₦{Number(l.amount).toLocaleString()}</div>
                    <div className="lrp-history-meta">{fmtDate(l.created_at)} — {l.purpose}</div>
                    {l.disbursed_at && (
                      <div style={{ fontSize:11, color:'#888', marginTop:2 }}>
                        Disbursed: {fmtDate(l.disbursed_at)}{l.due_date && ` · Due: ${fmtDate(l.due_date)}`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="lrp-history-badge" style={getStatusStyle(l.status)}>{l.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="lrp-modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="lrp-modal-box" onClick={e => e.stopPropagation()}>
            <div className="lrp-modal-header">
              <h2 className="lrp-modal-title">📋 Repayment Schedule</h2>
              <button className="lrp-modal-close" onClick={() => setShowScheduleModal(false)}>✕</button>
            </div>
            <div className="lrp-modal-tabs">
              <button className={scheduleView==='monthly' ? 'lrp-modal-tab-active' : 'lrp-modal-tab'}
                onClick={() => setScheduleView('monthly')}>Monthly</button>
              <button className={scheduleView==='weekly' ? 'lrp-modal-tab-active' : 'lrp-modal-tab'}
                onClick={() => setScheduleView('weekly')}>Weekly</button>
              <div className="lrp-modal-tab-info">
                {scheduleView==='monthly' ? `₦${monthlyInstalment.toLocaleString()} / month` : `₦${weeklyInstalment.toLocaleString()} / week`}
              </div>
            </div>
            <div className="lrp-schedule-head">
              <span>#</span><span>Due Date</span><span>Amount</span><span>Status</span>
            </div>
            <div className="lrp-schedule-body">
              {schedule.map(row => (
                <div key={row.num} className="lrp-schedule-row"
                  style={{ background: row.paid ? '#f0fff4' : row.overdue ? '#fff8f8' : '#fff' }}>
                  <span className="lrp-sched-num">{row.num}</span>
                  <span className="lrp-sched-date">{fmtDate(row.date)}</span>
                  <span className="lrp-sched-amt">₦{row.amount.toLocaleString()}</span>
                  <span>
                    {row.paid ? <span className="lrp-paid-badge">✓ Paid</span>
                      : row.overdue ? <span className="lrp-overdue-badge">⚠ Overdue</span>
                      : <span className="lrp-upcoming-badge">Upcoming</span>}
                  </span>
                </div>
              ))}
            </div>
            <div className="lrp-modal-summary">
              <span>Total: ₦{totalRepayment.toLocaleString()}</span>
              <span style={{ color:'#1a7a3a' }}>Paid: ₦{amountPaid.toLocaleString()}</span>
              <span style={{ color:'#cc0000' }}>Balance: ₦{balance.toLocaleString()}</span>
            </div>
            <div className="lrp-modal-footer">
              <button className="lrp-close-modal-btn" onClick={() => setShowScheduleModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
