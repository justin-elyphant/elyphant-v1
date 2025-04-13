
import { useProfileSteps } from "./useProfileSteps";
import { useProfileData } from "./useProfileData";
import { useProfileValidation } from "./useProfileValidation";
import { useState, useCallback, useRef } from "react";
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

  const isLoading = isDataLoading || isSubmitLoading || isCompleting;

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
    if (onSkip) {
      onSkip();
    }
  }, [onSkip]);

  // Handle completion with safety timeout
  const handleComplete = useCallback(async () => {
    // Prevent multiple completion attempts
    if (hasCompletedRef.current || isCompleting) {
      console.log("Completion already in progress, ignoring duplicate request");
      return;
    }

    console.log("Completing profile setup with data:", profileData);
    hasCompletedRef.current = true;
    setIsCompleting(true);
    
    // Set up safety timeout
    completionTimeoutRef.current = setTimeout(() => {
      console.warn("Forcing profile setup completion due to timeout");
      setIsCompleting(false);
      onComplete();
    }, 4000);
    
    try {
      await handleSubmit(profileData);
    } catch (error) {
      console.error("Error in handleComplete:", error);
      toast.error("An error occurred, but we'll continue anyway");
      // Still complete on error to prevent being stuck
      setIsCompleting(false);
      onComplete();
    } finally {
      cleanupTimeouts();
    }
  }, [profileData, handleSubmit, onComplete, isCompleting, cleanupTimeouts]);

  // Clean up on unmount
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
