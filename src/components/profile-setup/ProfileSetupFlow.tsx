
import React, { useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Import our components
import ProfileStepperHeader from "./components/ProfileStepperHeader";
import StepNavigation from "./components/StepNavigation";
import { useProfileSetup } from "./hooks/useProfileSetup";

// Import the step components
import BasicInfoStep from "./steps/BasicInfoStep";
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
  // Clear any stale loading flags on component mount
  useEffect(() => {
    localStorage.removeItem("profileSetupLoading");
  }, []);

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
    onComplete: useCallback(() => {
      console.log("ProfileSetupFlow: onComplete triggered");
      // Ensure loading flags are cleared
      localStorage.removeItem("profileSetupLoading");
      
      // Ensure we invoke the parent's onComplete
      setTimeout(() => {
        onComplete();
      }, 50);
    }, [onComplete]), 
    onSkip 
  });

  useEffect(() => {
    console.log("ProfileSetupFlow: Current state", {
      activeStep,
      isLoading,
      isCurrentStepValid,
      profileData
    });
  }, [activeStep, isLoading, isCurrentStepValid, profileData]);

  // Define step rendering as a memoized function
  const renderCurrentStep = useMemo(() => {
    switch (activeStep) {
      case 0:
        return (
          <BasicInfoStep 
            value={profileData.name}
            onChange={(name) => updateProfileData('name', name)}
          />
        );
      case 1:
        return (
          <ProfileCombinedStep
            name={profileData.name}
            username={profileData.username}
            email={profileData.email || ''}
            profileImage={profileData.profile_image}
            onUsernameChange={(username) => updateProfileData('username', username)}
            onProfileImageChange={(image) => updateProfileData('profile_image', image)}
          />
        );
      case 2:
        return (
          <DateOfBirthStep
            value={profileData.dob}
            onChange={(dob) => updateProfileData('dob', dob)}
          />
        );
      case 3:
        return (
          <ShippingAddressStep
            value={profileData.shipping_address}
            onChange={(address) => updateProfileData('shipping_address', address)}
          />
        );
      case 4:
        return (
          <GiftPreferencesStep
            values={profileData.gift_preferences}
            onChange={(preferences) => updateProfileData('gift_preferences', preferences)}
          />
        );
      case 5:
        return (
          <DataSharingStep
            values={profileData.data_sharing_settings}
            onChange={(settings) => updateProfileData('data_sharing_settings', settings)}
          />
        );
      case 6:
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
    
    // Safety check - if we're on the last step, ensure we complete even if there's an error
    const safeComplete = () => {
      try {
        handleComplete();
      } catch (error) {
        console.error("Error during completion:", error);
        toast.error("Error completing profile setup, continuing anyway");
        
        // Force completion even if there's an error
        setTimeout(() => {
          // Clean up flags first
          localStorage.removeItem("profileSetupLoading");
          
          // Then complete
          onComplete();
        }, 100);
      }
    };
    
    safeComplete();
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
