import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import OnboardingIntentModal from "@/components/auth/signup/OnboardingIntentModal";
import ProfileSetupFlow from "@/components/profile-setup/ProfileSetupFlow";
import MainLayout from "@/components/layout/MainLayout";
import { GiftSetupWizard } from "@/components/gifting/GiftSetupWizard";
import CreateWishlistDialog from "@/components/gifting/wishlist/CreateWishlistDialog";

/**
 * Handles the complete profile setup flow including intent selection
 * This component orchestrates both profile completion and intent modal display
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

    // Check profile completion state to determine what to show
    const completionState = LocalStorageService.getProfileCompletionState();
    
    if (completionState?.step === 'intent') {
      // Profile is complete, show intent modal
      setShowIntentModal(true);
      setIsLoading(false);
    } else if (completionState?.step === 'profile' || !LocalStorageService.isProfileSetupCompleted()) {
      // Profile needs completion
      setShowProfileSetup(true);
      setIsLoading(false);
    } else {
      // Everything is complete, redirect to dashboard
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleIntentSelect = (intent: "quick-gift" | "browse-shop" | "create-wishlist") => {
    console.log(`User selected intent: ${intent}`);
    
    // Save intent selection
    LocalStorageService.setNicoleContext({
      selectedIntent: intent,
      source: 'profile-setup'
    });
    
    // Clear completion state since we're done
    LocalStorageService.clearProfileCompletionState();
    
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
    console.log('Creating wishlist:', values);
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
          <ProfileSetupFlow 
            onComplete={handleProfileComplete}
            onSkip={handleProfileSkip}
          />
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