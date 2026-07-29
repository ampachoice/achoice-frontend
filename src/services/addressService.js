import api from './api';

// Address Book — Phase 3. Backend enforces exactly one default per user:
// the first address a buyer ever adds automatically becomes default
// regardless of what's passed, marking a different one as default
// automatically unmarks the previous one, and deleting the current
// default automatically promotes the next most recent address. None of
// that needs to be managed here — just call the endpoints.

export const getAddresses = () => api.get('/addresses');

export const createAddress = (data) => api.post('/addresses', data);

export const updateAddress = (id, data) => api.put(`/addresses/${id}`, data);

export const deleteAddress = (id) => api.delete(`/addresses/${id}`);

export const setDefaultAddress = (id) => api.patch(`/addresses/${id}/default`);
