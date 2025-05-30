
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/theme/ThemeProvider";
import { AuthProvider } from "@/contexts/auth/AuthProvider";
import { NotificationsProvider } from "@/contexts/notifications/NotificationsContext";
import { ProfileProvider } from "@/contexts/profile/ProfileContext";
import "./App.css";
import ScrollToTop from "@/components/layout/ScrollToTop";

// Pages
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Wishlists from "./pages/Wishlists";
import WishlistDetail from "./pages/WishlistDetail";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import Settings from "./pages/Settings";
import Cart from "./pages/Cart";
import VendorLogin from "./pages/VendorLogin";
import AboutUs from "./pages/AboutUs";
import TrunklineLogin from "./pages/TrunklineLogin";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SharedWishlist from "./pages/SharedWishlist";
import Connections from "./pages/Connections";
import Checkout from "./pages/Checkout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AuthProvider>
              <NotificationsProvider>
                <ProfileProvider>
                  <div className="min-h-screen bg-background font-sans antialiased">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/signup" element={<SignUp />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/marketplace" element={<Marketplace />} />
                      <Route path="/shared-wishlist/:id" element={<SharedWishlist />} />
                      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/wishlists" element={<ProtectedRoute><Wishlists /></ProtectedRoute>} />
                      <Route path="/wishlist/:id" element={<ProtectedRoute><WishlistDetail /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                      <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
                      <Route path="/vendor/login" element={<VendorLogin />} />
                      <Route path="/about" element={<AboutUs />} />
                      <Route path="/trunkline/login" element={<TrunklineLogin />} />
                    </Routes>
                  </div>
                  <Toaster />
                </ProfileProvider>
              </NotificationsProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
