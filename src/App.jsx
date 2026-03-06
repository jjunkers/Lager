import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StatsProvider } from './context/StatsContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RegionInventory from './pages/RegionInventory';
import Reports from './pages/Reports';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import ChangePassword from './pages/ChangePassword';
import Catalog from './pages/Catalog';
import Orders from './pages/Orders';
import Ordered from './pages/Ordered';
import Admin from './pages/Admin';
import CreateOrder from './pages/CreateOrder';
import MyOrders from './pages/MyOrders';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force password change if required - and NOT already on the change-password page
  const isChangePasswordPage = location.pathname === '/change-password';
  if (user.requireChangePassword && !isChangePasswordPage) {
    return <Navigate to="/change-password" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    // Special case for superuser, user and reports
    const isReportsPage = location.pathname.includes('/reports');
    if ((user.role === 'superuser' || user.role === 'user') && isReportsPage) {
      return children;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

// Route only accessible when change password is required
const ChangePasswordRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/change-password" element={
        <ChangePasswordRoute>
          <ChangePassword />
        </ChangePasswordRoute>
      } />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="reports" element={
          <ProtectedRoute requireAdmin={true}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="inventory/:region" element={<RegionInventory />} />
        <Route path="users" element={
          <ProtectedRoute requireAdmin={true}>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="orders" element={
          <ProtectedRoute requireAdmin={true}>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="ordered" element={
          <ProtectedRoute requireAdmin={true}>
            <Ordered />
          </ProtectedRoute>
        } />
        <Route path="admin" element={
          <ProtectedRoute requireAdmin={true}>
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="catalog" element={
          <ProtectedRoute requireAdmin={true}>
            <Catalog />
          </ProtectedRoute>
        } />
        <Route path="create-order" element={
          <ProtectedRoute>
            <CreateOrder />
          </ProtectedRoute>
        } />
        <Route path="my-orders" element={
          <ProtectedRoute>
            <MyOrders />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StatsProvider>
          <AppContent />
        </StatsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
