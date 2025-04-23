import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth';
import Dashboard from '@/pages/Dashboard';
import SignUp from '@/pages/SignUp';
import SignIn from '@/pages/SignIn';
import ForgotPassword from '@/pages/ForgotPassword';
import UpdatePassword from '@/pages/UpdatePassword';
import ProfileSetup from '@/pages/ProfileSetup';
import Settings from '@/pages/Settings';
import Connections from '@/pages/Connections';
import Gifting from '@/pages/Gifting';
import Marketplace from '@/pages/Marketplace';
import Wishlists from '@/pages/Wishlists';
import { ProfileProvider } from '@/contexts/profile/ProfileContext';
import { ProductProvider } from '@/contexts/ProductContext';
import { CartProvider } from '@/contexts/CartContext';
import Cart from '@/pages/Cart';
import UserProfile from '@/pages/UserProfile';
import MainLayout from '@/components/layout/MainLayout';
import Index from '@/pages/Index';
import Messages from '@/pages/Messages'; 
import Trunkline from '@/pages/Trunkline'; 
import VendorManagement from '@/pages/VendorManagement';
import VendorSignup from '@/pages/VendorSignup';
import VendorPartner from '@/pages/VendorPartner';
import TrunklineLoginPage from '@/pages/TrunklineLoginPage';
import VendorLoginPage from '@/pages/VendorLoginPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProfileProvider>
          <ProductProvider>
            <CartProvider>
              <Routes>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/connections" element={<Connections />} />
                  <Route path="/gifting" element={<Gifting />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/wishlists" element={<Wishlists />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/profile/:userId" element={<UserProfile />} />
                  <Route path="/messages/:connectionId?" element={<Messages />} /> 
                  <Route path="/trunkline" element={<Trunkline />} />
                  <Route path="/vendor-management" element={<VendorManagement />} />
                  <Route path="/vendor-signup" element={<VendorSignup />} />
                  <Route path="/vendor-partner" element={<VendorPartner />} />
                </Route>
                <Route path="/signup" element={<SignUp />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/update-password" element={<UpdatePassword />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/trunkline-login" element={<TrunklineLoginPage />} />
                <Route path="/vendor-login" element={<VendorLoginPage />} />
              </Routes>
            </CartProvider>
          </ProductProvider>
        </ProfileProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
