
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
  // Add enhanced debug information
  console.log("StepNavigation render - Current step:", activeStep);
  console.log("StepNavigation render - Is valid:", isCurrentStepValid);
  console.log("StepNavigation render - Is loading:", isLoading);
  
  const handleNextClick = () => {
    console.log("Next button clicked, calling onNext handler");
    onNext();
  };
  
  const handleCompleteClick = () => {
    console.log("Complete button clicked, calling onComplete handler");
    onComplete();
  };

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
            onClick={handleNextClick}
            disabled={!isCurrentStepValid && activeStep < 6} // Enable button if data is valid, but always enable on final step
          >
            Next Step
          </Button>
        ) : (
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleCompleteClick}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Complete Setup"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default StepNavigation;
