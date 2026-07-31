import api from './api';

// ── Products ──────────────────────────────────────────
export const getAllProducts       = (params = {}) => api.get('/products', { params });
export const getFeaturedProducts  = ()           => api.get('/products/featured');
export const getCategories        = ()           => api.get('/settings/categories');
// New Phase 6 endpoint — full parent category tree with nested subcategories,
// e.g. [{ id, name, slug, subcategories: [{ id, name, slug, parent_id }] }].
// Used wherever a form needs category_id (product forms), not the old flat
// slug list above.
export const getCategoryTree      = ()           => api.get('/categories');
export const getCategoryBySlug    = (slug)       => api.get(`/categories/${slug}`);
export const getProduct           = (id)         => api.get(`/products/${id}`);
export const getProductReviews    = (id)         => api.get(`/products/${id}/reviews`);
export const submitProductReview  = (id, data)   => api.post(`/products/${id}/reviews`, data);

