
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ProtectedRoute = ({ 
  redirectPath = "/sign-in", 
  children 
}: {
  redirectPath?: string, 
  children: React.ReactNode
}) => {
  const { user, isLoading, isDebugMode } = useAuth();
  const location = useLocation();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
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

  // If still loading auth state or checking session, render loading indicator
  if (isLoading || isCheckingSession) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <span className="ml-3 text-lg">Loading your account...</span>
      </div>
    );
  }

  // Special case for profile-setup page - it's a protected route but we're more lenient
  if (location.pathname === '/profile-setup') {
    console.log("On profile setup page - Enhanced Logging", {
      newSignUp: isNewSignUp,
      rateLimited: isRateLimited,
      profileCompleted
    });
    
    // If profile is already completed and this isn't a new signup, redirect to dashboard
    if (profileCompleted && !isNewSignUp && user) {
      console.log("Profile already completed, redirecting to dashboard");
      return <Navigate to="/dashboard" replace />;
    }
    
    // If we have a user OR this is a rate limited signup OR this is a new signup, render the page
    if (user || isRateLimited || isNewSignUp) {
      console.log("Allowing access to profile setup");
      return <>{children}</>;
    }
  }

  // If no user and finished loading, redirect to login
  if (!user) {
    console.log("User not authenticated, redirecting to:", redirectPath);
    
    // Save the current path to redirect back after login
    localStorage.setItem("redirectAfterSignIn", location.pathname);
    return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
