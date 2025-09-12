
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import UnifiedAuthView from "@/components/auth/unified/UnifiedAuthView";
import QuickInterestsModal from "@/components/auth/QuickInterestsModal";
import { useProfileRetrieval } from "@/hooks/profile/useProfileRetrieval";
const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();
  const { profileData } = useProfileRetrieval();
  const [showQuickInterests, setShowQuickInterests] = useState(false);

  // Detect initial mode from URL parameters
  const mode = searchParams.get('mode') as 'signin' | 'signup' | null;
  const initialMode = mode || 'signup'; // Default to signup if no mode specified

  // Handle post-signup interests modal and redirect
  useEffect(() => {
    if (user && !isLoading && profileData) {
      // Check if this is a new signup
      const isNewSignUp = localStorage.getItem("newSignUp") === "true";
      
      // Show quick interests modal if:
      // 1. User just signed up (newSignUp flag set)
      // 2. User has no existing interests
      // 3. We're not already redirecting somewhere specific
      const hasNoInterests = !profileData.interests || profileData.interests.length === 0;
      const hasRedirect = searchParams.get('redirect');
      const shouldShowModal = isNewSignUp && hasNoInterests && !hasRedirect;
      
      if (shouldShowModal) {
        // Clear the flag to prevent showing modal again
        localStorage.removeItem("newSignUp");
        setShowQuickInterests(true);
        return;
      }
      
      // Clear signup flag if not showing modal
      if (isNewSignUp) {
        localStorage.removeItem("newSignUp");
      }
      
      // Otherwise, redirect normally
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
        <UnifiedAuthView initialMode={initialMode} />
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
