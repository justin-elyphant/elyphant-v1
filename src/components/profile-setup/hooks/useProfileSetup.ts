
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
  const [error, setError] = useState<string | null>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);
  const maxCompletionTime = 5000; // Increase timeout to 5 seconds

  // More reliable loading state checking
  const isLoading = isSubmitLoading || isCompleting || isDataLoading;

  // Clear all loading flags when component mounts
  useEffect(() => {
    // Clear any stale loading flags
    localStorage.removeItem("profileSetupLoading");
    setError(null);
    console.log("useProfileSetup: Initialized and cleared loading flags");
    
    // Also clear when component unmounts
    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
        completionTimeoutRef.current = null;
      }
      localStorage.removeItem("profileSetupLoading");
    };
  }, []);

  // Enhanced logging for debugging
  useEffect(() => {
    console.log("useProfileSetup state:", {
      isDataLoading,
      isSubmitLoading,
      isCompleting,
      totalLoading: isLoading,
      nextStepsOption: profileData.next_steps_option,
      activeStep,
      hasCompletedRef: hasCompletedRef.current,
      error
    });
  }, [isDataLoading, isSubmitLoading, isCompleting, isLoading, profileData.next_steps_option, activeStep, error]);

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
          localStorage.removeItem("signupRateLimited"); // Clear rate limit flag
          toast.success("Setup complete!");
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
    localStorage.removeItem("signupRateLimited"); // Clear rate limit flag
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
    setError(null);
    
    // Set loading flag in localStorage
    localStorage.setItem("profileSetupLoading", "true");
    
    try {
      await handleSubmit(profileData);
      
      // Clear completion flags and redirect
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("profileSetupLoading");
      localStorage.removeItem("signupRateLimited"); // Clear rate limit flag
      setIsCompleting(false);
      cleanupTimeouts();
      
      // Short timeout before completing to ensure state updates
      setTimeout(() => {
        onComplete();
      }, 100);
    } catch (error: any) {
      console.error("Error in handleComplete:", error);
      setError(error.message || "An error occurred, continuing anyway");
      toast.error("Setup completed with some errors. Your data may be incomplete.");
      
      // Clear loading states and force completion
      setIsCompleting(false);
      localStorage.removeItem("profileSetupLoading");
      localStorage.removeItem("signupRateLimited"); // Clear rate limit flag
      cleanupTimeouts();
      
      // Even on error, we still want to complete the flow to prevent users getting stuck
      setTimeout(() => {
        onComplete();
      }, 100);
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
    error,
    handleComplete,
    handleSkip
  };
};
