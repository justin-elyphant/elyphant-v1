
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import { useAuth } from "@/contexts/auth";
import { useUnifiedProfile } from "@/hooks/useUnifiedProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

const Dashboard = () => {
  const { user, signOut, isLoading } = useAuth();
  const { profile } = useUnifiedProfile();
  const navigate = useNavigate();
  const location = useLocation();
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

  return (
    <SidebarLayout>
      <div className="container max-w-6xl mx-auto py-3 sm:py-4 md:py-8 px-2 sm:px-3 md:px-4">
        {/* Welcome Header - Mobile Optimized */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 sm:mb-2 line-clamp-2">
            Welcome {firstName ? `${firstName} ` : ''}to Elyphant
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base line-clamp-2 sm:line-clamp-3">
            Your quick overview and access to all features. Click on any card to explore detailed functionality.
          </p>
        </div>
        
        <DashboardGrid />
      </div>
    </SidebarLayout>
  );
};

export default Dashboard;
