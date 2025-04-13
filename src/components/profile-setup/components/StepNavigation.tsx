
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === totalSteps - 1;
  
  // Force completion after a timeout if loading takes too long
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isLoading && isLastStep) {
      console.log("Setting up safety timeout for completion");
      timeoutId = setTimeout(() => {
        console.warn("Loading timeout reached - forcing completion");
        onComplete();
      }, 6000); // 6 second timeout
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, isLastStep, onComplete]);

  // Handle the complete action
  const handleComplete = () => {
    console.log("Complete button clicked - initiating completion");
    onComplete();
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {isLoading && isLastStep && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            Saving your profile information...
          </AlertDescription>
        </Alert>
      )}
      
      <div className="w-full flex justify-between">
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
              disabled={!isCurrentStepValid || isLoading}
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
    </div>
  );
};

export default StepNavigation;
