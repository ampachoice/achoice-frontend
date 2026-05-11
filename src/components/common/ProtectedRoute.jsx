import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({
  children,
  adminOnly = false
}) {

  const token = localStorage.getItem('token');

  const user = JSON.parse(
    localStorage.getItem('user')
  );

  const expiresAt = localStorage.getItem(
    'session_expires_at'
  );

  // =========================
  // CHECK LOGIN
  // =========================
  if (!token || !user || !expiresAt) {
    return <Navigate to="/login" replace />;
  }

  // =========================
  // CHECK SESSION EXPIRATION
  // =========================
  const now = new Date().getTime();

  if (now > Number(expiresAt)) {

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('session_expires_at');

    return <Navigate to="/login" replace />;
  }

  // =========================
  // ADMIN CHECK
  // =========================
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}