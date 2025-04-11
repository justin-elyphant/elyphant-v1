
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";

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

  // If in debug mode, bypass authentication
  if (isDebugMode) {
    console.log("Debug mode enabled, bypassing authentication check");
    return <>{children}</>;
  }

  // If still loading auth state, render loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg">Loading...</span>
      </div>
    );
  }

  // If no user and finished loading, redirect to login
  if (!user) {
    console.log("User not authenticated, redirecting to:", redirectPath, "from:", location.pathname);
    
    // Special case: If we're coming from the signup page, we should redirect to profile setup
    // This is a fallback in case other redirects failed
    if (location.pathname.includes('/sign-up')) {
      console.log("Coming from signup page, redirecting to profile setup instead");
      return <Navigate to="/profile-setup" replace />;
    }
    
    // Save the current path to redirect back after login
    return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
