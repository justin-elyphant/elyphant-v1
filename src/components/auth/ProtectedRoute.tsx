
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProtectedRouteProps {
  redirectPath?: string;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = "/sign-in",
  children,
}) => {
  const { user, isLoading, isDebugMode } = useAuth();
  const location = useLocation();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [freshUser, setFreshUser] = useState<any>(null);
  
  // Special handling for new signups
  const isNewSignUp = localStorage.getItem("newSignUp") === "true";
  const profileCompleted = localStorage.getItem("profileCompleted") === "true";

  // Check for fresh session - useful right after signup
  useEffect(() => {
    const checkFreshSession = async () => {
      // Only do this extra check if the auth context shows no user
      if (!user && !isDebugMode) {
        console.log("No user in auth context, checking for fresh session");
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          console.log("Fresh session found:", data.session.user.email);
          setFreshUser(data.session.user);
          // Store user ID in localStorage for reliability
          localStorage.setItem("userId", data.session.user.id);
          localStorage.setItem("userEmail", data.session.user.email || '');
        } else {
          console.log("No session found during fresh check");
          
          // If we're on profile setup but have no session, check if it's a new signup
          if (location.pathname === '/profile-setup' && isNewSignUp) {
            toast.warning("Please sign in to complete your profile setup");
          }
        }
      }
      
      setIsCheckingSession(false);
    };
    
    checkFreshSession();
  }, [user, isDebugMode, location.pathname, isNewSignUp]);

  // If in debug mode, bypass authentication
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
    console.log("On profile setup page - new signup:", isNewSignUp, "profile completed:", profileCompleted);
    
    // If profile is already completed and this isn't a new signup, redirect to dashboard
    if (profileCompleted && !isNewSignUp && (user || freshUser)) {
      console.log("Profile already completed, redirecting to dashboard");
      return <Navigate to="/dashboard" replace />;
    }
    
    // If we have a user OR this is a new signup, render the page
    if (user || freshUser || isNewSignUp) {
      return <>{children}</>;
    }
  }

  // Consider both the auth context user and any fresh session user
  const effectiveUser = user || freshUser;

  // If no user and finished loading, redirect to login
  if (!effectiveUser) {
    console.log("User not authenticated, redirecting to:", redirectPath, "from:", location.pathname);
    
    // Save the current path to redirect back after login
    localStorage.setItem("redirectAfterSignIn", location.pathname);
    return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
