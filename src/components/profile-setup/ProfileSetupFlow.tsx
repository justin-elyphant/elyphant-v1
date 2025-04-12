
import React, { useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Import our newly created components
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
  } = useProfileSetup({ onComplete, onSkip });

  // Add debug logging to help troubleshoot
  console.log("ProfileSetupFlow - Current step:", activeStep);
  console.log("ProfileSetupFlow - Is current step valid:", isCurrentStepValid);
  console.log("ProfileSetupFlow - Profile data:", profileData);

  // Handle keyboard navigation for better UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow pressing Enter to proceed to next step
      if (e.key === 'Enter' && !e.shiftKey && isCurrentStepValid && !isLoading) {
        if (activeStep < steps.length - 1) {
          handleNext();
        } else {
          handleComplete();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStep, isCurrentStepValid, isLoading, steps.length, handleNext, handleComplete]);

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader className="text-center">
        <ProfileStepperHeader activeStep={activeStep} steps={steps} />
      </CardHeader>
      
      <CardContent>
        <Separator className="mb-6" />
        
        {activeStep === 0 && (
          <BasicInfoStep 
            value={profileData.name}
            onChange={(name) => updateProfileData('name', name)}
          />
        )}
        
        {activeStep === 1 && (
          <ProfileCombinedStep
            name={profileData.name}
            username={profileData.username}
            email={profileData.email || ''}
            profileImage={profileData.profile_image}
            onUsernameChange={(username) => updateProfileData('username', username)}
            onProfileImageChange={(image) => updateProfileData('profile_image', image)}
          />
        )}
        
        {activeStep === 2 && (
          <DateOfBirthStep
            value={profileData.dob}
            onChange={(dob) => updateProfileData('dob', dob)}
          />
        )}
        
        {activeStep === 3 && (
          <ShippingAddressStep
            value={profileData.shipping_address}
            onChange={(address) => updateProfileData('shipping_address', address)}
          />
        )}
        
        {activeStep === 4 && (
          <GiftPreferencesStep
            values={profileData.gift_preferences}
            onChange={(preferences) => updateProfileData('gift_preferences', preferences)}
          />
        )}
        
        {activeStep === 5 && (
          <DataSharingStep
            values={profileData.data_sharing_settings}
            onChange={(settings) => updateProfileData('data_sharing_settings', settings)}
          />
        )}
        
        {activeStep === 6 && (
          <NextStepsStep
            onSelectOption={(option) => updateProfileData('next_steps_option', option)}
            selectedOption={profileData.next_steps_option}
          />
        )}
      </CardContent>
      
      <CardFooter>
        <StepNavigation 
          activeStep={activeStep}
          totalSteps={steps.length}
          isLoading={isLoading}
          isCurrentStepValid={isCurrentStepValid}
          onBack={handleBack}
          onNext={handleNext}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      </CardFooter>
    </Card>
  );
};

export default ProfileSetupFlow;
