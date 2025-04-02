
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Marketplace from "./pages/Marketplace";
import VendorSignup from "./pages/VendorSignup";
import VendorManagement from "./pages/VendorManagement";
import Gifting from "./pages/Gifting";
import Cart from "./pages/Cart";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import UserProfile from "./pages/UserProfile";
import Wishlists from "./pages/Wishlists";
import Events from "./pages/Events";
import { ProductProvider } from "./contexts/ProductContext";
import { CartProvider } from "./contexts/CartContext";

const App = () => {
  // Move QueryClient instantiation inside the component
  const queryClient = new QueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ProductProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/vendor-signup" element={<VendorSignup />} />
                <Route path="/vendor-portal" element={<VendorManagement />} />
                <Route path="/vendor-management" element={<VendorManagement />} />
                <Route path="/gifting" element={<Gifting />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile/:userId" element={<UserProfile />} />
                <Route path="/wishlists" element={<Wishlists />} />
                <Route path="/events" element={<Events />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </ProductProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
