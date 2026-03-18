import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Buyer
import HomePage from './pages/buyer/HomePage';
import ProductPage from './pages/buyer/ProductPage';
import CartPage from './pages/buyer/CartPage';
import CheckoutPage from './pages/buyer/CheckoutPage';
import OrderHistoryPage from './pages/buyer/OrderHistoryPage';
import LoanApplyPage from './pages/buyer/LoanApplyPage';
import LoanRepayPage from './pages/buyer/LoanRepayPage';

// Admin
import AdminLoginPage from './pages/admin/AdminLoginPage';
import ManageSellersPage from './pages/admin/ManageSellersPage';
import ManageProductsPage from './pages/admin/ManageProductsPage';
import ManageOrdersPage from './pages/admin/ManageOrdersPage';
import ManageLoansPage from './pages/admin/ManageLoansPage';

const router = createBrowserRouter([
  // Auth
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // Buyer
  { path: '/', element: <HomePage /> },
  { path: '/product/:id', element: <ProductPage /> },
  { path: '/cart', element: <CartPage /> },
  { path: '/checkout', element: <CheckoutPage /> },
  { path: '/orders', element: <OrderHistoryPage /> },
  { path: '/loans/apply', element: <LoanApplyPage /> },
  { path: '/loans/repay', element: <LoanRepayPage /> },

  // Admin
  { path: '/admin', element: <AdminLoginPage /> },
  { path: '/admin/sellers', element: <ManageSellersPage /> },
  { path: '/admin/products', element: <ManageProductsPage /> },
  { path: '/admin/orders', element: <ManageOrdersPage /> },
  { path: '/admin/loans', element: <ManageLoansPage /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}