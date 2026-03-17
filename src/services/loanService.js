import api from './api';

export const applyForLoan = (data) => api.post('/loans/apply', data);
export const getMyActiveLoan = () => api.get('/loans/my-loan');
export const getMyLoanHistory = () => api.get('/loans/my-history');
export const repayLoan = (data) => api.post('/loans/repay', data);