
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/auth";
import { CartProvider } from "./contexts/CartContext";
import MainLayout from "@/components/layout/MainLayout";
import Home from "@/pages/Index";
import Login from "@/pages/SignIn";
import Register from "@/pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Profile from "@/pages/UserProfile";
import Marketplace from "./pages/Marketplace";
import Gifting from "./pages/Gifting";
import Wishlists from "@/pages/Wishlists";
import SharedWishlist from "@/pages/SharedWishlist";
import Cart from "@/pages/Cart";

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Routes that should use the main layout with header and footer */}
            <Route path="/" element={<MainLayout><Home /></MainLayout>} />
            <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/user/:userId" element={<MainLayout><Profile /></MainLayout>} />
            <Route path="/user/me" element={<MainLayout><Profile /></MainLayout>} />
            <Route path="/marketplace" element={<MainLayout><Marketplace /></MainLayout>} />
            <Route path="/gifting" element={<MainLayout><Gifting /></MainLayout>} />
            <Route path="/wishlists" element={<MainLayout><Wishlists /></MainLayout>} />
            <Route path="/shared-wishlist/:wishlistId" element={<MainLayout><SharedWishlist /></MainLayout>} />
            <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />
            
            {/* Authentication routes don't need the main layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
