import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useProfileSetup } from "./hooks/useProfileSetup";
import BasicInfoStep from "./steps/BasicInfoStep";
import BirthdayStep from "./steps/BirthdayStep";
import AddressStep from "./steps/AddressStep";
import PreferencesStep from "./steps/PreferencesStep";
import PrivacyStep from "./steps/PrivacyStep";
import NextStepsStep from "./steps/NextStepsStep";

interface ProfileSetupFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const ProfileSetupFlow: React.FC<ProfileSetupFlowProps> = ({
  onComplete,
  onSkip
}) => {
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

  const [selectedNextStep, setSelectedNextStep] = React.useState("");

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <BasicInfoStep
            value={profileData.name}
            onChange={(name) => updateProfileData("name", name)}
          />
        );
      case 1:
        return (
          <BirthdayStep
            profileData={profileData}
            updateProfileData={updateProfileData}
          />
        );
      case 2:
        return (
          <AddressStep
            profileData={profileData}
            updateProfileData={updateProfileData}
          />
        );
      case 3:
        return (
          <PreferencesStep
            profileData={profileData}
            updateProfileData={updateProfileData}
          />
        );
      case 4:
        return (
          <PrivacyStep
            profileData={profileData}
            updateProfileData={updateProfileData}
          />
        );
      case 5:
        return (
          <NextStepsStep
            onSelectOption={setSelectedNextStep}
            selectedOption={selectedNextStep}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = (step: { title: string; description: string }) => step.title;
  const getStepDescription = (step: { title: string; description: string }) => step.description;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
            <Badge variant="outline">
              Step {activeStep + 1} of {steps.length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{getStepTitle(steps[activeStep])}</span>
              <span>{Math.round(((activeStep + 1) / steps.length) * 100)}%</span>
            </div>
            <Progress value={((activeStep + 1) / steps.length) * 100} />
            <p className="text-sm text-gray-500">{getStepDescription(steps[activeStep])}</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderStep()}
          
          <div className="flex justify-between pt-4">
            <div>
              {activeStep > 0 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isLoading}
                >
                  ← Back
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              {onSkip && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isLoading}
                >
                  Skip for now
                </button>
              )}
              
              {activeStep < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!isCurrentStepValid || isLoading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Saving..." : "Continue"}
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Completing..." : "Complete Profile"}
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetupFlow;
