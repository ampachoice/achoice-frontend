import { createBrowserRouter, RouterProvider, Navigate, useLocation, Outlet } from 'react-router-dom';
import PullToRefresh from 'react-simple-pull-to-refresh';

// ── Pull-to-refresh layout ────────────────────────────────────────────────────
// Wraps every page with mobile pull-to-refresh EXCEPT pages where the user
// might have unsaved input or an active payment flow. On those pages a
// accidental swipe-down must never wipe form state or interrupt Paystack.
const NO_PULL_REFRESH = [
  '/checkout',
  '/cart',
  '/login',
  '/register',
  '/become-a-seller',
  '/forgot-password',
  '/reset-password',
  '/change-password',
  '/loans/apply',
  '/loans/', // loan detail, liquidate, schedule
 // '/admin',  // all admin pages manage data — accidental reload is disruptive
  '/complaints/', // complaint detail has a reply form
];

function PullToRefreshLayout() {
  const { pathname } = useLocation();
  const isMobile = window.innerWidth < 768;
  const isExcluded = NO_PULL_REFRESH.some((p) => pathname.startsWith(p));

  if (!isMobile || isExcluded) return <Outlet />;

  return (
    <PullToRefresh
      onRefresh={() => new Promise((resolve) => {
        window.location.reload();
        resolve();
      })}
      pullingContent=""
      refreshingContent={
        <div style={{
          textAlign: 'center', padding: '12px 0',
          fontSize: 13, color: '#1f4d1f', fontWeight: 600,
        }}>
          🔄 Refreshing...
        </div>
      }
    >
      <Outlet />
    </PullToRefresh>
  );
}

// Paystack redirects here with ?reference=... in the URL. A plain
// <Navigate to="/loans"> drops that query string entirely, which silently
// broke payment verification — LoansListPage never saw the reference it
// needed to confirm the payment. This preserves it across the redirect.
function RedirectToLoansPreservingQuery() {
  const location = useLocation();
  return <Navigate to={`/loans${location.search}`} replace />;
}

// ── AUTH ─────────────────────────────────────────────────────────────────────
import LoginPage          from './pages/auth/LoginPage';
import RegisterPage       from './pages/auth/RegisterPage';
import SellerRegisterPage from './pages/auth/SellerRegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from './pages/auth/ResetPasswordPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';

// ── BUYER ────────────────────────────────────────────────────────────────────
import HomePage         from './pages/HomePage';
import ProductPage      from './pages/buyer/ProductPage';
import CartPage         from './pages/buyer/CartPage';
import CheckoutPage     from './pages/buyer/CheckoutPage';
import OrderHistoryPage from './pages/buyer/OrderHistoryPage';
import LoanApplyPage    from './pages/buyer/LoanApplyPage';
import LoansListPage    from './pages/buyer/LoansListPage';
import LoanDetailPage   from './pages/buyer/LoanDetailPage';
import LoanLiquidatePage from './pages/buyer/LoanLiquidatePage';
import LoanSchedulePage from './pages/buyer/LoanSchedulePage';
import ProfilePage      from './pages/buyer/ProfilePage';
import NotificationsPage from './pages/buyer/NotificationsPage';
import ComplaintsPage  from './pages/buyer/ComplaintsPage';
import ComplaintDetailPage from './pages/buyer/ComplaintDetailPage';
import WishlistPage         from './pages/buyer/WishlistPage';
import PendingReviewsPage   from './pages/buyer/PendingReviewsPage';
import AddressBookPage from './pages/buyer/AddressBookPage';
import SellerStorefrontPage from './pages/buyer/SellerStorefrontPage';
import ContentPage     from './pages/ContentPage';
import HelpCenterPage  from './pages/HelpCenterPage';

// ── STAFF ────────────────────────────────────────────────────────────────────
import AgroStaffDashboard from './pages/staff/AgroStaffDashboard';
import LoanStaffDashboard from './pages/staff/LoanStaffDashboard';
import StaffProductApprovalsPage from './pages/staff/StaffProductApprovalsPage';

// ── ADMIN ────────────────────────────────────────────────────────────────────
import AdminLoginPage     from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import Adminreportspage   from './pages/admin/Adminreportspage';
import ManageSellersPage  from './pages/admin/ManageSellersPage';
import ManageProductsPage from './pages/admin/ManageProductsPage';
import ManageCategoriesPage from './pages/admin/ManageCategoriesPage';
import AdminFlashSalesPage from './pages/admin/AdminFlashSalesPage';
import AdminFlashSaleRequestsPage from './pages/admin/AdminFlashSaleRequestsPage';
import AdminRemittanceRequestsPage from './pages/admin/AdminRemittanceRequestsPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import ManageOrdersPage   from './pages/admin/ManageOrdersPage';
import ManageLoansPage    from './pages/admin/ManageLoansPage';
import LoanSettingsPage   from './pages/admin/LoanSettingsPage';
import DeliveryZonesPage  from './pages/admin/DeliveryZonesPage';
import ManageStaffPage    from './pages/admin/ManageStaffPage';
import ManageBuyersPage   from './pages/admin/ManageBuyersPage';
import AdminPaystackPage  from './pages/admin/AdminPaystackPage';
import AdminSettingsPage  from './pages/admin/AdminSettingsPage';
import AdminComplaintsPage from './pages/admin/AdminComplaintsPage';
import AdminComplaintDetailPage from './pages/admin/AdminComplaintDetailPage';
import AdminAuditLogPage from './pages/admin/AdminAuditLogPage';
import AdminReviewModerationPage from './pages/admin/AdminReviewModerationPage';
import AdminBroadcastsPage from './pages/admin/AdminBroadcastsPage';
import AdminProductApprovalsPage from './pages/admin/AdminProductApprovalsPage';
import StaffComplaintsPage from './pages/staff/StaffComplaintsPage';
import StaffComplaintDetailPage from './pages/staff/StaffComplaintDetailPage';
import StaffNotificationsPage from './pages/staff/StaffNotificationsPage';

// ── SELLER ───────────────────────────────────────────────────────────────────
import SellerDashboardPage from './pages/seller/SellerDashboardPage';
import SellerStoreProfilePage from './pages/seller/SellerStoreProfilePage';
import SellerProductsPage from './pages/seller/SellerProductsPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';
import SellerFinancePage from './pages/seller/SellerFinancePage';
import SellerLoansPage from './pages/seller/SellerLoansPage';
import SellerFlashSalesPage from './pages/seller/SellerFlashSalesPage';
import SellerFollowersPage from './pages/seller/SellerFollowersPage';
import SellerReviewsPage from './pages/seller/SellerReviewsPage';
import SellerStorePreviewPage from './pages/seller/SellerStorePreviewPage';
import SellerNotificationsPage from './pages/seller/SellerNotificationsPage';

// ── PROTECTED ROUTE ───────────────────────────────────────────────────────────
import ProtectedRoute from './components/common/ProtectedRoute';

const router = createBrowserRouter([
  {
    // PullToRefreshLayout wraps ALL routes — it checks the pathname internally
    // and skips the gesture on excluded pages (checkout, forms, admin, etc.)
    element: <PullToRefreshLayout />,
    children: [

      // ── Public ──────────────────────────────────────────────────────────────
      { path: '/',                element: <HomePage /> },
      { path: '/login',           element: <LoginPage /> },
      { path: '/register',        element: <RegisterPage /> },
      { path: '/become-a-seller', element: <SellerRegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password',  element: <ResetPasswordPage /> },
      { path: '/change-password', element: <ChangePasswordPage /> },

      // ── Buyer ───────────────────────────────────────────────────────────────
      { path: '/products',    element: <ProductPage /> },
      { path: '/product/:id', element: <ProductPage /> },
      { path: '/cart',        element: <ProtectedRoute><CartPage /></ProtectedRoute> },
      { path: '/checkout',    element: <ProtectedRoute><CheckoutPage /></ProtectedRoute> },
      { path: '/orders',      element: <ProtectedRoute><OrderHistoryPage /></ProtectedRoute> },
      { path: '/loans/apply', element: <ProtectedRoute><LoanApplyPage /></ProtectedRoute> },
      { path: '/loans',       element: <ProtectedRoute><LoansListPage /></ProtectedRoute> },
      { path: '/loans/repay', element: <RedirectToLoansPreservingQuery /> },
      { path: '/loans/:id',             element: <ProtectedRoute><LoanDetailPage /></ProtectedRoute> },
      { path: '/loans/:id/liquidate',   element: <ProtectedRoute><LoanLiquidatePage /></ProtectedRoute> },
      { path: '/loans/:id/schedule',    element: <ProtectedRoute><LoanSchedulePage /></ProtectedRoute> },
      { path: '/profile',       element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
      { path: '/notifications', element: <ProtectedRoute><NotificationsPage /></ProtectedRoute> },
      { path: '/complaints',    element: <ProtectedRoute><ComplaintsPage /></ProtectedRoute> },
      { path: '/complaints/:id', element: <ProtectedRoute><ComplaintDetailPage /></ProtectedRoute> },
      { path: '/wishlist',      element: <ProtectedRoute><WishlistPage /></ProtectedRoute> },
      { path: '/reviews/pending', element: <ProtectedRoute><PendingReviewsPage /></ProtectedRoute> },
      { path: '/addresses',     element: <ProtectedRoute><AddressBookPage /></ProtectedRoute> },
      { path: '/sellers/:id',   element: <SellerStorefrontPage /> },
      { path: '/help',          element: <HelpCenterPage /> },
      { path: '/pages/:slug',   element: <ContentPage /> },

      // ── Staff ────────────────────────────────────────────────────────────────
      {
        path: '/staff/agro',
        element: <ProtectedRoute allowedRoles={['staff', 'admin']}><AgroStaffDashboard /></ProtectedRoute>
      },
      {
        path: '/staff/agro/product-approvals',
        element: <ProtectedRoute allowedRoles={['staff', 'admin']}><StaffProductApprovalsPage /></ProtectedRoute>
      },
      {
        path: '/staff/loans',
        element: <ProtectedRoute allowedRoles={['staff', 'admin']}><LoanStaffDashboard /></ProtectedRoute>
      },
      {
        path: '/staff/complaints',
        element: <ProtectedRoute allowedRoles={['staff', 'admin']}><StaffComplaintsPage /></ProtectedRoute>
      },
      {
        path: '/staff/complaints/:id',
        element: <ProtectedRoute allowedRoles={['staff', 'admin']}><StaffComplaintDetailPage /></ProtectedRoute>
      },
      {
        path: '/staff/notifications',
        element: <ProtectedRoute allowedRoles={['staff', 'admin']}><StaffNotificationsPage /></ProtectedRoute>
      },

      // ── Seller ───────────────────────────────────────────────────────────────
      {
        path: '/seller/dashboard',
        element: <ProtectedRoute allowedRoles={['seller']}><SellerDashboardPage /></ProtectedRoute>
      },
      {
        path: '/seller/products',
        element: <ProtectedRoute allowedRoles={['seller']}><SellerProductsPage /></ProtectedRoute>
      },
      {
        path: '/seller/orders',
        element: <ProtectedRoute allowedRoles={['seller']}><SellerOrdersPage /></ProtectedRoute>
      },
      {
        path: '/seller/finance',
        element: <ProtectedRoute allowedRoles={['seller']}><SellerFinancePage /></ProtectedRoute>
      },
      {
        path: '/seller/loans',
        element: <ProtectedRoute allowedRoles={['seller']}><SellerLoansPage /></ProtectedRoute>
      },
      {
        path: '/seller/flash-sales',
        element: <ProtectedRoute allowedRoles={['seller']}><SellerFlashSalesPage /></ProtectedRoute>
      },
      {
        path: '/seller/followers',
        element: <ProtectedRoute allowedRoles={['seller']}><SellerFollowersPage /></ProtectedRoute>
      },
      {
        path: '/seller/reviews',
        element: <ProtectedRoute allowedRoles={['seller']}><SellerReviewsPage /></ProtectedRoute>
      },
      {
        path: '/seller/store-preview',
        element: <ProtectedRoute allowedRoles={['seller']}><SellerStorePreviewPage /></ProtectedRoute>
      },
      {
        path: '/seller/notifications',
        element: <ProtectedRoute allowedRoles={['seller']}><SellerNotificationsPage /></ProtectedRoute>
      },
      {
        path: '/seller/profile',
        element: <ProtectedRoute allowedRoles={['seller']}><SellerStoreProfilePage /></ProtectedRoute>
      },

      // ── Admin ────────────────────────────────────────────────────────────────
      {
        path: '/admin',
        children: [
          { index: true, element: <AdminLoginPage /> },
          { path: 'dashboard',        element: <ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute> },
          { path: 'reports',          element: <ProtectedRoute adminOnly><Adminreportspage /></ProtectedRoute> },
          { path: 'sellers',          element: <ProtectedRoute adminOnly><ManageSellersPage /></ProtectedRoute> },
          { path: 'products',         element: <ProtectedRoute adminOnly><ManageProductsPage /></ProtectedRoute> },
          { path: 'categories',       element: <ProtectedRoute adminOnly><ManageCategoriesPage /></ProtectedRoute> },
          { path: 'flash-sales',      element: <ProtectedRoute adminOnly><AdminFlashSalesPage /></ProtectedRoute> },
          { path: 'flash-sale-requests', element: <ProtectedRoute adminOnly><AdminFlashSaleRequestsPage /></ProtectedRoute> },
          { path: 'remittance-requests', element: <ProtectedRoute adminOnly><AdminRemittanceRequestsPage /></ProtectedRoute> },
          { path: 'user-details/:id', element: <ProtectedRoute adminOnly><AdminUserDetailPage /></ProtectedRoute> },
          { path: 'product-approvals', element: <ProtectedRoute adminOnly><AdminProductApprovalsPage /></ProtectedRoute> },
          { path: 'orders',           element: <ProtectedRoute adminOnly><ManageOrdersPage /></ProtectedRoute> },
          { path: 'loans',            element: <ProtectedRoute adminOnly><ManageLoansPage /></ProtectedRoute> },
          { path: 'loan-settings',    element: <ProtectedRoute adminOnly><LoanSettingsPage /></ProtectedRoute> },
          { path: 'delivery-zones',   element: <ProtectedRoute adminOnly><DeliveryZonesPage /></ProtectedRoute> },
          { path: 'staff',            element: <ProtectedRoute adminOnly><ManageStaffPage /></ProtectedRoute> },
          { path: 'buyers',           element: <ProtectedRoute adminOnly><ManageBuyersPage /></ProtectedRoute> },
          { path: 'payments',         element: <ProtectedRoute adminOnly><AdminPaystackPage /></ProtectedRoute> },
          { path: 'settings',         element: <ProtectedRoute adminOnly><AdminSettingsPage /></ProtectedRoute> },
          { path: 'complaints',       element: <ProtectedRoute adminOnly><AdminComplaintsPage /></ProtectedRoute> },
          { path: 'complaints/:id',   element: <ProtectedRoute adminOnly><AdminComplaintDetailPage /></ProtectedRoute> },
          { path: 'audit-log',        element: <ProtectedRoute adminOnly><AdminAuditLogPage /></ProtectedRoute> },
          { path: 'review-moderation', element: <ProtectedRoute adminOnly><AdminReviewModerationPage /></ProtectedRoute> },
          { path: 'broadcasts',       element: <ProtectedRoute adminOnly><AdminBroadcastsPage /></ProtectedRoute> },
        ]
      },

      // ── Fallback ─────────────────────────────────────────────────────────────
      { path: '*', element: <Navigate to="/" replace /> },

    ] // end children of PullToRefreshLayout
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}