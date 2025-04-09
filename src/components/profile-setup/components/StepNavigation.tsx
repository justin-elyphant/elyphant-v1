
import React from "react";
import { Button } from "@/components/ui/button";

interface StepNavigationProps {
  activeStep: number;
  totalSteps: number;
  isLoading: boolean;
  isCurrentStepValid: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  activeStep,
  totalSteps,
  isLoading,
  isCurrentStepValid,
  onBack,
  onNext,
  onComplete,
  onSkip,
}) => {
  return (
    <div className="flex justify-between pt-4 border-t w-full">
      <div>
        {activeStep > 0 ? (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        ) : (
          <Button variant="outline" onClick={onSkip}>
            Skip for now
          </Button>
        )}
      </div>
      <div>
        {activeStep < totalSteps - 1 ? (
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={onNext}
            disabled={!isCurrentStepValid || isLoading}
          >
            Next Step
          </Button>
        ) : (
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={onComplete}
            disabled={!isCurrentStepValid || isLoading}
          >
            {isLoading ? "Saving..." : "Complete Setup"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default StepNavigation;
