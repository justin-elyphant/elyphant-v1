
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/auth";
import { Toaster } from "sonner";

// Import pages
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Marketplace from "@/pages/Marketplace";
import Settings from "@/pages/Settings";
import SignUp from "@/pages/SignUp";
import Login from "@/pages/Login";
import ProductDetails from "@/pages/ProductDetails";
import Connections from "@/pages/Connections";
import Gifting from "@/pages/Gifting";
import SharedWishlist from "@/pages/SharedWishlist";
import Returns from "@/pages/Returns";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import TrunklineAccess from "@/pages/TrunklineAccess";
import GiftScheduling from "@/pages/GiftScheduling";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ScrollToTop from "@/components/layout/ScrollToTop";

// Import styles
import "./App.css";
import "./styles/ios-optimizations.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen bg-background font-sans antialiased">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/shared-wishlist/:shareToken" element={<SharedWishlist />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/connections" element={
                <ProtectedRoute>
                  <Connections />
                </ProtectedRoute>
              } />
              <Route path="/gifting" element={
                <ProtectedRoute>
                  <Gifting />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/returns" element={
                <ProtectedRoute>
                  <Returns />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              } />
              <Route path="/orders/:orderId" element={
                <ProtectedRoute>
                  <OrderDetail />
                </ProtectedRoute>
              } />
              <Route path="/gift-scheduling" element={
                <ProtectedRoute>
                  <GiftScheduling />
                </ProtectedRoute>
              } />
              <Route path="/trunkline" element={
                <ProtectedRoute requiredRole="admin">
                  <TrunklineAccess />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
          <Toaster position="top-center" />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
