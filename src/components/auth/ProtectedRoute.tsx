
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = "/sign-in",
  children,
}) => {
  const { user, isLoading, isDebugMode } = useAuth();
  const location = useLocation();

  // If in debug mode, log that we're bypassing auth
  useEffect(() => {
    if (isDebugMode && !user) {
      console.log('🔧 Debug mode: ProtectedRoute would normally redirect, but bypassing');
    }
  }, [isDebugMode, user]);

  // If still loading auth state, render nothing 
  // (or could show a loading spinner here)
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If no user and finished loading, redirect to login
  // Unless we're in debug mode with auth bypass
  if (!user && !isDebugMode) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If there are children, render them, otherwise render the Outlet
  return <>{children ? children : <Outlet />}</>;
};

export default ProtectedRoute;
