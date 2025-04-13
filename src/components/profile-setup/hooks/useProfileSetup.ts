import { useProfileSteps } from "./useProfileSteps";
import { useProfileData } from "./useProfileData";
import { useProfileValidation } from "./useProfileValidation";
import { useProfileSubmission } from "./useProfileSubmission";
import { useProfileSubmit } from "@/hooks/profile/useProfileSubmit";
import { useState, useEffect, useRef, useCallback } from "react";

interface UseProfileSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const useProfileSetup = ({ onComplete, onSkip }: UseProfileSetupProps) => {
  const { activeStep, steps, handleNext, handleBack } = useProfileSteps();
  const { profileData, updateProfileData, isLoading: isDataLoading } = useProfileData();
  const { isCurrentStepValid } = useProfileValidation(activeStep, profileData);
  const { isLoading: isSubmissionLoading, handleSkip } = useProfileSubmission({ 
    onComplete, 
    onSkip 
  });
  const { isLoading: isSubmitLoading, handleSubmit } = useProfileSubmit({
    onComplete
  });
  
  const isCompletingRef = useRef(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const isLoading = isDataLoading || isSubmissionLoading || isSubmitLoading || isCompleting;

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isCompleting) {
      console.log("Profile setup completion in progress");
      timeoutId = setTimeout(() => {
        console.warn("Forcing profile setup completion due to timeout");
        setIsCompleting(false);
        isCompletingRef.current = false;
        onComplete();
      }, 5000); // 5 second timeout
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isCompleting, onComplete]);

  const handleComplete = useCallback(async () => {
    if (isCompletingRef.current) {
      console.log("Completion already in progress, ignoring duplicate request");
      return;
    }

    console.log("Completing profile setup with data:", profileData);
    isCompletingRef.current = true;
    setIsCompleting(true);
    
    try {
      await handleSubmit(profileData);
    } catch (error) {
      console.error("Error in handleComplete:", error);
      isCompletingRef.current = false;
      setIsCompleting(false);
      onComplete();
    }
  }, [profileData, handleSubmit, onComplete]);

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
