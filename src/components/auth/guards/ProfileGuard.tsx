import React from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/hooks/profile/useProfile";
import { Navigate, useLocation } from "react-router-dom";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

interface ProfileGuardProps {
  children: React.ReactNode;
  requireComplete?: boolean;
}

/**
 * ProfileGuard ensures users have completed mandatory profile fields
 * before accessing protected features
 */
const ProfileGuard: React.FC<ProfileGuardProps> = ({ 
  children, 
  requireComplete = true 
}) => {
  const { user } = useAuth();
  const { profile, loading: isLoading } = useProfile();
  const location = useLocation();

  // Allow access if not requiring completion
  if (!requireComplete) {
    return <>{children}</>;
  }

  // Show loading while checking profile
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if profile is complete - ALL fields are mandatory
  const isProfileComplete = profile && 
    profile.first_name?.trim() && 
    profile.last_name?.trim() && 
    profile.email?.trim() && 
    profile.username?.trim() && 
    profile.birth_year && 
    profile.dob &&
    profile.profile_image?.trim();

  // If profile is incomplete, redirect to OAuth completion or signup
  if (!isProfileComplete) {
    // Check if this is an OAuth user needing completion
    if (user?.app_metadata?.provider && user.app_metadata.provider !== 'email') {
      return <Navigate to="/auth/oauth-complete" replace />;
    }
    
    // Otherwise redirect to signup with current path as redirect
    const redirectPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/signup?redirect=${encodeURIComponent(redirectPath)}`} replace />;
  }

  // Mark profile as completed in localStorage
  if (isProfileComplete && !LocalStorageService.isProfileSetupCompleted()) {
    LocalStorageService.markProfileSetupCompleted();
  }

  return <>{children}</>;
};

export default ProfileGuard;
