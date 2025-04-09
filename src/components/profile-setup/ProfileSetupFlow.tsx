
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Import our newly created components
import ProfileStepperHeader from "./components/ProfileStepperHeader";
import StepNavigation from "./components/StepNavigation";
import { useProfileSetup } from "./hooks/useProfileSetup";

// Import the step components
import BasicInfoStep from "./steps/BasicInfoStep";
import DateOfBirthStep from "./steps/DateOfBirthStep";
import ShippingAddressStep from "./steps/ShippingAddressStep";
import GiftPreferencesStep from "./steps/GiftPreferencesStep";
import DataSharingStep from "./steps/DataSharingStep";

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
          <DateOfBirthStep
            value={profileData.dob}
            onChange={(dob) => updateProfileData('dob', dob)}
          />
        )}
        
        {activeStep === 2 && (
          <ShippingAddressStep
            value={profileData.shipping_address}
            onChange={(address) => updateProfileData('shipping_address', address)}
          />
        )}
        
        {activeStep === 3 && (
          <GiftPreferencesStep
            values={profileData.gift_preferences}
            onChange={(preferences) => updateProfileData('gift_preferences', preferences)}
          />
        )}
        
        {activeStep === 4 && (
          <DataSharingStep
            values={profileData.data_sharing_settings}
            onChange={(settings) => updateProfileData('data_sharing_settings', settings)}
          />
        )}
      </CardContent>
      
      <CardFooter>
        <StepNavigation 
          activeStep={activeStep}
          totalSteps={steps.length}
          isLoading={isLoading}
          isCurrentStepValid={isCurrentStepValid()}
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
