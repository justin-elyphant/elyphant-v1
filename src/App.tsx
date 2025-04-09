
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
import Marketplace from './pages/Marketplace'; // Import the Marketplace component
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
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Index />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/purchase-success" element={<PurchaseSuccess />} />
                <Route path="/funding-success" element={<FundingSuccess />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
              </Route>
              
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
