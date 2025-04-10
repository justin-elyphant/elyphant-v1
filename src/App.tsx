
import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'sonner';

import { useAuth } from '@/contexts/auth';
import { ProductProvider } from '@/contexts/ProductContext';
import Dashboard from '@/pages/Dashboard';
import Gifting from '@/pages/Gifting';
import Index from '@/pages/Index';
import Messages from '@/pages/Messages';
import NotFound from '@/pages/NotFound';
import OrderDetail from '@/pages/OrderDetail';
import Orders from '@/pages/Orders';
import ProfileSetup from '@/pages/ProfileSetup';
import Returns from '@/pages/Returns';
import Settings from '@/pages/Settings';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import VendorSignup from '@/pages/VendorSignup';
import Funding from '@/pages/Funding';
import FundingDetails from '@/pages/FundingDetails';
import FundingSuccess from '@/pages/FundingSuccess';
import Connections from '@/pages/Connections';
import ConnectionDetails from '@/pages/ConnectionDetails';
import Wishlists from '@/pages/Wishlists';
import Events from '@/pages/Events';
import Marketplace from '@/pages/Marketplace';
import Cart from '@/pages/Cart';
import PurchaseSuccess from '@/pages/PurchaseSuccess';
import Trunkline from '@/pages/Trunkline';
import VendorManagement from '@/pages/VendorManagement';
import UserProfile from '@/pages/UserProfile';

interface ProtectedRouteProps {
  redirectPath?: string;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/sign-in',
  children,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user && location.pathname !== redirectPath) {
      window.location.href = `${redirectPath}?redirect=${location.pathname}`;
    }
  }, [user, location, redirectPath]);

  return user ? <>{children}</> : null;
};

function App() {
  return (
    <>
      <Toaster position="bottom-center" />
      <ProductProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile-setup" element={
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            } />
            <Route path="/profile/:userId" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="/orders/:orderId" element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            } />
            <Route path="/returns" element={
              <ProtectedRoute>
                <Returns />
              </ProtectedRoute>
            } />
            <Route path="/funding" element={
              <ProtectedRoute>
                <Funding />
              </ProtectedRoute>
            } />
            <Route path="/funding/:campaignId" element={
              <ProtectedRoute>
                <FundingDetails />
              </ProtectedRoute>
            } />
            <Route path="/funding/success" element={
              <ProtectedRoute>
                <FundingSuccess />
              </ProtectedRoute>
            } />
            <Route path="/connections" element={
              <ProtectedRoute>
                <Connections />
              </ProtectedRoute>
            } />
            <Route path="/connections/:connectionId" element={
              <ProtectedRoute>
                <ConnectionDetails />
              </ProtectedRoute>
            } />
            <Route path="/wishlists" element={
              <ProtectedRoute>
                <Wishlists />
              </ProtectedRoute>
            } />
            <Route path="/gifting" element={
              <ProtectedRoute>
                <Gifting />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            } />
            <Route path="/marketplace" element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/cart" element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            } />
            <Route path="/purchase/success" element={
              <ProtectedRoute>
                <PurchaseSuccess />
              </ProtectedRoute>
            } />
            <Route path="/vendor/signup" element={<VendorSignup />} />
            <Route path="/trunkline" element={
              <ProtectedRoute>
                <Trunkline />
              </ProtectedRoute>
            } />
            <Route path="/vendor" element={
              <ProtectedRoute>
                <VendorManagement />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ProductProvider>
    </>
  );
}

export default App;
