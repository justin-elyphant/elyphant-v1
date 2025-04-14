
import { useProfileSteps } from "./useProfileSteps";
import { useProfileData } from "./useProfileData";
import { useProfileValidation } from "./useProfileValidation";
import { useState, useCallback, useRef, useEffect } from "react";
import { useProfileSubmit } from "@/hooks/profile/useProfileSubmit";
import { toast } from "sonner";

interface UseProfileSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const useProfileSetup = ({ onComplete, onSkip }: UseProfileSetupProps) => {
  const { activeStep, steps, handleNext, handleBack } = useProfileSteps();
  const { profileData, updateProfileData, isLoading: isDataLoading } = useProfileData();
  const { isCurrentStepValid } = useProfileValidation(activeStep, profileData);
  const { isLoading: isSubmitLoading, handleSubmit } = useProfileSubmit({
    onComplete,
    nextStepsOption: profileData.next_steps_option
  });
  
  const [isCompleting, setIsCompleting] = useState(false);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);
  const maxCompletionTime = 2000; // Reduced from 3000 to 2000 ms to prevent long waits

  // More reliable loading state checking
  const isLoading = isSubmitLoading || isCompleting || isDataLoading;

  // Enhanced logging for debugging
  useEffect(() => {
    console.log("useProfileSetup state:", {
      isDataLoading,
      isSubmitLoading,
      isCompleting,
      totalLoading: isLoading,
      nextStepsOption: profileData.next_steps_option,
      activeStep
    });
  }, [isDataLoading, isSubmitLoading, isCompleting, isLoading, profileData.next_steps_option, activeStep]);

  // Force completion after a timeout - with additional safeguards
  useEffect(() => {
    if (isCompleting && !completionTimeoutRef.current) {
      console.log("Setting up safety timeout for profile completion");
      completionTimeoutRef.current = setTimeout(() => {
        console.warn("Forcing profile setup completion due to timeout");
        if (isCompleting) { // Double-check we're still completing
          setIsCompleting(false);
          // Remove loading flags from localStorage
          localStorage.removeItem("profileSetupLoading");
          onComplete();
        }
      }, maxCompletionTime);
    }
    
    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
        completionTimeoutRef.current = null;
      }
    };
  }, [isCompleting, onComplete]);

  // Safe cleanup function for timeouts
  const cleanupTimeouts = useCallback(() => {
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }
    // Remove loading flag
    localStorage.removeItem("profileSetupLoading");
  }, []);

  // Handle skip action
  const handleSkip = useCallback(() => {
    console.log("Skipping profile setup");
    cleanupTimeouts();
    if (onSkip) {
      onSkip();
    }
  }, [onSkip, cleanupTimeouts]);

  // Handle completion with safety timeout and better error handling
  const handleComplete = useCallback(async () => {
    if (hasCompletedRef.current || isCompleting) {
      console.log("Completion already in progress, ignoring duplicate request");
      return;
    }

    console.log("Completing profile setup with data:", profileData);
    hasCompletedRef.current = true;
    setIsCompleting(true);
    
    // Set loading flag in localStorage
    localStorage.setItem("profileSetupLoading", "true");
    
    try {
      await handleSubmit(profileData);
      
      // Clear completion flags and redirect
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("profileSetupLoading");
      setIsCompleting(false);
      cleanupTimeouts();
      onComplete();
      
    } catch (error) {
      console.error("Error in handleComplete:", error);
      toast.error("An error occurred, continuing anyway");
      
      // Clear loading states and force completion
      setIsCompleting(false);
      localStorage.removeItem("profileSetupLoading");
      cleanupTimeouts();
      
      // Even on error, we still want to complete the flow to prevent users getting stuck
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  }, [profileData, handleSubmit, onComplete, isCompleting, cleanupTimeouts]);

  return {
    activeStep,
    steps,
    handleNext,
    handleBack,
    
    profileData,
    updateProfileData,
    
    isCurrentStepValid,
    
    isLoading,
    handleComplete,
    handleSkip
  };
};
