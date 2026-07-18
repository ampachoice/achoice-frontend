import api from './api';

// ── Buyer endpoints ───────────────────────────────────────────────────────────

// Submit loan application
export const applyForLoan = (data) => api.post('/loans/apply', data);

// Get buyer's active loan (used on LoanRepayPage)
export const getMyActiveLoan = () => api.get('/loans/my-loan');

// Get buyer's full loan history
export const getMyLoanHistory = () => api.get('/loans/my-history');

// Make a repayment via Paystack
// Body: { amount: number, loan_id?: number }
// Returns: { payment_url: "https://paystack.com/..." }
// → Redirect buyer to payment_url to complete payment
// → Paystack webhook on backend updates loan balance automatically
export const repayLoan = (data) => api.post('/loans/repay', data);

// Manually confirm a payment by reference — call this after Paystack
// redirects back, or as a fallback if the webhook hasn't fired yet.
// Body: { reference: string }
export const verifyLoanPayment = (reference) =>
  api.post('/loans/verify-payment', { reference });

// ── GTBank-style loan interface (new) ────────────────────────────────────────

// Loans List page — total due this month + one card per active/disbursed loan
export const getLoanSummary = () => api.get('/loans/summary');

// "Pay All" — one Paystack payment covering every active loan's amount due
// Returns: { payment_url, reference_number, total_due, loans_covered }
export const payAllDue = () => api.post('/loans/pay-all-due');

// Loan Detail page — balance, progress ring data, next payment, last 5 payments
export const getLoanDetails = (id) => api.get(`/loans/${id}/details`);

// Repayment Schedule table — full installment breakdown for one loan
export const getInstallments = (id) => api.get(`/loans/${id}/installments`);

// Liquidate flow — full or partial payoff
// Body: { type: 'full' } or { type: 'partial', amount: number }
// Returns: { payment_url, reference_number, year_of_loan, loan_amount, loan_balance, repayment_amount }
// → Redirect buyer to payment_url, same as repayLoan
export const liquidateLoan = (id, data) => api.post(`/loans/${id}/liquidate`, data);

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
