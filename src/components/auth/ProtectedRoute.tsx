
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

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
    console.log("ProtectedRoute - Navigation Debug:", {
      currentPath: location.pathname,
      user: user?.id,
      isLoading,
      isDebugMode,
      profileCompleted: localStorage.getItem("profileCompleted"),
      newSignUp: localStorage.getItem("newSignUp"),
      signupRateLimited: localStorage.getItem("signupRateLimited")
    });
  }, [user, location, isLoading, isDebugMode]);

  // Set up a timeout to prevent indefinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingUI(false);
    }, 2000); // Stop showing loading UI after 2 seconds max
    
    return () => clearTimeout(timer);
  }, []);

  // Additional check for rate limited signup
  const isRateLimited = localStorage.getItem("signupRateLimited") === "true";
  
  // Special handling for new signups
  const isNewSignUp = localStorage.getItem("newSignUp") === "true";
  const profileCompleted = localStorage.getItem("profileCompleted") === "true";

  // If in debug mode, bypass authentication check
  if (isDebugMode) {
    console.log('Debug mode enabled, bypassing authentication check');
    return <>{children}</>;
  }

  // Determine if we should still show loading state - only if actually loading and within timeout period
  const shouldShowLoading = isLoading && showLoadingUI;

  // If loading has timed out but we're on a protected route and don't have user info
  if (!shouldShowLoading && !isLoading && !user && location.pathname !== '/profile-setup') {
    // Save the current path to redirect back after login
    localStorage.setItem("redirectAfterSignIn", location.pathname);
    return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
  }

  // Special case for profile-setup page - it's a protected route but we're more lenient
  if (location.pathname === '/profile-setup') {
    console.log("On profile setup page - Enhanced Logging", {
      newSignUp: isNewSignUp,
      rateLimited: isRateLimited,
      profileCompleted,
      userExists: !!user
    });
    
    // If profile is already completed and this isn't a new signup, redirect to dashboard
    if (profileCompleted && !isNewSignUp && user) {
      console.log("Profile already completed, redirecting to dashboard");
      return <Navigate to="/dashboard" replace />;
    }
    
    // CRITICAL FIX: If we have a new signup flag, bypass normal auth checks and render immediately
    if (isNewSignUp) {
      console.log("New signup detected, allowing immediate access to profile setup");
      return <>{children}</>;
    }
    
    // If we have a user OR this is a rate limited signup, render the page
    if (user || isRateLimited) {
      console.log("Allowing access to profile setup");
      return <>{children}</>;
    }
  }

  // If still loading with active timeout, show a nicer loading UI
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
