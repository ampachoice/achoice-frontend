import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// MobileNavDrawer — hamburger icon + slide-out menu for small screens.
// Drop into any buyer page navbar, alongside (not replacing) NotificationBell
// and BuyerDropdown — those stay visible on desktop; this only shows ≤640px.
//
// Usage:
//   import MobileNavDrawer from '../../components/buyer/MobileNavDrawer';
//   <MobileNavDrawer cartCount={cartCount} />
// ─────────────────────────────────────────────────────────────────────────────

export default function MobileNavDrawer({ cartCount = 0, onLogout }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on outside click (inside the overlay, not the panel)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) setOpen(false);
  };

  const handleLogout = () => {
    setOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      localStorage.clear();
      navigate('/login');
    }
  };

  const go = (path) => { setOpen(false); navigate(path); };

  const menuItems = [
    { icon: '🏠', label: 'Home',                path: '/' },
    { icon: '🛍️', label: 'Shop Products',       path: '/products' },
    { icon: '👤', label: 'My Profile',          path: '/profile' },
    { icon: '🛒', label: 'Cart',                path: '/cart', badge: cartCount > 0 ? cartCount : null },
    { icon: '📦', label: 'My Orders',           path: '/orders' },
    { icon: '💰', label: 'Apply for Loan',      path: '/loans/apply' },
    { icon: '📋', label: 'My Loans',            path: '/loans/repay' },
    { icon: '📝', label: 'Complaints & Refunds', path: '/complaints' },
    { icon: '🔔', label: 'Notifications',       path: '/notifications' },
  ];

  return (
    <>
      <style>{`
        .mnd-trigger { display:none; background:none; border:none; color:#fff; font-size:24px; cursor:pointer; padding:4px 6px; line-height:1; }
        @media (max-width:640px) {
          .mnd-trigger { display:flex; align-items:center; justify-content:center; }
        }

        .mnd-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.45);
          z-index:998; display:flex; justify-content:flex-end;
          animation: mnd-fade 0.18s ease;
        }
        @keyframes mnd-fade { from { opacity:0; } to { opacity:1; } }

        .mnd-panel {
          width:78%; max-width:300px; height:100%;
          background:#fff; display:flex; flex-direction:column;
          box-shadow:-6px 0 24px rgba(0,0,0,0.2);
          animation: mnd-slide 0.22s ease;
        }
        @keyframes mnd-slide { from { transform:translateX(100%); } to { transform:translateX(0); } }

        .mnd-header { background:#1f4d1f; padding:20px 18px; display:flex; align-items:center; gap:12px; }
        .mnd-avatar { width:42px; height:42px; border-radius:50%; background:#f0c050; color:#1a3d1a; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:17px; flex-shrink:0; }
        .mnd-name { color:#fff; font-size:15px; font-weight:700; }
        .mnd-email { color:#a8d5a8; font-size:11px; margin-top:2px; word-break:break-all; }
        .mnd-close { margin-left:auto; background:none; border:none; color:#fff; font-size:22px; cursor:pointer; padding:4px; flex-shrink:0; }

        .mnd-items { flex:1; overflow-y:auto; padding:8px 0; }
        .mnd-item { display:flex; align-items:center; gap:14px; padding:14px 20px; cursor:pointer; font-size:15px; color:#222; transition:background 0.15s; }
        .mnd-item:active { background:#f0f7ec; }
        .mnd-item-icon { font-size:19px; width:24px; text-align:center; flex-shrink:0; }
        .mnd-item-label { flex:1; }
        .mnd-item-badge { background:#f0c050; color:#1a1a1a; font-size:11px; font-weight:700; padding:2px 8px; border-radius:99px; }

        .mnd-footer { padding:14px 20px; border-top:1px solid #eee; }
        .mnd-logout { width:100%; display:flex; align-items:center; gap:10px; background:#fff0f0; color:#cc0000; border:none; border-radius:8px; padding:12px 16px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; }

        .mnd-auth { display:flex; flex-direction:column; gap:10px; padding:24px 20px; }
        .mnd-auth-btn { padding:12px; border-radius:8px; font-size:14px; font-weight:600; font-family:inherit; cursor:pointer; text-align:center; }
        .mnd-auth-signin { background:#fff; color:#1f4d1f; border:1.5px solid #1f4d1f; }
        .mnd-auth-register { background:#1f4d1f; color:#fff; border:none; }
      `}</style>

      <button className="mnd-trigger" onClick={() => setOpen(true)} aria-label="Open menu">
        ☰
      </button>

      {open && (
        <div className="mnd-overlay" onClick={handleOverlayClick}>
          <div className="mnd-panel" ref={panelRef}>
            <div className="mnd-header">
              {user ? (
                <>
                  <div className="mnd-avatar">{initial}</div>
                  <div>
                    <div className="mnd-name">{user.name}</div>
                    <div className="mnd-email">{user.email}</div>
                  </div>
                </>
              ) : (
                <div className="mnd-name">ACHOICE MARKET</div>
              )}
              <button className="mnd-close" onClick={() => setOpen(false)} aria-label="Close menu">✕</button>
            </div>

            {user ? (
              <>
                <div className="mnd-items">
                  {menuItems.map((item) => (
                    <div key={item.path} className="mnd-item" onClick={() => go(item.path)}>
                      <span className="mnd-item-icon">{item.icon}</span>
                      <span className="mnd-item-label">{item.label}</span>
                      {item.badge && <span className="mnd-item-badge">{item.badge}</span>}
                    </div>
                  ))}
                </div>
                <div className="mnd-footer">
                  <button className="mnd-logout" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="mnd-auth">
                <button className="mnd-auth-btn mnd-auth-signin" onClick={() => go('/login')}>Sign In</button>
                <button className="mnd-auth-btn mnd-auth-register" onClick={() => go('/register')}>Get Started</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
