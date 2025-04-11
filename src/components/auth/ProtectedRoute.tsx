
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
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Check for fresh session - useful right after signup when auth context might not be updated yet
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkFreshSession = async () => {
      // Only do this extra check if the auth context shows no user
      if (!user && !isDebugMode) {
        console.log("No user in auth context, checking for fresh session");
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          console.log("Fresh session found:", data.session.user.email);
          setFreshUser(data.session.user);
          setIsCheckingSession(false);
        } else {
          console.log("No session found during fresh check");
          
          // If we're on the profile setup page and still don't have a session,
          // try a few more times with increasing delays
          if (location.pathname === '/profile-setup' && retryCount < maxRetries) {
            const nextRetry = retryCount + 1;
            setRetryCount(nextRetry);
            console.log(`Retry ${nextRetry}/${maxRetries}: Will check session again in ${nextRetry * 500}ms`);
            
            timeoutId = setTimeout(() => {
              checkFreshSession();
            }, nextRetry * 500); // Increasing delay for each retry
            return;
          }
          
          setIsCheckingSession(false);
        }
      } else {
        setIsCheckingSession(false);
      }
    };
    
    checkFreshSession();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, isDebugMode, location.pathname, retryCount]);

  // If in debug mode, bypass authentication
  if (isDebugMode) {
    console.log('Debug mode enabled, bypassing authentication check');
    return <>{children}</>;
  }

  // If still loading auth state or checking session, render loading indicator
  if ((isLoading || isCheckingSession) && retryCount < maxRetries) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <span className="ml-3 text-lg">Loading your account...</span>
        {retryCount > 0 && (
          <p className="text-gray-500 mt-2 text-center">
            Check {retryCount}/{maxRetries}...
          </p>
        )}
      </div>
    );
  }

  // Consider both the auth context user and any fresh session user
  const effectiveUser = user || freshUser;

  // Special case for profile-setup page - it's a protected route but we're more lenient
  if (location.pathname === '/profile-setup') {
    console.log("On profile setup page, being more lenient with auth checks");
    
    // If we have a user, render the page
    if (effectiveUser) {
      console.log("User verified for profile setup:", effectiveUser.email);
      return <>{children}</>;
    }
    
    // If we've exceeded retry count and still have no user, redirect
    if (retryCount >= maxRetries) {
      console.log("Maximum session checks exceeded, redirecting to sign-in");
      return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
    }
    
    // Default to showing children since we're on profile setup
    // This is important for the flow right after signup
    console.log("Session checks complete but no user found. Showing profile setup anyway for post-signup flow");
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
