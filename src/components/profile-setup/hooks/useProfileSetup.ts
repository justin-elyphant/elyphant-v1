import { useProfileSteps } from "./useProfileSteps";
import { useProfileData } from "./useProfileData";
import { useProfileValidation } from "./useProfileValidation";
import { useState, useCallback, useRef, useEffect } from "react";
import { useProfileSubmit } from "@/hooks/profile/useProfileSubmit";
import { toast } from "sonner";
import { getDefaultDataSharingSettings } from "@/utils/privacyUtils";

interface UseProfileSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const useProfileSetup = ({ onComplete, onSkip }: UseProfileSetupProps) => {
  const { activeStep, steps, handleNext, handleBack } = useProfileSteps();
  const { profileData, updateProfileData, isLoading: isDataLoading } = useProfileData();
  const { isCurrentStepValid } = useProfileValidation(activeStep, profileData);
  const { isSubmitting, submitProfile, submitError } = useProfileSubmit({
    onSuccess: () => {
      // Handle success if needed
    },
    onComplete
  });
  
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);
  const maxCompletionTime = 5000; // Increase timeout to 5 seconds

  // More reliable loading state checking
  const isLoading = isSubmitting || isCompleting || isDataLoading;

  // Ensure data_sharing_settings has all required fields
  useEffect(() => {
    if (profileData && (!profileData.data_sharing_settings || 
        Object.keys(profileData.data_sharing_settings).length === 0 ||
        !profileData.data_sharing_settings.email)) {
      
      // Get complete default settings to ensure consistent initialization
      const defaultSettings = getDefaultDataSharingSettings();
      
      // Update profile data with complete settings
      updateProfileData('data_sharing_settings', {
        ...defaultSettings,
        ...(profileData.data_sharing_settings || {})
      });
      
      console.log("Profile setup: Initialized complete data sharing settings:", defaultSettings);
    }
  }, [profileData, updateProfileData]);

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
      isSubmitting,
      isCompleting,
      totalLoading: isLoading,
      nextStepsOption: profileData.next_steps_option,
      activeStep,
      hasCompletedRef: hasCompletedRef.current,
      error,
      data_sharing_settings: profileData.data_sharing_settings
    });
  }, [isDataLoading, isSubmitting, isCompleting, isLoading, profileData.next_steps_option, activeStep, error, profileData.data_sharing_settings]);

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

  // Handle completion with better preparation for privacy settings
  const handleComplete = useCallback(async () => {
    if (hasCompletedRef.current || isCompleting) {
      console.log("Completion already in progress, ignoring duplicate request");
      return;
    }

    console.log("Completing profile setup with data:", profileData);
    
    // Always ensure data_sharing_settings is complete before submission
    const completeSettings = {
      ...getDefaultDataSharingSettings(),
      ...(profileData.data_sharing_settings || {})
    };
    
    // Update with complete settings
    updateProfileData('data_sharing_settings', completeSettings);
    console.log("Updated data sharing settings before completion:", completeSettings);
    
    hasCompletedRef.current = true;
    setIsCompleting(true);
    setError(null);
    
    // Set loading flag in localStorage
    localStorage.setItem("profileSetupLoading", "true");
    
    try {
      // Ensure we have the latest data with all sharing settings
      const finalProfileData = {
        ...profileData,
        data_sharing_settings: completeSettings
      };
      
      await submitProfile(finalProfileData);
      
      // Clear completion flags and redirect
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("profileSetupLoading");
      localStorage.removeItem("signupRateLimited");
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
  }, [profileData, submitProfile, onComplete, isCompleting, cleanupTimeouts, updateProfileData]);

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
