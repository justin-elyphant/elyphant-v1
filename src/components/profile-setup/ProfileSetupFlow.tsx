
import React, { useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import StepNavigation from "./components/StepNavigation";
import ProfileStepperHeader from "./components/ProfileStepperHeader";
import { useProfileSetup } from "./hooks/useProfileSetup";

// Import the updated step components
import BasicInfoCombinedStep from "./steps/BasicInfoCombinedStep";
import DateOfBirthStep from "./steps/DateOfBirthStep";
import AddressStep from "./steps/AddressStep";
import InterestsStep from "./steps/InterestsStep";
import DataSharingStep from "./steps/DataSharingStep";
import NextStepsStep from "./steps/NextStepsStep";

interface ProfileSetupFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const ProfileSetupFlow: React.FC<ProfileSetupFlowProps> = ({ onComplete, onSkip }) => {
  // Clear any stale loading flags and rate limit flags on component mount
  useEffect(() => {
    localStorage.removeItem("profileSetupLoading");
    localStorage.removeItem("signupRateLimited");
    
    console.log("ProfileSetupFlow: Component mounted, cleared loading flags");
  }, []);

  const handleCompleteWrapper = useCallback(() => {
    console.log("ProfileSetupFlow: onComplete wrapper triggered");
    localStorage.removeItem("profileSetupLoading");
    localStorage.removeItem("signupRateLimited");
    
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
      profileData
    });
  }, [activeStep, isLoading, isCurrentStepValid, profileData]);

  // Define step rendering as a memoized function
  const renderCurrentStep = useMemo(() => {
    switch (activeStep) {
      case 0:
        return (
          <BasicInfoCombinedStep
            name={profileData.name}
            email={profileData.email}
            bio={profileData.bio || ""}
            profile_image={profileData.profile_image}
            onNameChange={(name) => updateProfileData('name', name)}
            onEmailChange={(email) => updateProfileData('email', email)}
            onBioChange={(bio) => updateProfileData('bio', bio)}
            onProfileImageChange={(image) => updateProfileData('profile_image', image)}
          />
        );
      case 1:
        return (
          <DateOfBirthStep
            value={profileData.birthday}
            onChange={(birthday) => updateProfileData('birthday', birthday)}
          />
        );
      case 2:
        return (
          <AddressStep
            value={profileData.address}
            onChange={(address) => updateProfileData('address', address)}
          />
        );
      case 3:
        return (
          <InterestsStep
            value={profileData.interests}
            onChange={(interests) => updateProfileData('interests', interests)}
          />
        );
      case 4:
        return (
          <DataSharingStep
            profileData={profileData}
            updateProfileData={updateProfileData}
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
    
    localStorage.removeItem("signupRateLimited");
    
    try {
      handleComplete();
    } catch (error) {
      console.error("Error during completion:", error);
      toast.error("Error completing profile setup, continuing anyway");
      
      localStorage.removeItem("profileSetupLoading");
      localStorage.removeItem("signupRateLimited");
      
      onComplete();
    }
  }, [handleComplete, onComplete]);

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader>
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
