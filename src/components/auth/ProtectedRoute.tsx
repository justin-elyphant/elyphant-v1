
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";

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

  // Check for fresh session - useful right after signup when auth context might not be updated yet
  useEffect(() => {
    const checkFreshSession = async () => {
      // Only do this extra check if the auth context shows no user
      if (!user && !isDebugMode) {
        console.log("No user in auth context, checking for fresh session");
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          console.log("Fresh session found:", data.session.user.email);
          setFreshUser(data.session.user);
        } else {
          console.log("No session found during fresh check");
        }
      }
      setIsCheckingSession(false);
    };
    
    checkFreshSession();
  }, [user, isDebugMode]);

  // If in debug mode, bypass authentication
  if (isDebugMode) {
    console.log("Debug mode enabled, bypassing authentication check");
    return <>{children}</>;
  }

  // If still loading auth state or checking session, render loading indicator
  if (isLoading || isCheckingSession) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg">Loading...</span>
      </div>
    );
  }

  // Consider both the auth context user and any fresh session user
  const effectiveUser = user || freshUser;

  // Special case for profile-setup page - it's a protected route but we're more lenient
  if (location.pathname === '/profile-setup') {
    console.log("On profile setup page, being more lenient with auth checks");
    if (!effectiveUser) {
      // Try one more refresh before redirecting
      console.log("No user detected for profile setup, trying one final session refresh");
      supabase.auth.refreshSession().then(({ data }) => {
        if (data.session) {
          console.log("Session found after refresh, reloading page");
          window.location.reload();
        } else {
          console.log("Still no session after refresh, redirecting to sign-in");
        }
      });
      
      // Show loading state while refreshing
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3 text-lg">Checking authentication...</span>
        </div>
      );
    }
    return <>{children}</>;
  }

  // If no user and finished loading, redirect to login
  if (!effectiveUser) {
    console.log("User not authenticated, redirecting to:", redirectPath, "from:", location.pathname);
    
    // Save the current path to redirect back after login
    return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
