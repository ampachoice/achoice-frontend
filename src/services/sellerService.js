import api from './api';

// ── Dashboard ────────────────────────────────────────────────────────────
export const getSellerDashboard = () => api.get('/seller/dashboard');

// ── Store profile (the seller's own account — different from the public
// GET /sellers/{id}/profile used for the storefront/spotlight) ────────────
export const getSellerProfile = () => api.get('/seller/profile');
export const updateSellerProfile = (data) => api.put('/seller/profile', data);

// Public seller profile — used to read the seller's own seller_score/
// score_label/total_sales, since GET /seller/dashboard doesn't include them.
export const getPublicSellerProfile = (id) => api.get(`/sellers/${id}/profile`);

// ── Products ─────────────────────────────────────────────────────────────
export const getSellerProducts = (params) => api.get('/seller/products', { params });
export const getSellerProduct = (id) => api.get(`/seller/products/${id}`);
export const createSellerProduct = (data) => api.post('/seller/products', data);
export const updateSellerProduct = (id, data) => api.put(`/seller/products/${id}`, data);
export const deleteSellerProduct = (id) => api.delete(`/seller/products/${id}`);
// Gallery images — the file itself is uploaded directly to Cloudinary
// client-side (see uploadImageToCloudinary in SellerProductsPage.jsx, same
// unsigned-preset pattern the admin product form already uses); these just
// attach/detach the resulting URL on the backend.
export const addProductGalleryImages = (id, imageUrls) => api.post(`/seller/products/${id}/gallery`, { image_urls: imageUrls });
export const deleteProductGalleryImage = (imageId) => api.delete(`/seller/products/image/${imageId}`);

// ── Orders ───────────────────────────────────────────────────────────────
export const getSellerOrders = (params) => api.get('/seller/orders', { params });
export const markOrderReadyToShip = (orderItemId) => api.patch(`/seller/orders/${orderItemId}/ready-to-ship`);

// ── Inventory ────────────────────────────────────────────────────────────
export const getSellerLowStock = (params) => api.get('/seller/inventory/low-stock', { params });

// ── Finance ──────────────────────────────────────────────────────────────
export const getSellerEarnings = (params) => api.get('/seller/earnings', { params });
export const requestRemittance = () => api.post('/seller/earnings/request-remittance');

// ── Reviews ──────────────────────────────────────────────────────────────
export const getSellerReviews = (params) => api.get('/seller/reviews', { params });
export const replyToReview = (reviewId, reply) => api.post(`/seller/reviews/${reviewId}/reply`, { reply });
export const deleteReviewReply = (reviewId) => api.delete(`/seller/reviews/${reviewId}/reply`);

// ── Followers ────────────────────────────────────────────────────────────
export const getSellerFollowers = (params) => api.get('/seller/followers', { params });

// ── Flash sale requests ──────────────────────────────────────────────────
export const getFlashSaleRequests = (params) => api.get('/seller/flash-sale-requests', { params });
export const createFlashSaleRequest = (data) => api.post('/seller/flash-sale-requests', data);
export const withdrawFlashSaleRequest = (id) => api.delete(`/seller/flash-sale-requests/${id}`);

// ── Public storefront (used for the seller's own store preview) ───────────
export const getPublicSellerProducts = (sellerId, params) => api.get('/products', { params: { ...params, seller_id: sellerId } });
