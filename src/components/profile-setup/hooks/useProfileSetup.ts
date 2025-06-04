
import { useProfileSteps } from "./useProfileSteps";
import { useProfileData } from "./useProfileData";
import { useProfileValidation } from "./useProfileValidation";
import { useState, useCallback, useRef, useEffect } from "react";
import { useProfileSubmit } from "@/hooks/profile/useProfileSubmit";
import { toast } from "sonner";
import { getDefaultDataSharingSettings } from "@/utils/privacyUtils";

interface UseProfileSetupProps {
  onComplete: (nextStepsOption?: string) => void;
  onSkip?: () => void;
}

export const useProfileSetup = ({ onComplete, onSkip }: UseProfileSetupProps) => {
  const { activeStep, steps, handleNext, handleBack } = useProfileSteps();
  const { profileData, updateProfileData, isLoading: isDataLoading } = useProfileData();
  const { isCurrentStepValid } = useProfileValidation(activeStep, profileData);
  const { isSubmitting, submitProfile, submitError } = useProfileSubmit({
    onSuccess: (data) => {
      console.log("Profile setup completed successfully:", data);
    },
    onComplete: (nextStepsOption?: string) => onComplete(nextStepsOption)
  });
  
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);
  const maxCompletionTime = 10000; // Increased timeout

  const isLoading = isSubmitting || isCompleting || isDataLoading;

  // Ensure data_sharing_settings has all required fields including email
  useEffect(() => {
    if (profileData && (!profileData.data_sharing_settings || 
        Object.keys(profileData.data_sharing_settings).length === 0 ||
        !profileData.data_sharing_settings.email)) {
      
      const defaultSettings = getDefaultDataSharingSettings();
      
      updateProfileData('data_sharing_settings', {
        ...defaultSettings,
        ...(profileData.data_sharing_settings || {})
      });
      
      console.log("Profile setup: Initialized complete data sharing settings:", defaultSettings);
    }
  }, [profileData, updateProfileData]);

  // Clear all loading flags when component mounts
  useEffect(() => {
    localStorage.removeItem("profileSetupLoading");
    setError(null);
    console.log("useProfileSetup: Initialized and cleared loading flags");
    
    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
        completionTimeoutRef.current = null;
      }
      localStorage.removeItem("profileSetupLoading");
    };
  }, []);

  // Enhanced completion handler
  const handleComplete = useCallback(async () => {
    if (hasCompletedRef.current || isCompleting) {
      console.log("Completion already in progress, ignoring duplicate request");
      return;
    }

    console.log("Completing profile setup with data:", profileData);
    
    hasCompletedRef.current = true;
    setIsCompleting(true);
    setError(null);
    
    localStorage.setItem("profileSetupLoading", "true");
    
    try {
      // Submit the profile with comprehensive error handling
      await submitProfile(profileData);
      
      // Clear flags and complete
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("profileSetupLoading");
      localStorage.setItem("onboardingComplete", "true");
      
      setIsCompleting(false);
      
      toast.success("Profile setup complete!");
      
      // Pass the next steps option to the completion handler
      const nextStepsOption = profileData?.next_steps_option;
      console.log("Profile setup complete, next steps option:", nextStepsOption);
      
      // Small delay to ensure state updates
      setTimeout(() => {
        onComplete(nextStepsOption);
      }, 100);
      
    } catch (error: any) {
      console.error("Error in handleComplete:", error);
      setError(error.message || "Failed to complete profile setup");
      
      // Still proceed with completion to avoid blocking user
      localStorage.removeItem("profileSetupLoading");
      localStorage.setItem("onboardingComplete", "true");
      setIsCompleting(false);
      
      toast.error("Profile setup completed with some errors");
      
      const nextStepsOption = profileData?.next_steps_option;
      setTimeout(() => {
        onComplete(nextStepsOption);
      }, 100);
    }
  }, [profileData, submitProfile, onComplete, isCompleting]);

  // Handle skip action
  const handleSkip = useCallback(() => {
    console.log("Skipping profile setup");
    localStorage.removeItem("profileSetupLoading");
    localStorage.removeItem("newSignUp");
    if (onSkip) {
      onSkip();
    }
  }, [onSkip]);

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
