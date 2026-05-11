import {
  createBrowserRouter,
  RouterProvider,
  Navigate
} from 'react-router-dom';

// AUTH
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// BUYER
import HomePage from './pages/HomePage';
import ProductPage from './pages/buyer/ProductPage';
import CartPage from './pages/buyer/CartPage';
import CheckoutPage from './pages/buyer/CheckoutPage';
import OrderHistoryPage from './pages/buyer/OrderHistoryPage';
import LoanApplyPage from './pages/buyer/LoanApplyPage';
import LoanRepayPage from './pages/buyer/LoanRepayPage';
import ProfilePage from './pages/buyer/ProfilePage';

// ADMIN
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ManageSellersPage from './pages/admin/ManageSellersPage';
import ManageProductsPage from './pages/admin/ManageProductsPage';
import ManageOrdersPage from './pages/admin/ManageOrdersPage';
import ManageLoansPage from './pages/admin/ManageLoansPage';
import LoanSettingsPage from './pages/admin/LoanSettingsPage';
import DeliveryZonesPage from './pages/admin/DeliveryZonesPage';

// PROTECTED ROUTE
import ProtectedRoute from './components/common/ProtectedRoute';

const router = createBrowserRouter([

  // =========================
  // PUBLIC ROUTES
  // =========================
  {
    path: '/',
    element: <HomePage />
  },

  {
    path: '/login',
    element: <LoginPage />
  },

  {
    path: '/register',
    element: <RegisterPage />
  },

  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />
  },

  {
    path: '/reset-password',
    element: <ResetPasswordPage />
  },

  // =========================
  // BUYER ROUTES
  // =========================
  {
    path: '/products',
    element: (
      <ProtectedRoute>
        <ProductPage />
      </ProtectedRoute>
    )
  },

  {
    path: '/product/:id',
    element: (
      <ProtectedRoute>
        <ProductPage />
      </ProtectedRoute>
    )
  },

  {
    path: '/cart',
    element: (
      <ProtectedRoute>
        <CartPage />
      </ProtectedRoute>
    )
  },

  {
    path: '/checkout',
    element: (
      <ProtectedRoute>
        <CheckoutPage />
      </ProtectedRoute>
    )
  },

  {
    path: '/orders',
    element: (
      <ProtectedRoute>
        <OrderHistoryPage />
      </ProtectedRoute>
    )
  },

  {
    path: '/loans/apply',
    element: (
      <ProtectedRoute>
        <LoanApplyPage />
      </ProtectedRoute>
    )
  },

  {
    path: '/loans/repay',
    element: (
      <ProtectedRoute>
        <LoanRepayPage />
      </ProtectedRoute>
    )
  },

  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    )
  },

  // =========================
  // ADMIN ROUTES
  // =========================
  {
    path: '/admin',
    children: [

      {
        index: true,
        element: <AdminLoginPage />
      },

      {
        path: 'dashboard',
        element: (
          <ProtectedRoute adminOnly>
            <AdminDashboardPage />
          </ProtectedRoute>
        )
      },

      {
        path: 'sellers',
        element: (
          <ProtectedRoute adminOnly>
            <ManageSellersPage />
          </ProtectedRoute>
        )
      },

      {
        path: 'products',
        element: (
          <ProtectedRoute adminOnly>
            <ManageProductsPage />
          </ProtectedRoute>
        )
      },

      {
        path: 'orders',
        element: (
          <ProtectedRoute adminOnly>
            <ManageOrdersPage />
          </ProtectedRoute>
        )
      },

      {
        path: 'loans',
        element: (
          <ProtectedRoute adminOnly>
            <ManageLoansPage />
          </ProtectedRoute>
        )
      },

      {
        path: 'loan-settings',
        element: (
          <ProtectedRoute adminOnly>
            <LoanSettingsPage />
          </ProtectedRoute>
        )
      },

      {
        path: 'delivery-zones',
        element: (
          <ProtectedRoute adminOnly>
            <DeliveryZonesPage />
          </ProtectedRoute>
        )
      }
    ]
  },

  // =========================
  // FALLBACK
  // =========================
  {
    path: '*',
    element: <Navigate to="/" replace />
  }

]);

export default function App() {
  return <RouterProvider router={router} />;
}