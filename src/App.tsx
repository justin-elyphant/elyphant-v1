import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/auth";
import { ProductProvider } from "./contexts/ProductContext";
import { ProfileProvider } from "./contexts/profile/ProfileContext";
import { CartProvider } from "./contexts/CartContext";
import { NotificationsProvider } from "./contexts/notifications/NotificationsContext";
import { EventsProvider } from "./components/gifting/events/context/EventsContext";
import { ThemeProvider } from "./contexts/theme/ThemeProvider";
import { NicoleStateProvider } from "./contexts/nicole/NicoleStateContext";
import { QueryProvider } from "./providers/QueryProvider";
import { usePerformanceMonitor } from "./utils/performanceMonitoring";
import { OnboardingFlowTester } from "./utils/onboardingFlowTester";
import { EmployeeRouteGuard } from "./components/auth/EmployeeRouteGuard";
import { EmployeeRedirectHandler } from "./components/auth/EmployeeRedirectHandler";
import { Toaster } from "@/components/ui/toaster";


// Immediate load for critical pages
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import MobileBottomNavigation from "./components/navigation/MobileBottomNavigation";

// Lazy load non-critical pages
const SearchPage = lazy(() => import("./pages/SearchPage"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));

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
const ConnectionDetail = lazy(() => import("./pages/ConnectionDetail"));
const Wishlists = lazy(() => import("./pages/Wishlists"));
const SharedWishlist = lazy(() => import("./pages/SharedWishlist"));
const StreamlinedProfileSetup = lazy(() => import("./pages/StreamlinedProfileSetup"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const SMSConsent = lazy(() => import("./pages/SMSConsent"));
const AutoGiftApprovalPage = lazy(() => import("./components/auto-gifts/AutoGiftApprovalPage"));

// New dedicated feature pages
const GiftingHub = lazy(() => import("./pages/GiftingHub"));
const Nicole = lazy(() => import("./pages/Nicole"));
const Account = lazy(() => import("./pages/Account"));
const Social = lazy(() => import("./pages/Social"));
const ProfileComplete = lazy(() => import("./pages/ProfileComplete"));

const Trunkline = lazy(() => import("./pages/Trunkline"));
const TrunklineLogin = lazy(() => import("./pages/TrunklineLogin"));
const NicoleAutoGiftingTest = lazy(() => import("./components/auto-gifting/NicoleAutoGiftingTest"));
const NicoleAutoGiftingDashboard = lazy(() => import("./components/auto-gifting/NicoleAutoGiftingDashboard"));
const TestZMAOrder = lazy(() => import("./pages/TestZMAOrder"));

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
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <ProfileProvider>
            <CartProvider>
              <ProductProvider>
                <NotificationsProvider>
                  <EventsProvider>
                    <NicoleStateProvider>
                      <Router>
                        <EmployeeRouteGuard>
                          <EmployeeRedirectHandler />
                          <AppContent />
                        </EmployeeRouteGuard>
                      </Router>
                    </NicoleStateProvider>
                  </EventsProvider>
                </NotificationsProvider>
              </ProductProvider>
            </CartProvider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

// Inner component that has access to useNavigate
function AppContent() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleNicoleSearch = (event: CustomEvent) => {
      console.log('🎯 Nicole search event received:', event.detail);
      const { searchQuery } = event.detail;
      if (searchQuery) {
        console.log('🚀 Navigating to marketplace with query:', searchQuery);
        // Navigate to marketplace with search query
        navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
      } else {
        console.warn('⚠️ No searchQuery in event detail:', event.detail);
      }
    };

    console.log('📡 Setting up nicole-search event listener');
    window.addEventListener('nicole-search', handleNicoleSearch as EventListener);
    
    return () => {
      console.log('🧹 Removing nicole-search event listener');
      window.removeEventListener('nicole-search', handleNicoleSearch as EventListener);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Import at top level */}
      <MobileBottomNavigation />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <Route path="/search" element={<SearchPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* New dedicated feature pages */}
          <Route path="/gifting" element={<GiftingHub />} />
          <Route path="/events" element={<GiftingHub />} />
          <Route path="/nicole" element={<Nicole />} />
          <Route path="/account" element={<Navigate to="/settings" replace />} />
          <Route path="/social" element={<Social />} />
          <Route path="/profile/complete" element={<ProfileComplete />} />
          
          <Route path="/profile-setup" element={<StreamlinedProfileSetup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/order-status" element={<OrderStatusDashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:userId" element={<Chat />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/connection/:connectionId" element={<ConnectionDetail />} />
          <Route path="/wishlists" element={<Wishlists />} />
          <Route path="/wishlist/:wishlistId" element={<SharedWishlist />} />
          <Route path="/shared-wishlist/:wishlistId" element={<SharedWishlist />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/sms-consent" element={<SMSConsent />} />
          <Route path="/auto-gift-approval" element={<AutoGiftApprovalPage />} />
          <Route path="/auto-gifts/approve/:token" element={<AutoGiftApprovalPage />} />
          
          {/* Nicole Auto-Gifting Test Routes */}
          <Route path="/nicole-test" element={<NicoleAutoGiftingTest />} />
          <Route path="/nicole-dashboard" element={<NicoleAutoGiftingDashboard />} />
          
          {/* ZMA Testing Routes */}
          <Route path="/test-zma-order" element={<TestZMAOrder />} />
          
           <Route path="/trunkline-login" element={<TrunklineLogin />} />
           <Route path="/trunkline" element={<Trunkline />} />
           <Route path="/trunkline/orders" element={<Trunkline />} />
           <Route path="/trunkline/customers" element={<Trunkline />} />
           <Route path="/trunkline/support" element={<Trunkline />} />
           <Route path="/trunkline/returns" element={<Trunkline />} />
           <Route path="/trunkline/amazon" element={<Trunkline />} />
           <Route path="/trunkline/business-payments" element={<Trunkline />} />
           <Route path="/trunkline/zinc" element={<Trunkline />} />
           <Route path="/trunkline/zinc-debugger" element={<Trunkline />} />
           <Route path="/trunkline/vendors" element={<Trunkline />} />
           <Route path="/trunkline/analytics" element={<Trunkline />} />
           <Route path="/trunkline/monitoring" element={<Trunkline />} />
           <Route path="/trunkline/scaling" element={<Trunkline />} />
           <Route path="/trunkline/production-hardening" element={<Trunkline />} />
           <Route path="/trunkline/communications/email-templates" element={<Trunkline />} />
           <Route path="/trunkline/communications/email-analytics" element={<Trunkline />} />
          {/* Legacy route redirects */}
          <Route path="/signin" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
        </Routes>
      </Suspense>
      <Toaster />
      
    </div>
  );
}

export default App;