
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useProfileSetup } from "./hooks/useProfileSetup";
import BasicInfoStep from "./steps/BasicInfoStep";
import AddressStep from "./steps/AddressStep";
import InterestsStep from "./steps/InterestsStep";
import ImportantDatesStep from "./steps/ImportantDatesStep";
import PrivacyStep from "./steps/PrivacyStep";
import NextStepsStep from "./steps/NextStepsStep";

interface ProfileSetupFlowProps {
  onComplete: (nextStepsOption?: string) => void;
  onSkip?: () => void;
}

const ProfileSetupFlow: React.FC<ProfileSetupFlowProps> = ({ onComplete, onSkip }) => {
  const {
    activeStep,
    steps,
    handleNext,
    handleBack,
    profileData,
    updateProfileData,
    isCurrentStepValid,
    isLoading,
    error,
    handleComplete,
    handleSkip
  } = useProfileSetup({ onComplete, onSkip });

  const currentStepIndex = steps.findIndex(step => step.id === activeStep);
  const isLastStep = currentStepIndex === steps.length - 1;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  const currentStepConfig = steps[currentStepIndex];

  const handleNextStepSelection = (option: string) => {
    updateProfileData('next_steps_option', option);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 'basic-info':
        return (
          <BasicInfoStep 
            profileData={profileData}
            updateProfileData={updateProfileData}
          />
        );
      case 'address':
        return (
          <AddressStep 
            profileData={profileData}
            updateProfileData={updateProfileData}
          />
        );
      case 'interests':
        return (
          <InterestsStep 
            profileData={profileData}
            updateProfileData={updateProfileData}
          />
        );
      case 'important-dates':
        return (
          <ImportantDatesStep 
            profileData={profileData}
            updateProfileData={updateProfileData}
          />
        );
      case 'privacy':
        return (
          <PrivacyStep 
            profileData={profileData}
            updateProfileData={updateProfileData}
          />
        );
      case 'next-steps':
        return (
          <NextStepsStep 
            onSelectOption={handleNextStepSelection}
            selectedOption={profileData?.next_steps_option || ''}
          />
        );
      default:
        return null;
    }
  };

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="mb-4">An error occurred during profile setup:</p>
            <p className="text-sm mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepConfig?.title}</CardTitle>
          {currentStepConfig?.description && (
            <p className="text-sm text-muted-foreground">
              {currentStepConfig.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStepContent()}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button 
              variant="outline" 
              onClick={currentStepIndex === 0 ? handleSkip : handleBack}
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStepIndex === 0 ? 'Skip Setup' : 'Back'}
            </Button>
            
            <Button 
              onClick={isLastStep ? handleComplete : handleNext}
              disabled={!isCurrentStepValid || isLoading}
            >
              {isLoading ? 'Processing...' : isLastStep ? 'Complete Setup' : 'Next'}
              {!isLastStep && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetupFlow;
