
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProfileProvider } from "@/contexts/profile/ProfileContext";
import ScrollToTop from "@/components/layout/ScrollToTop";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Wishlists from "./pages/Wishlists";
import Dashboard from "./pages/Dashboard";
import ProfileSetup from "./pages/ProfileSetup";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import SearchOptimizationMonitor from "./components/debug/SearchOptimizationMonitor";

const queryClient = new QueryClient();

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
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/wishlists" element={<Wishlists />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile/:identifier" element={<Profile />} />
                {/* Add other routes as needed */}
              </Routes>
              <SearchOptimizationMonitor />
            </CartProvider>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
