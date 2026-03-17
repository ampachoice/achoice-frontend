import api from './api';

export const getAllProducts = () => api.get('/products');
export const getProduct = (id) => api.get(`/products/${id}`);