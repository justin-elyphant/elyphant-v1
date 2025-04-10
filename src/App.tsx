import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'sonner';

import { useAuth } from '@/contexts/auth';
import { Dashboard } from '@/pages/Dashboard';
import { Gifting } from '@/pages/Gifting';
import { Index } from '@/pages/Index';
import { Messages } from '@/pages/Messages';
import { NotFound } from '@/pages/NotFound';
import { OrderDetail } from '@/pages/OrderDetail';
import { Orders } from '@/pages/Orders';
import { ProfileSetup } from '@/pages/ProfileSetup';
import { Returns } from '@/pages/Returns';
import { Settings } from '@/pages/Settings';
import { SignIn } from '@/pages/SignIn';
import { SignUp } from '@/pages/SignUp';
import { VendorSignup } from '@/pages/VendorSignup';
import { Funding } from '@/pages/Funding';
import { FundingDetails } from '@/pages/FundingDetails';
import { FundingSuccess } from '@/pages/FundingSuccess';
import { Connections } from '@/pages/Connections';
import { ConnectionDetails } from '@/pages/ConnectionDetails';
import { Wishlists } from '@/pages/Wishlists';
import { Events } from '@/pages/Events';
import { Marketplace } from '@/pages/Marketplace';
import { Cart } from '@/pages/Cart';
import { PurchaseSuccess } from '@/pages/PurchaseSuccess';
import { Trunkline } from '@/pages/Trunkline';
import { VendorManagement } from '@/pages/VendorManagement';
import UserProfile from '@/pages/UserProfile';

const ProtectedRoute = ({
  redirectPath = '/sign-in',
  children,
}: {
  redirectPath?: string;
  children: React.ReactNode;
}) => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoggedIn && location.pathname !== redirectPath) {
      window.location.href = `${redirectPath}?redirect=${location.pathname}`;
    }
  }, [isLoggedIn, location, redirectPath]);

  return isLoggedIn ? <>{children}</> : null;
};

function App() {
  return (
    <>
      <Toaster position="bottom-center" />
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route element={<ProtectedRoute redirectPath="/sign-in" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderDetail />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/funding" element={<Funding />} />
            <Route path="/funding/:campaignId" element={<FundingDetails />} />
            <Route path="/funding/success" element={<FundingSuccess />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/connections/:connectionId" element={<ConnectionDetails />} />
            <Route path="/wishlists" element={<Wishlists />} />
            <Route path="/gifting" element={<Gifting />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/events" element={<Events />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/purchase/success" element={<PurchaseSuccess />} />
          </Route>
          <Route path="/vendor/signup" element={<VendorSignup />} />
          <Route path="/trunkline" element={
            <ProtectedRoute redirectPath="/sign-in">
              <Trunkline />
            </ProtectedRoute>
          } />
          <Route path="/vendor" element={
            <ProtectedRoute redirectPath="/sign-in">
              <VendorManagement />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
