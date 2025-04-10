
import { useProfileSteps } from "./useProfileSteps";
import { useProfileData } from "./useProfileData";
import { useProfileValidation } from "./useProfileValidation";
import { useProfileSubmission } from "./useProfileSubmission";

interface UseProfileSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const useProfileSetup = ({ onComplete, onSkip }: UseProfileSetupProps) => {
  // Use the smaller, focused hooks
  const { activeStep, steps, handleNext, handleBack } = useProfileSteps();
  const { profileData, updateProfileData } = useProfileData();
  const { isCurrentStepValid } = useProfileValidation(activeStep, profileData);
  const { isLoading, handleComplete, handleSkip } = useProfileSubmission({ 
    onComplete, 
    onSkip 
  });

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
    isCurrentStepValid: isCurrentStepValid(),
    
    // Submission
    isLoading,
    handleComplete: () => handleComplete(profileData),
    handleSkip
  };
};
