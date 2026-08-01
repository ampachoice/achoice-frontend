import { useLocation } from 'react-router-dom';
import PullToRefresh from 'react-simple-pull-to-refresh';

// Routes where pull-to-refresh must be disabled —
// any page with a form, payment flow, or unsaved state.
const EXCLUDED = [
  '/checkout',
  '/cart',
  '/loans/apply',
  '/change-password',
  '/forgot-password',
  '/reset-password',
  '/login',
  '/register',
  '/become-a-seller',
//  '/admin',
];

export default function AppPullToRefresh({ children }) {
  const { pathname } = useLocation();
  const isMobile = window.innerWidth < 768;

  // Disable on excluded routes (also catches /admin/dashboard etc)
  const isExcluded = EXCLUDED.some((p) => pathname.startsWith(p));

  if (!isMobile || isExcluded) return children;

  const handleRefresh = () =>
    new Promise((resolve) => {
      window.location.reload();
      resolve();
    });

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {children}
    </PullToRefresh>
  );
}