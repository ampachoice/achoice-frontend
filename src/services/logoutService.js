import api from './api';

// ─────────────────────────────────────────────────────────────────────────────
// Centralized logout — every "Logout" button in the app should go through
// one of these two instead of writing its own localStorage.clear() +
// navigate('/login').
//
// POST /api/logout (AuthController::logout) revokes the user's Sanctum
// token server-side — that's the actual point of having a logout endpoint.
// Clearing localStorage alone only logs the user out of THIS browser; the
// token itself stays valid in the database until it naturally expires
// (30 days) or is explicitly revoked. If that token were ever exposed —
// stolen device, XSS, a synced browser profile — it would still work
// after a "logout" that only cleared local storage. Calling this endpoint
// closes that gap.
//
// Two variants for two different UX needs:
//   logoutAsync — awaits the revocation call before clearing local state.
//                 Use where a brief pause before redirect is fine.
//   logoutSync  — clears local state and redirects immediately; the
//                 revocation call still fires, just not awaited. Use where
//                 an instant redirect matters more (e.g. a hamburger menu
//                 button) and a few hundred ms of network latency would be
//                 a visible stall.
// Either way, a failed/timed-out API call (token already expired, offline,
// etc.) never blocks logging the user out of this device — local state is
// always cleared regardless of whether the server call succeeds.
// ─────────────────────────────────────────────────────────────────────────────

const clearLocalAuthState = () => {
  localStorage.clear();
};

export const logoutAsync = async () => {
  try {
    await api.post('/logout');
  } catch (err) {
    // Token may already be invalid/expired, or the request failed for some
    // other reason — either way, the user still needs to be logged out of
    // this device, so fall through to clearing local state regardless.
  } finally {
    clearLocalAuthState();
  }
};

export const logoutSync = () => {
  api.post('/logout').catch(() => {});
  clearLocalAuthState();
};
