
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

// Layouts
import MainLayout from "@/components/layout/MainLayout";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import StreamlinedSignUp from "./pages/StreamlinedSignUp";
import SignIn from "./pages/SignIn";
import OAuthProfileCompletion from "./pages/OAuthProfileCompletion";
import ProfileSetupWithIntent from "./pages/ProfileSetupWithIntent";
import Wishlists from "./pages/Wishlists";
import Dashboard from "./pages/Dashboard";

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
import Payments from "./pages/Payments";

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
                {/* Routes without sidebar */}
                <Route path="/" element={<MainLayout><Index /></MainLayout>} />
                <Route path="/marketplace" element={<MainLayout><Marketplace /></MainLayout>} />
                <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />
                <Route path="/checkout" element={<MainLayout><Checkout /></MainLayout>} />
                <Route path="/signup" element={<MainLayout><StreamlinedSignUp /></MainLayout>} />
                <Route path="/signin" element={<MainLayout><SignIn /></MainLayout>} />
                <Route path="/auth/oauth-complete" element={<MainLayout><OAuthProfileCompletion /></MainLayout>} />
                <Route path="/profile-setup" element={<MainLayout><ProfileSetupWithIntent /></MainLayout>} />
                <Route path="/vendor-partner" element={<MainLayout><VendorPartner /></MainLayout>} />
                <Route path="/about" element={<MainLayout><AboutUs /></MainLayout>} />
                <Route path="/payment-success" element={<MainLayout><PaymentSuccess /></MainLayout>} />
                <Route path="/payment-cancel" element={<MainLayout><PaymentCancel /></MainLayout>} />
                <Route path="/help" element={<MainLayout><FAQ /></MainLayout>} />
                <Route path="/contact" element={<MainLayout><AboutUs /></MainLayout>} />
                <Route path="/returns" element={<MainLayout><FAQ /></MainLayout>} />
                <Route path="/privacy" element={<MainLayout><AboutUs /></MainLayout>} />
                <Route path="/terms" element={<MainLayout><AboutUs /></MainLayout>} />
                <Route path="/careers" element={<MainLayout><AboutUs /></MainLayout>} />
                <Route path="/press" element={<MainLayout><AboutUs /></MainLayout>} />
                <Route path="/vendor-signup" element={<MainLayout><VendorPartner /></MainLayout>} />
                <Route path="/vendor-login" element={<MainLayout><VendorPartner /></MainLayout>} />
                <Route path="/trunkline-login" element={<MainLayout><Trunkline /></MainLayout>} />
                <Route path="/trunkline" element={<MainLayout><Trunkline /></MainLayout>} />
                
                {/* Routes with sidebar */}
                <Route path="/dashboard" element={<SidebarLayout><Dashboard /></SidebarLayout>} />
                <Route path="/messages" element={<SidebarLayout><Messages /></SidebarLayout>} />
                <Route path="/messages/:connectionId" element={<SidebarLayout><Messages /></SidebarLayout>} />
                <Route path="/connections" element={<SidebarLayout><Connections /></SidebarLayout>} />
                <Route path="/wishlists" element={<SidebarLayout><Wishlists /></SidebarLayout>} />
                <Route path="/orders" element={<SidebarLayout><Orders /></SidebarLayout>} />
                <Route path="/settings" element={<SidebarLayout><Settings /></SidebarLayout>} />
                <Route path="/payments" element={<SidebarLayout><Payments /></SidebarLayout>} />
                <Route path="/events" element={<SidebarLayout><Events /></SidebarLayout>} />
                <Route path="/profile/:identifier" element={<SidebarLayout><Profile /></SidebarLayout>} />
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
