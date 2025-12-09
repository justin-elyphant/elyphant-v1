import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import { useAuth } from "@/contexts/auth";
import { useUnifiedProfile } from "@/hooks/useUnifiedProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import { useIsMobile } from "@/hooks/use-mobile";
import UnifiedShopperHeader from "@/components/navigation/UnifiedShopperHeader";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OverviewTab from "@/components/dashboard/tabs/OverviewTab";
import AutoGiftsTab from "@/components/dashboard/tabs/AutoGiftsTab";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion, AnimatePresence } from "framer-motion";

const Dashboard = () => {
  const { user, signOut, isLoading } = useAuth();
  const { profile } = useUnifiedProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profileLoading, setProfileLoading] = useState(true);
  const [localLoadingTimeout, setLocalLoadingTimeout] = useState(true);
  
  // Get active tab from URL param, default to overview
  const activeTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoadingTimeout(false);
      setProfileLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Clear any residual onboarding state when loading dashboard
  useEffect(() => {
    if (user) {
      console.log("Dashboard loaded - cleaning up onboarding state");
      
      // Check if we have completion state that should be cleared
      const completionState = LocalStorageService.getProfileCompletionState();
      if (completionState?.step === 'completed') {
        console.log("Clearing completed onboarding state");
        LocalStorageService.clearProfileCompletionState();
      }
      
      // Clear any Nicole context from onboarding
      const nicoleContext = LocalStorageService.getNicoleContext();
      if (nicoleContext?.source === 'profile-setup' || nicoleContext?.source === 'onboarding') {
        console.log("Clearing onboarding Nicole context");
        LocalStorageService.clearNicoleContext();
      }
    }
  }, [user]);
  
  // Only redirect if we're actually on the dashboard route and there's no user
  useEffect(() => {
    console.log('Dashboard.tsx Effect: user, isLoading, localLoadingTimeout, location', { 
      user, 
      isLoading, 
      localLoadingTimeout,
      pathname: location.pathname 
    });
    
    // Only handle redirects if we're actually on the dashboard page
    if (location.pathname === '/dashboard' && !user && !isLoading && !localLoadingTimeout) {
      console.log("No user in Dashboard, redirecting to sign-in (after timeout/loading)");
      navigate("/signin", { replace: true });
    } else if (!isLoading && user) {
      setProfileLoading(false);
    }
  }, [user, navigate, isLoading, localLoadingTimeout, location.pathname]);

  // If still loading or waiting for timeout, show skeleton
  if (isLoading || localLoadingTimeout || profileLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // At this point, loading/timeouts are resolved. If still no user and on dashboard, let useEffect redirect.
  if (!user && !isLoading && !localLoadingTimeout && location.pathname === '/dashboard') return null;

  // Get first name from profile
  const firstName = profile?.first_name || profile?.name?.split(' ')[0] || user?.user_metadata?.first_name;

  // Get time of day greeting
  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  };
  
  const timeOfDay = getTimeOfDayGreeting();

  // Mobile-first layout optimization
  if (isMobile) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden">
        {/* Always render Header for mobile */}
        <UnifiedShopperHeader mode="main" />
        
        {/* Mobile dashboard content */}
        <div className="ios-scroll" style={{ height: 'calc(100vh - 80px)' }}>
          <ResponsiveContainer 
            fullWidthOnMobile={true} 
            maxWidth="full" 
            padding="minimal"
            className="mobile-content-spacing safe-area-bottom"
          >
            {/* Mobile Account Header - Optimized */}
            <div className="mb-4 px-2">
              <div className="flex flex-col gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-foreground mb-1 line-clamp-1">
                    Good {timeOfDay}{firstName ? `, ${firstName}` : ''}
                  </h1>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    How can we help you gift today? Explore gifting, social connections, and more.
                  </p>
                </div>
              </div>
            </div>
            
            {/* iOS-style Tabs */}
            <Tabs value={activeTab} onValueChange={(tab) => {
              triggerHapticFeedback('selection');
              setSearchParams({ tab });
            }} className="w-full">
              <TabsList className="w-full rounded-full bg-muted p-1 mb-4 min-h-[44px]">
                <TabsTrigger value="overview" className="flex-1 rounded-full min-h-[40px]">Overview</TabsTrigger>
                <TabsTrigger value="auto-gifts" className="flex-1 rounded-full min-h-[40px]">AI Gifting</TabsTrigger>
              </TabsList>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <TabsContent value="overview" forceMount={activeTab === 'overview' ? true : undefined} className={activeTab !== 'overview' ? 'hidden' : ''}>
                    <OverviewTab />
                  </TabsContent>
                  
                  <TabsContent value="auto-gifts" forceMount={activeTab === 'auto-gifts' ? true : undefined} className={activeTab !== 'auto-gifts' ? 'hidden' : ''}>
                    <AutoGiftsTab />
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Desktop layout with SidebarLayout
  return (
    <SidebarLayout>
      <div className="w-full max-w-none sm:max-w-6xl mx-auto py-3 sm:py-4 md:py-8 px-3 sm:px-4 md:px-6">
        {/* Account Header - Desktop */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 sm:mb-2 line-clamp-2">
                Good {timeOfDay}{firstName ? `, ${firstName}` : ''}
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base line-clamp-2 sm:line-clamp-3">
                How can we help you gift today? Explore gifting, social connections, and more.
              </p>
            </div>
          </div>
        </div>
        
        {/* iOS-style Tabs */}
        <Tabs value={activeTab} onValueChange={(tab) => {
          triggerHapticFeedback('selection');
          setSearchParams({ tab });
        }} className="w-full">
          <TabsList className="w-full max-w-2xl rounded-full bg-muted p-1 mb-6 min-h-[44px]">
            <TabsTrigger value="overview" className="flex-1 rounded-full min-h-[40px]">Overview</TabsTrigger>
            <TabsTrigger value="auto-gifts" className="flex-1 rounded-full min-h-[40px]">AI Gifting</TabsTrigger>
          </TabsList>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <TabsContent value="overview" forceMount={activeTab === 'overview' ? true : undefined} className={activeTab !== 'overview' ? 'hidden' : ''}>
                <OverviewTab />
              </TabsContent>
              
              <TabsContent value="auto-gifts" forceMount={activeTab === 'auto-gifts' ? true : undefined} className={activeTab !== 'auto-gifts' ? 'hidden' : ''}>
                <AutoGiftsTab />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </SidebarLayout>
  );
};

export default Dashboard;
