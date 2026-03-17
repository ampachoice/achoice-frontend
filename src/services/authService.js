import api from './api';

export const login = (data) => api.post('/login', data);
export const register = (data) => api.post('/register', data);
export const logout = () => api.post('/logout');