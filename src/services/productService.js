import api from './api';

export const getAllProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);