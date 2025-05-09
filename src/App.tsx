
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/auth";
import Home from "@/pages/Index";
import Login from "@/pages/SignIn";
import Register from "@/pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Profile from "@/pages/UserProfile";
import Marketplace from "./pages/Marketplace";
import Gifting from "./pages/Gifting";
import Wishlists from "@/pages/Wishlists";
import SharedWishlist from "@/pages/SharedWishlist";

function App() {
  const { isLoading } = useAuth();
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
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/user/:userId" element={<Profile />} />
        <Route path="/user/me" element={<Profile />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/gifting" element={<Gifting />} />
        <Route path="/wishlists" element={<Wishlists />} />
        <Route path="/shared-wishlist/:wishlistId" element={<SharedWishlist />} />
      </Routes>
    </Router>
  );
}

export default App;
