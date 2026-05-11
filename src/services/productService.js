import api from './api';

// ── Products ──────────────────────────────────────────
export const getAllProducts       = ()           => api.get('/products');
export const getFeaturedProducts  = ()           => api.get('/products/featured');
export const getProduct           = (id)         => api.get(`/products/${id}`);
export const getProductReviews    = (id)         => api.get(`/products/${id}/reviews`);
export const submitProductReview  = (id, data)   => api.post(`/products/${id}/reviews`, data);
