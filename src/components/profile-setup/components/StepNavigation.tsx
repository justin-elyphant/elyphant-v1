
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
  
  // Force completion if loading state gets stuck for too long
  useEffect(() => {
    let safetyTimer: NodeJS.Timeout | null = null;
    
    if (isLoading && isLastStep) {
      console.log("Setting safety timer for loading state");
      safetyTimer = setTimeout(() => {
        console.log("Safety timer triggered - loading state was stuck");
        // Clear loading flag from localStorage
        localStorage.removeItem("profileSetupLoading");
        localStorage.removeItem("signupRateLimited");
        
        // If we're still on the page, force the completion
        if (isLoading && isLastStep) {
          console.log("Forcing completion due to stuck loading state");
          onComplete();
        }
      }, 4000); // 4 second safety timeout
    }
    
    return () => {
      if (safetyTimer) {
        clearTimeout(safetyTimer);
      }
    };
  }, [isLoading, isLastStep, onComplete]);
  
  // Add click debugging
  const handleNextClick = (e: React.MouseEvent) => {
    console.log("Next button clicked, isCurrentStepValid:", isCurrentStepValid);
    if (isCurrentStepValid) {
      onNext();
    }
  };
  
  // Handle the complete action with debugging
  const handleComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Complete button clicked in StepNavigation, isLoading:", isLoading);
    
    if (isLoading) {
      console.log("Ignoring complete button click - already loading");
      return;
    }
    
    console.log("Proceeding with complete action");
    
    // Clear any existing loading flags and rate limit flags
    localStorage.removeItem("profileSetupLoading");
    localStorage.removeItem("signupRateLimited");
    
    // Mark profile as completed before navigation
    localStorage.setItem("profileCompleted", "true");
    
    // Complete the process
    onComplete();
    
    // Safety fallback navigation if nothing happens after 2 seconds
    setTimeout(() => {
      if (window.location.pathname === "/profile-setup") {
        console.log("Detected navigation failure, forcing direct location change");
        window.location.href = "/dashboard";
      }
    }, 2000);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {isLoading && isLastStep && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            Saving your profile information... This may take a moment.
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
              onClick={handleNextClick}
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
