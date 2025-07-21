import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClient } from "react-query";
import { AuthProvider } from "./contexts/auth";
import { ProductProvider } from "./contexts/ProductContext";
import { ElementsProvider } from "./contexts/ElementsContext";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Returns from "./pages/Returns";
import ReturnsDetail from "./pages/ReturnsDetail";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Marketplace from "./pages/Marketplace";
import Settings from "./pages/Settings";
import OrderDetail from "./pages/OrderDetail";
import ReturnsCreate from "./pages/ReturnsCreate";
import Trunkline from "./pages/Trunkline";
import Tracking from "./pages/Tracking";
import OrderStatusDashboard from "./pages/OrderStatusDashboard";

function App() {
  return (
    <QueryClient>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:productId" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderDetail />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/returns/create/:orderId" element={<ReturnsCreate />} />
            <Route path="/returns/:returnId" element={<ReturnsDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/trunkline" element={<Trunkline />} />
            <Route path="/tracking/:orderId" element={<Tracking />} />
            <Route path="/order-status" element={<OrderStatusDashboard />} />
          </Routes>
        </div>
      </Router>
    </QueryClient>
  );
}

export default App;
