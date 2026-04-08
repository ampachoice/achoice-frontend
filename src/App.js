import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// --- AUTH PAGES ---
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// --- BUYER PAGES ---
import HomePage from './pages/HomePage'; // Public Landing
import ProductPage from './pages/buyer/ProductPage'; // Unified Product List & Detail
import CartPage from './pages/buyer/CartPage';
import CheckoutPage from './pages/buyer/CheckoutPage';
import OrderHistoryPage from './pages/buyer/OrderHistoryPage';
import LoanApplyPage from './pages/buyer/LoanApplyPage';
import LoanRepayPage from './pages/buyer/LoanRepayPage';

// --- ADMIN PAGES ---
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ManageSellersPage from './pages/admin/ManageSellersPage';
import ManageProductsPage from './pages/admin/ManageProductsPage';
import ManageOrdersPage from './pages/admin/ManageOrdersPage';
import ManageLoansPage from './pages/admin/ManageLoansPage';
import LoanSettingsPage from './pages/admin/LoanSettingsPage';


const router = createBrowserRouter([
  // --- PUBLIC ROUTES ---
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // --- BUYER ROUTES ---
  { path: '/products', element: <ProductPage /> },      // All Products (Shop)
  { path: '/product/:id', element: <ProductPage /> },   // Specific Product Detail
  { path: '/cart', element: <CartPage /> },
  { path: '/checkout', element: <CheckoutPage /> },
  { path: '/orders', element: <OrderHistoryPage /> },
  { path: '/loans/apply', element: <LoanApplyPage /> },
  { path: '/loans/repay', element: <LoanRepayPage /> },

  // --- ADMIN ROUTES ---
  {
    path: '/admin',
    children: [
      { index: true, element: <AdminLoginPage /> },     // /admin
      { path: 'dashboard', element: <AdminDashboardPage /> }, // /admin/dashboard
      { path: 'sellers', element: <ManageSellersPage /> },
      { path: 'products', element: <ManageProductsPage /> },
      { path: 'orders', element: <ManageOrdersPage /> },
      { path: 'loans', element: <ManageLoansPage /> },
      { path: '/admin/loan-settings', element: <LoanSettingsPage /> },
      { path: '/admin/dashboard', element: <AdminDashboardPage />} ,
    ]
  },

  // --- FALLBACK ---
  { path: '*', element: <Navigate to="/" replace /> }
]);

export default function App() {
  return <RouterProvider router={router} />;
}