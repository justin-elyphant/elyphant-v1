import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/auth";
import { ProductProvider } from "./contexts/ProductContext";
import { ProfileProvider } from "./contexts/profile/ProfileContext";
import { CartProvider } from "./contexts/CartContext";
import { NotificationsProvider } from "./contexts/notifications/NotificationsContext";
import { EventsProvider } from "./components/gifting/events/context/EventsContext";
import { ThemeProvider } from "./contexts/theme/ThemeProvider";
import { NicoleStateProvider } from "./contexts/nicole/NicoleStateContext";
import { usePerformanceMonitor } from "./utils/performanceMonitoring";
import { OnboardingFlowTester } from "./utils/onboardingFlowTester";
import { extractBudgetFromNicoleContext } from "@/services/marketplace/nicoleContextUtils";

// Import Nicole integration test for debugging
if (process.env.NODE_ENV === 'development') {
  import("./debug/nicole-integration-test");
  import("./debug/test-nicole-marketplace");
}

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
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const SMSConsent = lazy(() => import("./pages/SMSConsent"));

const Trunkline = lazy(() => import("./pages/Trunkline"));
const NicoleAutoGiftingTest = lazy(() => import("./components/auto-gifting/NicoleAutoGiftingTest"));
const NicoleAutoGiftingDashboard = lazy(() => import("./components/auto-gifting/NicoleAutoGiftingDashboard"));

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
                    <NicoleStateProvider>
                      <Router>
                        <AppContent />
                      </Router>
                    </NicoleStateProvider>
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

// Inner component that has access to useNavigate
function AppContent() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleNicoleSearch = (event: CustomEvent) => {
      console.log('🎯 Nicole search event received:', event.detail);
      const { searchQuery, nicoleContext } = (event as any).detail || {};
      if (searchQuery) {
        console.log('🚀 Navigating to marketplace with query:', searchQuery);

        // Build URL with Nicole context for proper filtering on marketplace
        const params = new URLSearchParams();
        params.set('search', String(searchQuery));
        params.set('source', 'nicole');

        // Persist full Nicole context (interests, budget, recipient, etc.)
        try {
          if (nicoleContext) {
            sessionStorage.setItem('nicole-search-context', JSON.stringify(nicoleContext));
            console.log('💰 Stored Nicole context in session storage:', nicoleContext);

            // Use robust extractor to derive budget from any Nicole context shape
            const { minPrice, maxPrice } = extractBudgetFromNicoleContext(nicoleContext as any);
            if (minPrice != null) params.set('minPrice', String(minPrice));
            if (maxPrice != null) params.set('maxPrice', String(maxPrice));

            // Legacy shapes as fallback (kept for backward compatibility)
            const budget = (nicoleContext as any).budget;
            if (Array.isArray(budget) && budget.length === 2) {
              const [min, max] = budget;
              if (typeof min === 'number') params.set('minPrice', String(min));
              if (typeof max === 'number') params.set('maxPrice', String(max));
            } else if (budget && typeof budget === 'object') {
              if (budget.minPrice != null) params.set('minPrice', String(budget.minPrice));
              if (budget.maxPrice != null) params.set('maxPrice', String(budget.maxPrice));
            }
            // Fallback if budget lives at root level
            if ((nicoleContext as any).minPrice != null) params.set('minPrice', String((nicoleContext as any).minPrice));
            if ((nicoleContext as any).maxPrice != null) params.set('maxPrice', String((nicoleContext as any).maxPrice));

            // Optional nicole metadata for debugging/filters
            if ((nicoleContext as any).recipient) params.set('recipient', String((nicoleContext as any).recipient));
            if ((nicoleContext as any).occasion) params.set('occasion', String((nicoleContext as any).occasion));
            if ((nicoleContext as any).interests && Array.isArray((nicoleContext as any).interests)) {
              params.set('interests', (nicoleContext as any).interests.join(','));
            }
            if ((nicoleContext as any).recipient_id) params.set('personId', String((nicoleContext as any).recipient_id));
            if ((nicoleContext as any).occasionType) params.set('occasionType', String((nicoleContext as any).occasionType));
          }
        } catch (e) {
          console.warn('Failed to persist Nicole context to session storage', e);
        }

        // Navigate to marketplace with all parameters
        navigate(`/marketplace?${params.toString()}`);
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
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/sms-consent" element={<SMSConsent />} />
          
          {/* Nicole Auto-Gifting Test Routes */}
          <Route path="/nicole-test" element={<NicoleAutoGiftingTest />} />
          <Route path="/nicole-dashboard" element={<NicoleAutoGiftingDashboard />} />
          
          <Route path="/trunkline/*" element={<Trunkline />} />
          {/* Legacy route redirects */}
          <Route path="/signin" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;