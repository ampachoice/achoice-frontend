
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

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
import LoanRepayPage    from './pages/buyer/LoanRepayPage';
import ProfilePage      from './pages/buyer/ProfilePage';
import NotificationsPage from './pages/buyer/NotificationsPage';
import ComplaintsPage  from './pages/buyer/ComplaintsPage';
import ComplaintDetailPage from './pages/buyer/ComplaintDetailPage';

// ── STAFF ────────────────────────────────────────────────────────────────────
import AgroStaffDashboard from './pages/staff/AgroStaffDashboard';
import LoanStaffDashboard from './pages/staff/LoanStaffDashboard';

// ── ADMIN ────────────────────────────────────────────────────────────────────
import AdminLoginPage     from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import Adminreportspage   from './pages/admin/Adminreportspage';
import ManageSellersPage  from './pages/admin/ManageSellersPage';
import ManageProductsPage from './pages/admin/ManageProductsPage';
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
import StaffComplaintsPage from './pages/staff/StaffComplaintsPage';
import StaffComplaintDetailPage from './pages/staff/StaffComplaintDetailPage';

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

  // ── Buyer (any logged-in user) ───────────────────────────────────────────────
  { path: '/products',    element: <ProtectedRoute><ProductPage /></ProtectedRoute> },
  { path: '/product/:id', element: <ProtectedRoute><ProductPage /></ProtectedRoute> },
  { path: '/cart',        element: <ProtectedRoute><CartPage /></ProtectedRoute> },
  { path: '/checkout',    element: <ProtectedRoute><CheckoutPage /></ProtectedRoute> },
  { path: '/orders',      element: <ProtectedRoute><OrderHistoryPage /></ProtectedRoute> },
  { path: '/loans/apply', element: <ProtectedRoute><LoanApplyPage /></ProtectedRoute> },
  { path: '/loans/repay', element: <ProtectedRoute><LoanRepayPage /></ProtectedRoute> },
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









