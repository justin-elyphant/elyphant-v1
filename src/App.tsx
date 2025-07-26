
import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/auth";
import { ProductProvider } from "./contexts/ProductContext";
import { ProfileProvider } from "./contexts/profile/ProfileContext";
import { CartProvider } from "./contexts/CartContext";
import { NotificationsProvider } from "./contexts/notifications/NotificationsContext";
import { EventsProvider } from "./components/gifting/events/context/EventsContext";
import { ThemeProvider } from "./contexts/theme/ThemeProvider";
import { usePerformanceMonitor } from "./utils/performanceMonitoring";
import { OnboardingFlowTester } from "./utils/onboardingFlowTester";

// Immediate load for critical pages
import Home from "./pages/Home";
import Auth from "./pages/Auth";

// Lazy load non-critical pages
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Profile = lazy(() => import("./pages/Profile"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Settings = lazy(() => import("./pages/Settings"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const OrderStatusDashboard = lazy(() => import("./pages/OrderStatusDashboard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Messages = lazy(() => import("./pages/Messages"));
const Chat = lazy(() => import("./pages/Chat"));
const Connections = lazy(() => import("./pages/Connections"));
const Wishlists = lazy(() => import("./pages/Wishlists"));
const StreamlinedProfileSetup = lazy(() => import("./pages/StreamlinedProfileSetup"));
const Trunkline = lazy(() => import("./pages/Trunkline"));

const queryClient = new QueryClient();

function App() {
  const { trackRender } = usePerformanceMonitor();
  
  useEffect(() => {
    const startTime = performance.now();
    console.log("App: Starting app initialization");
    
    // Initialize onboarding flow testing in development
    if (process.env.NODE_ENV === 'development') {
      console.log("🧪 Onboarding Flow Tester initialized");
      console.log("Available commands:");
      console.log("- testOnboardingFlow() - Test complete flow");
      console.log("- checkOnboardingState() - Check current state");
      console.log("- clearOnboardingState() - Clear localStorage");
      console.log("- testFlowRecovery() - Test recovery from all steps");
      console.log("- testNicoleAI() - Test Nicole AI connection");
    }
    
    // Preload critical resources for faster subsequent loads
    const preloadCriticalAssets = () => {
      // Add resource hints for better performance
      if (!document.querySelector('link[rel="dns-prefetch"][href*="supabase"]')) {
        const dnsLink = document.createElement('link');
        dnsLink.rel = 'dns-prefetch';
        dnsLink.href = 'https://dmkxtkvlispxeqfzlczr.supabase.co';
        document.head.appendChild(dnsLink);
      }
    };
    
    preloadCriticalAssets();
    
    return () => {
      trackRender("App", startTime);
    };
  }, [trackRender]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ProfileProvider>
            <CartProvider>
              <ProductProvider>
                <NotificationsProvider>
                  <EventsProvider>
                    <Router>
                      <div className="min-h-screen bg-background text-foreground">
                        <Suspense fallback={
                          <div className="min-h-screen flex items-center justify-center">
                            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                          </div>
                        }>
                          <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/orders" element={<Orders />} />
                            <Route path="/orders/:orderId" element={<OrderDetail />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/profile/:identifier" element={<Profile />} />
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/profile-setup" element={<StreamlinedProfileSetup />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/marketplace" element={<Marketplace />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/order-status" element={<OrderStatusDashboard />} />
                            <Route path="/messages" element={<Messages />} />
                            <Route path="/messages/:userId" element={<Chat />} />
                            <Route path="/connections" element={<Connections />} />
                            <Route path="/wishlists" element={<Wishlists />} />
                            <Route path="/trunkline/*" element={<Trunkline />} />
                            {/* Legacy route redirects */}
                            <Route path="/signin" element={<Auth />} />
                            <Route path="/signup" element={<Auth />} />
                          </Routes>
                        </Suspense>
                      </div>
                    </Router>
                  </EventsProvider>
                </NotificationsProvider>
              </ProductProvider>
            </CartProvider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
