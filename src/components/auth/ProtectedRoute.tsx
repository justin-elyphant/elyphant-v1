import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

const ProtectedRoute = ({ 
  redirectPath = "/sign-in", 
  children 
}: {
  redirectPath?: string, 
  children: React.ReactNode
}) => {
  const { user, isLoading, isDebugMode } = useAuth();
  const location = useLocation();
  const [showLoadingUI, setShowLoadingUI] = useState(true);
  
  // Enhanced logging for debugging navigation
  useEffect(() => {
    const profileState = LocalStorageService.getProfileCompletionState();
    console.log("ProtectedRoute - Navigation Debug:", {
      currentPath: location.pathname,
      user: user?.id,
      isLoading,
      isDebugMode,
      profileSetupCompleted: LocalStorageService.isProfileSetupCompleted(),
      profileCompletionState: profileState
    });
  }, [user, location, isLoading, isDebugMode]);

  // Set up a timeout to prevent indefinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingUI(false);
    }, 2000); // Stop showing loading UI after 2 seconds max
    
    return () => clearTimeout(timer);
  }, []);

  // Check for various auth states using new service
  const profileState = LocalStorageService.getProfileCompletionState();
  const isNewSignUp = profileState?.step !== 'completed';
  const profileCompleted = LocalStorageService.isProfileSetupCompleted();

  // If in debug mode, bypass authentication check
  if (isDebugMode) {
    console.log('Debug mode enabled, bypassing authentication check');
    return <>{children}</>;
  }

  // Determine if we should still show loading state
  const shouldShowLoading = isLoading && showLoadingUI;

  // If loading has timed out but we're on a protected route and don't have user info
  if (!shouldShowLoading && !isLoading && !user && location.pathname !== '/profile-setup') {
    // Save the current path using LocalStorageService context
    LocalStorageService.setNicoleContext({ 
      currentPage: location.pathname,
      source: 'protected_route_redirect'
    });
    return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
  }

  // Special case for profile-setup page
  if (location.pathname === '/profile-setup') {
    console.log("On profile setup page - Enhanced Logging", {
      newSignUp: isNewSignUp,
      profileCompleted,
      profileState,
      userExists: !!user
    });
    
    // If profile is completed and this isn't a new signup, redirect to dashboard
    if (profileCompleted && !isNewSignUp && user) {
      console.log("Profile already completed, redirecting to dashboard");
      return <Navigate to="/dashboard" replace />;
    }
    
    // If we have a new signup flag, bypass normal auth checks
    if (isNewSignUp) {
      console.log("New signup detected, allowing access");
      return <>{children}</>;
    }
  }

  // If still loading with active timeout, show loading UI
  if (shouldShowLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading your account...</h2>
          <p className="text-gray-500 text-center">
            We're retrieving your information. This will only take a moment.
          </p>
        </div>
      </div>
    );
  }
  
  // If loading has timed out but we have user info or special conditions, render children
  return <>{children}</>;
};

export default ProtectedRoute;
