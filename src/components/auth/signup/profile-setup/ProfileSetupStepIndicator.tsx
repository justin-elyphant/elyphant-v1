
import React from "react";
import { Progress } from "@/components/ui/progress";

interface ProfileSetupStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProfileSetupStepIndicator = ({
  currentStep,
  totalSteps,
}: ProfileSetupStepIndicatorProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <Progress value={progress} className="h-2" />
  );
};

export default ProfileSetupStepIndicator;
