
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import MainLayout from "@/components/layout/MainLayout";
import StreamlinedProfileForm from "@/components/auth/unified/StreamlinedProfileForm";
import OnboardingIntentModal from "@/components/auth/signup/OnboardingIntentModal";

const StreamlinedProfileSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user needs profile setup
    const completionState = LocalStorageService.getProfileCompletionState();
    
    if (completionState?.step === 'intent') {
      // Profile complete, show intent modal
      setShowIntentModal(true);
      setIsLoading(false);
    } else if (completionState?.step === 'profile') {
      // Show profile form
      setIsLoading(false);
    } else {
      // Already completed, redirect to dashboard
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleProfileComplete = () => {
    // Mark profile as complete, show intent modal
    LocalStorageService.setProfileCompletionState({
      step: 'intent',
      source: 'email'
    });
    setShowIntentModal(true);
  };

  const handleIntentSelect = (intent: "quick-gift" | "browse-shop" | "create-wishlist") => {
    // Save intent and complete onboarding
    LocalStorageService.setNicoleContext({
      selectedIntent: intent,
      source: 'onboarding_completion'
    });
    
    // Clear completion state
    LocalStorageService.clearProfileCompletionState();
    LocalStorageService.markProfileSetupCompleted();
    
    setShowIntentModal(false);
    
    // Navigate based on intent
    setTimeout(() => {
      if (intent === "browse-shop") {
        navigate("/marketplace?mode=nicole&open=true&greeting=personalized", { replace: true });
      } else if (intent === "quick-gift") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }, 100);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {!showIntentModal ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <StreamlinedProfileForm onComplete={handleProfileComplete} />
        </div>
      ) : (
        <OnboardingIntentModal
          open={showIntentModal}
          onSelect={handleIntentSelect}
          onSkip={() => {}} // Not used
        />
      )}
    </MainLayout>
  );
};

export default StreamlinedProfileSetup;
