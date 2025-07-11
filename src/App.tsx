
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProfileProvider } from "@/contexts/profile/ProfileContext";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import ScrollToTop from "@/components/layout/ScrollToTop";
import LegacyRouteHandler from "@/components/navigation/LegacyRouteHandler";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import SignUp from "./pages/SignUp";
import StreamlinedSignUp from "./pages/StreamlinedSignUp";
import SignIn from "./pages/SignIn";
import OAuthProfileCompletion from "./pages/OAuthProfileCompletion";
import Wishlists from "./pages/Wishlists";
import Dashboard from "./pages/Dashboard";
import ProfileSetup from "./pages/ProfileSetup";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Connections from "./pages/Connections";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import VendorPartner from "./pages/VendorPartner";
import AboutUs from "./pages/AboutUs";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import Trunkline from "./pages/Trunkline";
import Events from "./pages/Events";

import FAQ from "./pages/FAQ";
import SearchOptimizationMonitor from "./components/debug/SearchOptimizationMonitor";

const queryClient = new QueryClient();

// Initialize localStorage service on app start
LocalStorageService.initialize();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <ProfileProvider>
            <CartProvider>
              <LegacyRouteHandler>
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/signup" element={<StreamlinedSignUp />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/auth/oauth-complete" element={<OAuthProfileCompletion />} />
                <Route path="/wishlists" element={<Wishlists />} />
                <Route path="/dashboard" element={<Dashboard />} />
                {/* Legacy routes - deprecated */}
                <Route path="/signup-legacy" element={<SignUp />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:connectionId" element={<Messages />} />
                <Route path="/connections" element={<Connections />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/events" element={<Events />} />
                <Route path="/profile/:identifier" element={<Profile />} />
                <Route path="/vendor-partner" element={<VendorPartner />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-cancel" element={<PaymentCancel />} />
                <Route path="/help" element={<FAQ />} />
                <Route path="/contact" element={<AboutUs />} />
                <Route path="/returns" element={<FAQ />} />
                <Route path="/privacy" element={<AboutUs />} />
                <Route path="/terms" element={<AboutUs />} />
                <Route path="/careers" element={<AboutUs />} />
                <Route path="/press" element={<AboutUs />} />
                <Route path="/vendor-signup" element={<VendorPartner />} />
                <Route path="/vendor-login" element={<VendorPartner />} />
                <Route path="/trunkline-login" element={<Trunkline />} />
                <Route path="/trunkline" element={<Trunkline />} />
                </Routes>
                <SearchOptimizationMonitor />
              </LegacyRouteHandler>
            </CartProvider>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
