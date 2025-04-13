
import { useProfileSteps } from "./useProfileSteps";
import { useProfileData } from "./useProfileData";
import { useProfileValidation } from "./useProfileValidation";
import { useProfileSubmission } from "./useProfileSubmission";
import { useProfileSubmit } from "@/hooks/profile/useProfileSubmit";
import { useState, useEffect } from "react";

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
  
  // Add completion tracking state
  const [isCompleting, setIsCompleting] = useState(false);

  const isLoading = isDataLoading || isSubmissionLoading || isSubmitLoading || isCompleting;

  // Safety timeout to prevent stuck state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isCompleting) {
      console.log("Profile setup completion in progress");
      timeoutId = setTimeout(() => {
        console.warn("Forcing profile setup completion due to timeout");
        setIsCompleting(false);
        onComplete();
      }, 7000); // 7 second timeout
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isCompleting, onComplete]);

  const handleComplete = async () => {
    console.log("Completing profile setup with data:", profileData);
    setIsCompleting(true);
    
    try {
      // Use our enhanced submit functionality
      await handleSubmit(profileData);
      // This will automatically call onComplete from within handleSubmit
    } catch (error) {
      console.error("Error in handleComplete:", error);
      // Even in case of error, we want to proceed to prevent getting stuck
      setIsCompleting(false);
      onComplete();
    }
  };

  return {
    // Step navigation
    activeStep,
    steps,
    handleNext,
    handleBack,
    
    // Profile data
    profileData,
    updateProfileData,
    
    // Validation
    isCurrentStepValid,
    
    // Submission
    isLoading,
    handleComplete,
    handleSkip
  };
};
