import { createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router-dom';

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
import AdminFlashSalesPage from './pages/admin/AdminFlashSalesPage';
import AdminFlashSaleRequestsPage from './pages/admin/AdminFlashSaleRequestsPage';
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
import AdminProductApprovalsPage from './pages/admin/AdminProductApprovalsPage';
import StaffComplaintsPage from './pages/staff/StaffComplaintsPage';
import StaffComplaintDetailPage from './pages/staff/StaffComplaintDetailPage';

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

  // ── Public ──────────────────────────────────────────────────────────────────
  { path: '/',                element: <HomePage /> },
  { path: '/login',           element: <LoginPage /> },
  { path: '/register',        element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password',  element: <ResetPasswordPage /> },
  { path: '/change-password', element: <ChangePasswordPage /> },

  // ── Buyer ─────────────────────────────────────────────────────────────────
  // Product browsing is public — the backend already serves these routes
  // without auth (see routes/api.php "Public routes" block), and a
  // Jumia-style storefront should let guests browse and click through from
  // the landing page without being forced to log in first.
  { path: '/products',    element: <ProductPage /> },
  { path: '/product/:id', element: <ProductPage /> },
  { path: '/cart',        element: <ProtectedRoute><CartPage /></ProtectedRoute> },
  { path: '/checkout',    element: <ProtectedRoute><CheckoutPage /></ProtectedRoute> },
  { path: '/orders',      element: <ProtectedRoute><OrderHistoryPage /></ProtectedRoute> },
  { path: '/loans/apply', element: <ProtectedRoute><LoanApplyPage /></ProtectedRoute> },
  { path: '/loans',       element: <ProtectedRoute><LoansListPage /></ProtectedRoute> },
  // Old "My Loans" URL — redirect so any existing bookmarks/links still work
  { path: '/loans/repay', element: <RedirectToLoansPreservingQuery /> },
  { path: '/loans/:id', element: <ProtectedRoute><LoanDetailPage /></ProtectedRoute> },
  { path: '/loans/:id/liquidate', element: <ProtectedRoute><LoanLiquidatePage /></ProtectedRoute> },
  { path: '/loans/:id/schedule',  element: <ProtectedRoute><LoanSchedulePage /></ProtectedRoute> },
  { path: '/profile',     element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
  { path: '/notifications', element: <ProtectedRoute><NotificationsPage /></ProtectedRoute> },
  { path: '/complaints', element: <ProtectedRoute><ComplaintsPage /></ProtectedRoute> },
  { path: '/complaints/:id', element: <ProtectedRoute><ComplaintDetailPage /></ProtectedRoute> },

  // ── Staff ────────────────────────────────────────────────────────────────────
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

  // ── Seller ───────────────────────────────────────────────────────────────────
  // Batch 1 (Foundation): only Dashboard is fully built. The rest of the sidebar
  // nav points at a shared "coming soon" placeholder so nothing 404s while the
  // remaining batches (Products, Orders, Finance, Reviews, Store Profile) land —
  // see /areas/achoice-seller-dashboard.md for the batch plan.
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

  // ── Admin ────────────────────────────────────────────────────────────────────
  {
    path: '/admin',
    children: [
      { index: true, element: <AdminLoginPage /> },
      {
        path: 'dashboard',
        element: <ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute>
      },
      {
        path: 'reports',
        element: <ProtectedRoute adminOnly><Adminreportspage /></ProtectedRoute>
      },
      {
        path: 'sellers',
        element: <ProtectedRoute adminOnly><ManageSellersPage /></ProtectedRoute>
      },
      {
        path: 'products',
        element: <ProtectedRoute adminOnly><ManageProductsPage /></ProtectedRoute>
      },
      {
        path: 'flash-sales',
        element: <ProtectedRoute adminOnly><AdminFlashSalesPage /></ProtectedRoute>
      },
      {
        path: 'flash-sale-requests',
        element: <ProtectedRoute adminOnly><AdminFlashSaleRequestsPage /></ProtectedRoute>
      },
      {
        path: 'user-details/:id',
        element: <ProtectedRoute adminOnly><AdminUserDetailPage /></ProtectedRoute>
      },
      {
        path: 'product-approvals',
        element: <ProtectedRoute adminOnly><AdminProductApprovalsPage /></ProtectedRoute>
      },
      {
        path: 'orders',
        element: <ProtectedRoute adminOnly><ManageOrdersPage /></ProtectedRoute>
      },
      {
        path: 'loans',
        element: <ProtectedRoute adminOnly><ManageLoansPage /></ProtectedRoute>
      },
      {
        path: 'loan-settings',
        element: <ProtectedRoute adminOnly><LoanSettingsPage /></ProtectedRoute>
      },
      {
        path: 'delivery-zones',
        element: <ProtectedRoute adminOnly><DeliveryZonesPage /></ProtectedRoute>
      },
      {
        path: 'staff',
        element: <ProtectedRoute adminOnly><ManageStaffPage /></ProtectedRoute>
      },
      {
        path: 'buyers',
        element: <ProtectedRoute adminOnly><ManageBuyersPage /></ProtectedRoute>
      },
      {
        path: 'payments',
        element: <ProtectedRoute adminOnly><AdminPaystackPage /></ProtectedRoute>
      },
      {
        path: 'settings',  // ✅ lowercase
        element: <ProtectedRoute adminOnly><AdminSettingsPage /></ProtectedRoute>
      },
      {
        path: 'complaints',
        element: <ProtectedRoute adminOnly><AdminComplaintsPage /></ProtectedRoute>
      },
      {
        path: 'complaints/:id',
        element: <ProtectedRoute adminOnly><AdminComplaintDetailPage /></ProtectedRoute>
      },
      {
        path: 'audit-log',
        element: <ProtectedRoute adminOnly><AdminAuditLogPage /></ProtectedRoute>
      },
    ]
  },

  // ── Fallback ─────────────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
