import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import SellerApply from './pages/SellerApply';
import AdminDashboard from './pages/AdminDashboard';
import SellerDashboard from './pages/SellerDashboard';
import StudentDashboard from './pages/StudentDashboard';
import NotFound from './pages/NotFound';
import ChatAssistant from './pages/ChatAssistant';
import ProtectedRoute from './components/Layout/ProtectedRoute';

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/products/:slug" element={<ProductDetail />} />
      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="/student" element={<ProtectedRoute roles={["student","seller","admin"]}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/seller/apply" element={<ProtectedRoute roles={["student","seller","admin"]}><SellerApply /></ProtectedRoute>} />
      <Route path="/seller/dashboard" element={<ProtectedRoute roles={["seller","admin"]}><SellerDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/assistant" element={<ProtectedRoute><ChatAssistant /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
      <Route path="/logout" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default Router;
