
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth";
import { ProductProvider } from "@/contexts/ProductContext";
import { ThemeProvider } from "next-themes";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Page imports
import Index from "@/pages/Index";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import EmailVerification from "@/pages/EmailVerification";
import Marketplace from "@/pages/Marketplace";
import Gifting from "@/pages/Gifting";
import MyWishlists from "@/pages/MyWishlists";
import SharedWishlist from "@/pages/SharedWishlist";
import Events from "@/pages/Events";
import Connections from "@/pages/Connections";
import Orders from "@/pages/Orders";
import Returns from "@/pages/Returns";
import Dashboard from "@/pages/Dashboard";
import GiftScheduling from "@/pages/GiftScheduling";
import Crowdfunding from "@/pages/Crowdfunding";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <AuthProvider>
            <ProductProvider>
              <Router>
                <div className="min-h-screen bg-background">
                  <Routes>
                    {/* Auth routes without MainLayout */}
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/email-verification" element={<EmailVerification />} />
                    
                    {/* All other routes wrapped in MainLayout */}
                    <Route path="/" element={<MainLayout><Index /></MainLayout>} />
                    <Route path="/marketplace" element={<MainLayout><Marketplace /></MainLayout>} />
                    <Route path="/gifting" element={<MainLayout><Gifting /></MainLayout>} />
                    <Route path="/my-wishlists" element={
                      <ProtectedRoute>
                        <MainLayout><MyWishlists /></MainLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/wishlist/:id" element={<MainLayout><SharedWishlist /></MainLayout>} />
                    <Route path="/events" element={
                      <ProtectedRoute>
                        <MainLayout><Events /></MainLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/connections" element={
                      <ProtectedRoute>
                        <MainLayout><Connections /></MainLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/orders" element={
                      <ProtectedRoute>
                        <MainLayout><Orders /></MainLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/returns/:orderId" element={
                      <ProtectedRoute>
                        <MainLayout><Returns /></MainLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <MainLayout><Dashboard /></MainLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/gift-scheduling" element={
                      <ProtectedRoute>
                        <MainLayout><GiftScheduling /></MainLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/crowdfunding" element={
                      <ProtectedRoute>
                        <MainLayout><Crowdfunding /></MainLayout>
                      </ProtectedRoute>
                    } />
                  </Routes>
                </div>
                <Toaster />
              </Router>
            </ProductProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
