
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/profile/ProfileContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/theme/ThemeProvider";
import Index from "@/pages/Index";
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/SignUp";
import EmailVerification from "@/pages/EmailVerification";
import Dashboard from "@/pages/Dashboard";
import ProfileSetup from "@/pages/ProfileSetup";
import Settings from "@/pages/Settings";
import Connections from "@/pages/Connections";
import Messages from "@/pages/Messages";
import Marketplace from "@/pages/Marketplace";
import Checkout from "@/pages/Checkout";
import Gifting from "@/pages/Gifting";
import Events from "@/pages/Events";
import Profile from "@/pages/Profile";
import SharedWishlist from "@/pages/SharedWishlist";
import Wishlists from "@/pages/Wishlists";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/NotFound";
import GiftScheduling from "@/pages/GiftScheduling";
import Crowdfunding from "@/pages/Crowdfunding";
import ZincIntegration from "@/pages/ZincIntegration";
import Cart from "@/pages/Cart";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <ProfileProvider>
                <CartProvider>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/sign-in" element={<SignIn />} />
                    <Route path="/sign-up" element={<SignUp />} />
                    <Route path="/email-verification" element={<EmailVerification />} />
                    
                    {/* Protected Routes */}
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
                    
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/connections" element={
                      <ProtectedRoute>
                        <Connections />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/messages" element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/messages/:connectionId" element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/marketplace" element={
                      <ProtectedRoute>
                        <Marketplace />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/checkout" element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/cart" element={
                      <ProtectedRoute>
                        <Cart />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/gifting" element={
                      <ProtectedRoute>
                        <Gifting />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/events" element={
                      <ProtectedRoute>
                        <Events />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/wishlists" element={
                      <ProtectedRoute>
                        <Wishlists />
                      </ProtectedRoute>
                    } />
                    
                    {/* Updated unified profile route - handles both username and userId */}
                    <Route path="/profile/:identifier" element={<Profile />} />
                    
                    <Route path="/shared-wishlist/:shareId" element={<SharedWishlist />} />
                    
                    <Route path="/gift-scheduling" element={
                      <ProtectedRoute>
                        <GiftScheduling />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/crowdfunding" element={
                      <ProtectedRoute>
                        <Crowdfunding />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/zinc-integration" element={
                      <ProtectedRoute>
                        <ZincIntegration />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </CartProvider>
              </ProfileProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
