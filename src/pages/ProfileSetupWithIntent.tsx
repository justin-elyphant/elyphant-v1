
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import OnboardingIntentModal from "@/components/auth/signup/OnboardingIntentModal";
import MainLayout from "@/components/layout/MainLayout";
import { GiftSetupWizard } from "@/components/gifting/GiftSetupWizard";
import CreateWishlistDialog from "@/components/gifting/wishlist/CreateWishlistDialog";

/**
 * Handles the complete profile setup flow including intent selection
 * This component orchestrates both profile completion and intent modal display
 * ONLY used during onboarding flows, NOT on dashboard
 */
const ProfileSetupWithIntent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showGiftWizard, setShowGiftWizard] = useState(false);
  const [showCreateWishlist, setShowCreateWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    console.log("ProfileSetupWithIntent: Checking completion state");

    // Check profile completion state to determine what to show
    const completionState = LocalStorageService.getProfileCompletionState();
    console.log("ProfileSetupWithIntent completion state:", completionState);
    
    if (completionState?.step === 'intent') {
      // Profile is complete, show intent modal
      console.log("Showing intent modal");
      setShowIntentModal(true);
      setIsLoading(false);
    } else if (completionState?.step === 'profile' || !LocalStorageService.isProfileSetupCompleted()) {
      // Profile needs completion
      console.log("Profile needs completion - redirecting to main onboarding");
      // In the current flow, profile setup is handled in the main signup flow
      // So if we get here, redirect to dashboard since profile should be done
      navigate('/dashboard');
    } else {
      // Everything is complete, redirect to dashboard
      console.log("Profile setup complete - redirecting to dashboard");
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleIntentSelect = (intent: "quick-gift" | "browse-shop" | "create-wishlist") => {
    console.log(`ProfileSetupWithIntent: User selected intent: ${intent}`);
    
    // Save intent selection
    LocalStorageService.setNicoleContext({
      selectedIntent: intent,
      source: 'profile-setup'
    });
    
    // Mark profile setup as completed and clear completion state
    LocalStorageService.markProfileSetupCompleted();
    
    // Close intent modal first
    setShowIntentModal(false);
    
    // Route based on intent
    if (intent === "quick-gift") {
      setShowGiftWizard(true);
    } else if (intent === "browse-shop") {
      navigate('/marketplace?mode=nicole&open=true&greeting=giftor-intent&first_name=true');
    } else if (intent === "create-wishlist") {
      setShowCreateWishlist(true);
    }
  };

  const handleGiftWizardClose = () => {
    setShowGiftWizard(false);
    navigate('/dashboard');
  };

  const handleCreateWishlistSubmit = async (values: any) => {
    console.log('Creating wishlist from onboarding:', values);
    setShowCreateWishlist(false);
    navigate('/dashboard');
  };

  const handleCreateWishlistClose = () => {
    setShowCreateWishlist(false);
    navigate('/dashboard');
  };

  const handleProfileComplete = () => {
    // Profile setup complete, now show intent modal
    LocalStorageService.setProfileCompletionState({
      step: 'intent',
      source: 'email'
    });
    setShowProfileSetup(false);
    setShowIntentModal(true);
  };

  const handleProfileSkip = () => {
    // User skipped profile setup, still show intent modal
    setShowProfileSetup(false);
    setShowIntentModal(true);
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
      {showProfileSetup && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div>Profile setup is now handled in the main signup flow</div>
        </div>
      )}
      
      <OnboardingIntentModal
        open={showIntentModal}
        onSelect={handleIntentSelect}
        onSkip={() => {}} // Not used
      />
      
      <GiftSetupWizard
        open={showGiftWizard}
        onOpenChange={setShowGiftWizard}
      />
      
      <CreateWishlistDialog
        open={showCreateWishlist}
        onOpenChange={setShowCreateWishlist}
        onSubmit={handleCreateWishlistSubmit}
      />
    </MainLayout>
  );
};

export default ProfileSetupWithIntent;
