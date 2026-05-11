import api from './api';

// ── Buyer endpoints ───────────────────────────────────────────────────────────

// Submit loan application
export const applyForLoan = (data) => api.post('/loans/apply', data);

// Get buyer's active loan (used on LoanRepayPage)
export const getMyActiveLoan = () => api.get('/loans/my-loan');

// Get buyer's full loan history
export const getMyLoanHistory = () => api.get('/loans/my-history');

// Make a repayment via Paystack
// Body: { amount: number }
// Returns: { payment_url: "https://paystack.com/..." }
// → Redirect buyer to payment_url to complete payment
// → Paystack webhook on backend updates loan balance automatically
export const repayLoan = (data) => api.post('/loans/repay', data);

// ── Admin endpoints ───────────────────────────────────────────────────────────

// List all loan applications
export const getAdminLoans = () => api.get('/admin/loans');

// Get single loan detail
export const getAdminLoan = (id) => api.get(`/admin/loans/${id}`);

// Approve or reject a loan
// Body: { decision: 'approved'|'rejected', interest_rate?, duration_months?, rejection_reason? }
export const decideLoan = (id, data) => api.patch(`/admin/loans/${id}/decision`, data);

// Mark loan as disbursed (after manual bank transfer)
// No body needed — just PATCH the endpoint
export const disburseLoan = (id) => api.patch(`/admin/loans/${id}/disburse`);

// View repayment history for a loan
export const getLoanRepayments = (id) => api.get(`/admin/loans/${id}/repayments`);
