
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth";
import { CartProvider } from "@/contexts/CartContext";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/auth/SignIn";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Profile from "./pages/Profile";
import Gifting from "./pages/Gifting";
import Wishlists from "./pages/Wishlists";
import SharedWishlist from "./pages/SharedWishlist";
import CreateWishlist from "./pages/CreateWishlist";
import GiftScheduling from "./pages/GiftScheduling";
import Connections from "./pages/Connections";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import OrderTracking from "./pages/OrderTracking";
import Crowdfunding from "./pages/Crowdfunding";
import Trunkline from "./pages/Trunkline";
import TrunklineLoginPage from "./pages/TrunklineLogin";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/gifting" element={<Gifting />} />
                <Route path="/wishlists" element={<Wishlists />} />
                <Route path="/wishlist/:id" element={<SharedWishlist />} />
                <Route path="/create-wishlist" element={<CreateWishlist />} />
                <Route path="/gift-scheduling" element={<GiftScheduling />} />
                <Route path="/connections" element={<Connections />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:orderId" element={<OrderDetail />} />
                <Route path="/order-tracking/:orderId?" element={<OrderTracking />} />
                <Route path="/crowdfunding" element={<Crowdfunding />} />
                <Route path="/trunkline" element={<Trunkline />} />
                <Route path="/trunkline-login" element={<TrunklineLoginPage />} />
              </Routes>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
