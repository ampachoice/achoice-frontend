import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Buyer */}
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/loans/apply" element={<LoanApplyPage />} />
        <Route path="/loans/repay" element={<LoanRepayPage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/sellers" element={<ManageSellersPage />} />
        <Route path="/admin/products" element={<ManageProductsPage />} />
        <Route path="/admin/orders" element={<ManageOrdersPage />} />
        <Route path="/admin/loans" element={<ManageLoansPage />} />
      </Routes>
    </BrowserRouter>
  );
}