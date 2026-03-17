import api from './api';

export const getSellers = () => api.get('/sellers');
export const createSeller = (data) => api.post('/sellers', data);
export const getAdminLoans = () => api.get('/admin/loans');
export const decideLoan = (id, data) => api.patch(`/admin/loans/${id}/decision`, data);
export const getAdminOrders = () => api.get('/admin/orders');
export const updateOrderStatus = (id, data) => api.patch(`/admin/orders/${id}/status`, data);