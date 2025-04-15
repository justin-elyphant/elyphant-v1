
import React, { useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Import our components
import ProfileStepperHeader from "./components/ProfileStepperHeader";
import StepNavigation from "./components/StepNavigation";
import { useProfileSetup } from "./hooks/useProfileSetup";

// Import the step components
import ProfileCombinedStep from "./steps/ProfileCombinedStep";
import DateOfBirthStep from "./steps/DateOfBirthStep";
import ShippingAddressStep from "./steps/ShippingAddressStep";
import GiftPreferencesStep from "./steps/GiftPreferencesStep";
import DataSharingStep from "./steps/DataSharingStep";
import NextStepsStep from "./steps/NextStepsStep";

interface ProfileSetupFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const ProfileSetupFlow: React.FC<ProfileSetupFlowProps> = ({ onComplete, onSkip }) => {
  // Clear any stale loading flags and rate limit flags on component mount
  useEffect(() => {
    // Clear any stuck loading states
    localStorage.removeItem("profileSetupLoading");
    localStorage.removeItem("signupRateLimited");
    
    console.log("ProfileSetupFlow: Component mounted, cleared loading flags");
    
    // Check if we have a newSignUp flag in localStorage - debugging info
    const isNewSignUp = localStorage.getItem("newSignUp") === "true";
    const userEmail = localStorage.getItem("userEmail");
    const userName = localStorage.getItem("userName");
    console.log("ProfileSetupFlow: User data from localStorage:", { 
      isNewSignUp, 
      userEmail, 
      userName 
    });
  }, []);

  const handleCompleteWrapper = useCallback(() => {
    console.log("ProfileSetupFlow: onComplete wrapper triggered");
    // Ensure all loading and rate limit flags are cleared
    localStorage.removeItem("profileSetupLoading");
    localStorage.removeItem("signupRateLimited");
    
    // Ensure we invoke the parent's onComplete
    setTimeout(() => {
      onComplete();
    }, 50);
  }, [onComplete]);

  const {
    activeStep,
    profileData,
    steps,
    isLoading,
    isCurrentStepValid,
    handleNext,
    handleBack,
    handleComplete,
    handleSkip,
    updateProfileData
  } = useProfileSetup({ 
    onComplete: handleCompleteWrapper,
    onSkip 
  });

  useEffect(() => {
    console.log("ProfileSetupFlow: Current state", {
      activeStep,
      isLoading,
      isCurrentStepValid,
      rateLimitFlag: localStorage.getItem("signupRateLimited"),
      profileData
    });
  }, [activeStep, isLoading, isCurrentStepValid, profileData]);

  // Define step rendering as a memoized function
  const renderCurrentStep = useMemo(() => {
    switch (activeStep) {
      case 0:
        return (
          <ProfileCombinedStep
            name={profileData.name}
            username={profileData.username}
            email={profileData.email || ''}
            profileImage={profileData.profile_image}
            onNameChange={(name) => updateProfileData('name', name)}
            onUsernameChange={(username) => updateProfileData('username', username)}
            onProfileImageChange={(image) => updateProfileData('profile_image', image)}
          />
        );
      case 1:
        return (
          <DateOfBirthStep
            value={profileData.dob}
            onChange={(dob) => updateProfileData('dob', dob)}
          />
        );
      case 2:
        return (
          <ShippingAddressStep
            value={profileData.shipping_address}
            onChange={(address) => updateProfileData('shipping_address', address)}
          />
        );
      case 3:
        return (
          <GiftPreferencesStep
            values={profileData.gift_preferences}
            onChange={(preferences) => updateProfileData('gift_preferences', preferences)}
          />
        );
      case 4:
        return (
          <DataSharingStep
            values={profileData.data_sharing_settings}
            onChange={(settings) => updateProfileData('data_sharing_settings', settings)}
          />
        );
      case 5:
        return (
          <NextStepsStep
            onSelectOption={(option) => updateProfileData('next_steps_option', option)}
            selectedOption={profileData.next_steps_option}
          />
        );
      default:
        return null;
    }
  }, [activeStep, profileData, updateProfileData]);

  // Create memoized complete handler with additional safety
  const handleCompleteClick = useCallback(() => {
    console.log("Complete button clicked in ProfileSetupFlow");
    
    // Safety check - clear rate limit flag before completing
    localStorage.removeItem("signupRateLimited");
    
    // Directly attempt to complete without complex checks
    try {
      handleComplete();
    } catch (error) {
      console.error("Error during completion:", error);
      toast.error("Error completing profile setup, continuing anyway");
      
      // Force completion even if there's an error
      localStorage.removeItem("profileSetupLoading");
      localStorage.removeItem("signupRateLimited");
      
      // Then complete
      onComplete();
    }
  }, [handleComplete, onComplete]);

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader className="text-center">
        <ProfileStepperHeader activeStep={activeStep} steps={steps} />
      </CardHeader>
      
      <CardContent>
        <Separator className="mb-6" />
        {renderCurrentStep}
      </CardContent>
      
      <CardFooter>
        <StepNavigation 
          activeStep={activeStep}
          totalSteps={steps.length}
          isLoading={isLoading}
          isCurrentStepValid={isCurrentStepValid}
          onBack={handleBack}
          onNext={handleNext}
          onComplete={handleCompleteClick}
          onSkip={handleSkip}
        />
      </CardFooter>
    </Card>
  );
};

export default ProfileSetupFlow;
