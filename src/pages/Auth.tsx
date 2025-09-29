
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import UnifiedAuthView from "@/components/auth/unified/UnifiedAuthView";
import QuickInterestsModal from "@/components/auth/QuickInterestsModal";
import { useProfileRetrieval } from "@/hooks/profile/useProfileRetrieval";
const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const { profileData } = useProfileRetrieval();
  const [showQuickInterests, setShowQuickInterests] = useState(false);

  // Detect initial mode from URL parameters
  const mode = searchParams.get('mode') as 'signin' | 'signup' | null;
  const initialMode = mode || 'signup'; // Default to signup if no mode specified

  // Get pre-filled email from password reset navigation state
  const preFilledEmail = location.state?.email;

  // Handle post-signup interests modal and redirect
  useEffect(() => {
    if (user && !isLoading) {
      // Check if we should show the quick interests modal
      const shouldShowQuickInterests = localStorage.getItem("showQuickInterests") === "true";
      
      if (shouldShowQuickInterests) {
        // Wait for profile data to load before checking interests
        if (profileData !== null) {
          const hasNoInterests = !profileData.interests || profileData.interests.length === 0;
          const hasRedirect = searchParams.get('redirect');
          
          if (hasNoInterests && !hasRedirect) {
            // Clear the flag and show modal
            localStorage.removeItem("showQuickInterests");
            setShowQuickInterests(true);
            return;
          } else {
            // User already has interests or there's a redirect, skip modal
            localStorage.removeItem("showQuickInterests");
          }
        } else if (profileData === null) {
          // Still loading profile data, wait
          return;
        }
      }
      
      // Normal redirect flow
      const redirectPath = searchParams.get('redirect') || '/gifting';
      navigate(redirectPath, { replace: true });
    }
  }, [user, isLoading, profileData, navigate, searchParams]);

  const handleInterestsComplete = () => {
    // After interests are set (or skipped), redirect to gifting
    navigate('/gifting', { replace: true });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <UnifiedAuthView initialMode={preFilledEmail ? 'signin' : initialMode} preFilledEmail={preFilledEmail} />
      </div>
      
      {/* Quick Interests Modal */}
      <QuickInterestsModal
        isOpen={showQuickInterests}
        onClose={() => setShowQuickInterests(false)}
        onComplete={handleInterestsComplete}
      />
    </MainLayout>
  );
};

export default Auth;
