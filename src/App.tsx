
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
import SpecialDates from "./pages/SpecialDates";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import Profiles from "./pages/Profiles";
import Settings from "./pages/Settings";
import Cart from "./pages/Cart";
import CheckProfile from "./pages/CheckProfile";
import OrderHistory from "./pages/OrderHistory";
import OrderDetails from "./pages/OrderDetails";
import OrderReturn from "./pages/OrderReturn";
import VendorPortal from "./pages/VendorPortal";
import VendorLogin from "./pages/VendorLogin";
import Billing from "./pages/Billing";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import TrunklinePortal from "./pages/TrunklinePortal";
import TrunklineLogin from "./pages/TrunklineLogin";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Verification from "./pages/Verification";
import UserProfile from "./pages/UserProfile";
import SharedWishlist from "./pages/SharedWishlist";
import Connections from "./pages/Connections";
import TourGuide from "@/components/onboarding/TourGuide";
import Checkout from "./pages/Checkout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AuthProvider>
              <NotificationsProvider>
                <ProfileProvider>
                  <TourGuide />
                  <div className="min-h-screen bg-background font-sans antialiased">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/signup" element={<SignUp />} />
                      <Route path="/signin" element={<SignIn />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/verify" element={<Verification />} />
                      <Route path="/marketplace" element={<Marketplace />} />
                      <Route path="/shared-wishlist/:id" element={<SharedWishlist />} />
                      <Route path="/user/:userId" element={<UserProfile />} />
                      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/wishlists" element={<ProtectedRoute><Wishlists /></ProtectedRoute>} />
                      <Route path="/wishlist/:id" element={<ProtectedRoute><WishlistDetail /></ProtectedRoute>} />
                      <Route path="/special-dates" element={<ProtectedRoute><SpecialDates /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><Profiles /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                      <Route path="/check-profile" element={<ProtectedRoute><CheckProfile /></ProtectedRoute>} />
                      <Route path="/order-history" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
                      <Route path="/order/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
                      <Route path="/order/:id/return" element={<ProtectedRoute><OrderReturn /></ProtectedRoute>} />
                      <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
                      <Route path="/vendor" element={<VendorPortal />} />
                      <Route path="/vendor/login" element={<VendorLogin />} />
                      <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                      <Route path="/about" element={<AboutUs />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/trunkline" element={<TrunklinePortal />} />
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
