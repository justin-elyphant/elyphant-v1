
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import { useAuth } from "@/contexts/auth";
import { useUnifiedProfile } from "@/hooks/useUnifiedProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import { useIsMobile } from "@/hooks/use-mobile";
import UnifiedShopperHeader from "@/components/navigation/UnifiedShopperHeader";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

const Dashboard = () => {
  const { user, signOut, isLoading } = useAuth();
  const { profile } = useUnifiedProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [profileLoading, setProfileLoading] = useState(true);
  const [localLoadingTimeout, setLocalLoadingTimeout] = useState(true);

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

  // Get first name from auth metadata or profile
  const firstName = user?.user_metadata?.first_name;

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
                    {firstName ? `${firstName}'s Account` : 'My Account'}
                  </h1>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    Your central hub for all Elyphant features
                  </p>
                </div>
              </div>
            </div>
            
            <DashboardGrid />
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
                {firstName ? `${firstName}'s Account` : 'My Account'}
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base line-clamp-2 sm:line-clamp-3">
                Your central hub for all Elyphant features. Explore gifting, social connections, and more.
              </p>
            </div>
            {profile && (
              <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-foreground">
                    {profile.display_name || `${firstName || 'User'}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user?.email}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DashboardGrid />
      </div>
    </SidebarLayout>
  );
};

export default Dashboard;
