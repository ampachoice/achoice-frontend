import api from './api';

export const createOrder = (data) => api.post('/orders', data);
export const getMyOrders = () => api.get('/orders/my-orders');
export const confirmDelivery = (id) => api.patch(`/orders/${id}/confirm`);
export const cancelOrder = (id) => api.patch(`/orders/${id}/cancel`);
