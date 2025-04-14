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
    onComplete
  });
  
  const [isCompleting, setIsCompleting] = useState(false);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);
  const maxCompletionTime = 3000; // Reduced from 5000 to 3000 ms to prevent long waits

  // Simplified loading state determination to prevent false positives
  const isLoading = isSubmitLoading || isCompleting;

  // Enhanced logging for debugging
  useEffect(() => {
    console.log("useProfileSetup: Loading states", {
      isDataLoading,
      isSubmitLoading,
      isCompleting,
      totalLoading: isLoading
    });
  }, [isDataLoading, isSubmitLoading, isCompleting, isLoading]);

  // Force completion after a timeout
  useEffect(() => {
    if (isCompleting && !completionTimeoutRef.current) {
      console.log("Setting up safety timeout for profile completion");
      completionTimeoutRef.current = setTimeout(() => {
        console.warn("Forcing profile setup completion due to timeout");
        setIsCompleting(false);
        onComplete();
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
  }, []);

  // Handle skip action
  const handleSkip = useCallback(() => {
    console.log("Skipping profile setup");
    cleanupTimeouts();
    if (onSkip) {
      onSkip();
    }
  }, [onSkip, cleanupTimeouts]);

  // Handle completion with safety timeout
  const handleComplete = useCallback(async () => {
    if (hasCompletedRef.current || isCompleting) {
      console.log("Completion already in progress, ignoring duplicate request");
      return;
    }

    console.log("Completing profile setup with data:", profileData);
    hasCompletedRef.current = true;
    setIsCompleting(true);
    
    try {
      await handleSubmit(profileData);
      
      // Clear completion flags and redirect
      localStorage.removeItem("newSignUp");
      setIsCompleting(false);
      cleanupTimeouts();
      onComplete();
      
    } catch (error) {
      console.error("Error in handleComplete:", error);
      toast.error("An error occurred, but we'll continue anyway");
      setIsCompleting(false);
      cleanupTimeouts();
      onComplete();
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
