
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface StepNavigationProps {
  activeStep: number;
  totalSteps: number;
  isLoading: boolean;
  isCurrentStepValid: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
  onSkip?: () => void;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  activeStep,
  totalSteps,
  isLoading,
  isCurrentStepValid,
  onBack,
  onNext,
  onComplete,
  onSkip
}) => {
  console.info("StepNavigation render - Current step:", activeStep);
  console.info("StepNavigation render - Is valid:", isCurrentStepValid);
  console.info("StepNavigation render - Is loading:", isLoading);
  
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === totalSteps - 1;
  
  // Handle the complete action with a loading timeout
  const handleComplete = () => {
    // Force a timeout to prevent stuck state
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn("Forcing completion due to timeout");
        onComplete();
      }
    }, 5000); // 5 second timeout
    
    // Normal flow
    onComplete();
    
    // Only clear the timeout if it hasn't triggered yet
    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="w-full flex justify-between mt-4">
      <div>
        {!isFirstStep && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            disabled={isLoading}
          >
            Back
          </Button>
        )}
        
        {isFirstStep && onSkip && (
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onSkip}
            disabled={isLoading}
          >
            Skip Setup
          </Button>
        )}
      </div>
      
      <div>
        {!isLastStep ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={!isCurrentStepValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleComplete}
            disabled={!isCurrentStepValid}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default StepNavigation;
