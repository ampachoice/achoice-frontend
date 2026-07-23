import api from './api';

export const getSellers = () => api.get('/sellers');
export const createSeller = (data) => api.post('/sellers', data);
export const getAdminLoans = () => api.get('/admin/loans');
export const decideLoan = (id, data) => api.patch(`/admin/loans/${id}/decision`, data);
export const getAdminOrders = () => api.get('/admin/orders');
export const updateOrderStatus = (id, data) => api.patch(`/admin/orders/${id}/status`, data);

// Flash sales (admin)
export const getAdminFlashSales = (params) => api.get('/admin/flash-sales', { params });
export const createFlashSale = (data) => api.post('/admin/flash-sales', data);
export const updateFlashSale = (id, data) => api.put(`/admin/flash-sales/${id}`, data);
export const deleteFlashSale = (id) => api.delete(`/admin/flash-sales/${id}`);

// Flash sale requests — seller-submitted, admin reviews
export const getAdminFlashSaleRequests = (params) => api.get('/admin/flash-sale-requests', { params });
export const approveFlashSaleRequest = (id) => api.patch(`/admin/flash-sale-requests/${id}/approve`);
export const rejectFlashSaleRequest = (id, reason) => api.patch(`/admin/flash-sale-requests/${id}/reject`, { reason });

// Cross-role user search (buyers, sellers, staff, admin) — distinct from the
// buyer-only /admin/users endpoint used by ManageBuyersPage.
export const searchUsers = (params) => api.get('/admin/user-search', { params });
export const getUserFullProfile = (id) => api.get(`/admin/user-search/${id}`);
export const suspendUserAccount = (id) => api.patch(`/admin/users/${id}/suspend`);
export const activateUserAccount = (id) => api.patch(`/admin/users/${id}/activate`);
export const banUserAccount = (id) => api.patch(`/admin/users/${id}/ban`);
export const restrictUserAccount = (id, data) => api.patch(`/admin/users/${id}/restrict`, data);