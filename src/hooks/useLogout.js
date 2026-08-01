import { useNavigate } from 'react-router-dom';
import { logoutAsync } from '../services/logoutService';

// ─────────────────────────────────────────────────────────────────────────────
// useLogout — the one thing every "Logout" button in the app should call.
// Wraps logoutAsync (revokes the token server-side, then clears local
// storage) and redirects to /login once that's done.
//
// Usage:
//   const logout = useLogout();
//   <button onClick={logout}>Logout</button>
//
// If a button needs the instant-redirect behavior instead (no waiting on
// the network), use logoutSync from services/logoutService directly instead
// of this hook, and navigate immediately after calling it.
// ─────────────────────────────────────────────────────────────────────────────
export default function useLogout() {
  const navigate = useNavigate();

  return async () => {
    await logoutAsync();
    navigate('/login');
  };
}
