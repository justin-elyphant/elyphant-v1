import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/auth";
import { ProductProvider } from "./contexts/ProductContext";
import { ProfileProvider } from "./contexts/profile/ProfileContext";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import Marketplace from "./pages/Marketplace";
import Settings from "./pages/Settings";
import OrderDetail from "./pages/OrderDetail";
import OrderStatusDashboard from "./pages/OrderStatusDashboard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <ProductProvider>
            <Router>
              <div className="min-h-screen bg-background text-foreground">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:orderId" element={<OrderDetail />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/order-status" element={<OrderStatusDashboard />} />
                </Routes>
              </div>
            </Router>
          </ProductProvider>
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
