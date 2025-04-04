
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
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
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Returns from "./pages/Returns";
import Connections from "./pages/Connections";
import ConnectionDetails from "./pages/ConnectionDetails";
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
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Index />} />
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
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:orderId" element={<OrderDetail />} />
                  <Route path="/returns/:orderId" element={<Returns />} />
                  <Route path="/connections" element={<Connections />} />
                  <Route path="/connection/:connectionId" element={<ConnectionDetails />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </ProductProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
