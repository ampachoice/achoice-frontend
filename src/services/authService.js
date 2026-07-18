import api from './api';

export const register = (data) => api.post('/register', data);
export const login = (data) => api.post('/login', data);
export const logout = () => api.post('/logout');
export const getMe = () => api.get('/me');

// Email OTP — required before /register (purpose: buyer_signup) and
// before /register-seller (purpose: seller_signup).
export const sendOtp = (email, purpose = 'buyer_signup') => api.post('/auth/send-otp', { email, purpose });
export const verifyOtp = (email, code) => api.post('/auth/verify-otp', { email, code });