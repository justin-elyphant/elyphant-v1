
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import Settings from './pages/Settings';
import PurchaseSuccess from './pages/PurchaseSuccess';
import FundingSuccess from './pages/FundingSuccess';
import Marketplace from './pages/Marketplace';
import UserProfile from './pages/UserProfile';
import VendorManagement from './pages/VendorManagement';
import Trunkline from './pages/Trunkline';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/auth';
import { CartProvider } from './contexts/CartContext';
import { ProductProvider } from './contexts/ProductContext';
import DebugPanel from './components/debug/DebugPanel';
import MainLayout from './components/layout/MainLayout';
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ProductProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Index />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/purchase-success" element={<PurchaseSuccess />} />
                <Route path="/funding-success" element={<FundingSuccess />} />
                <Route path="/vendor-portal" element={<VendorManagement />} />
                
                {/* Public profile route */}
                <Route path="/user/:userId" element={<UserProfile />} />
                
                {/* Protected routes within MainLayout */}
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* Protected standalone routes */}
              <Route path="/profile-setup" element={
                <ProtectedRoute>
                  <ProfileSetup />
                </ProtectedRoute>
              } />

              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              {/* Internal Trunkline dashboard */}
              <Route path="/trunkline" element={
                <ProtectedRoute>
                  <Trunkline />
                </ProtectedRoute>
              } />
            </Routes>
            
            <Toaster />
            <DebugPanel />
          </ProductProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
