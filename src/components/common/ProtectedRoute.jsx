import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';

export default function ProtectedRoute({
  children,
  adminOnly = false,
  allowedRoles = null,
}) {
  const token     = localStorage.getItem('token');
  const user      = JSON.parse(localStorage.getItem('user') || 'null');
  const expiresAt = localStorage.getItem('session_expires_at');

  const [checking, setChecking] = useState(false);

  // Periodically verify user status with backend (every 2 minutes)
  useEffect(() => {
    if (!token || !user) return;

    const checkStatus = async () => {
      try {
        await api.get('/me');
      } catch (err) {
        // api.js interceptor handles 403 ACCOUNT_BANNED/SUSPENDED automatically
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  // CHECK LOGIN
  if (!token || !user || !expiresAt) {
    return <Navigate to="/login" replace />;
  }

  // CHECK SESSION EXPIRATION
  const now = new Date().getTime();
  if (now > Number(expiresAt)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('session_expires_at');
    return <Navigate to="/login" replace />;
  }

  // ADMIN CHECK
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // ROLE CHECK
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

