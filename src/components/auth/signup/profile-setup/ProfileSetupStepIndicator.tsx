
import React from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle } from "lucide-react";

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
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-1">
        <p className="text-sm font-medium">
          Profile Setup Progress: {Math.round(progress)}%
        </p>
        <p className="text-xs text-muted-foreground">
          Step {currentStep + 1} of {totalSteps}
        </p>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div 
            key={index} 
            className={`flex items-center justify-center w-6 h-6 rounded-full ${
              index <= currentStep 
                ? "bg-green-100 text-green-700 border border-green-300" 
                : "bg-gray-100 text-gray-400 border border-gray-300"
            }`}
          >
            {index < currentStep ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <span className="text-xs">{index + 1}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileSetupStepIndicator;
