
import { useProfileSteps } from "./useProfileSteps";
import { useProfileData } from "./useProfileData";
import { useProfileValidation } from "./useProfileValidation";
import { useProfileSubmission } from "./useProfileSubmission";
import { useProfileSubmit } from "@/hooks/profile/useProfileSubmit";

interface UseProfileSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const useProfileSetup = ({ onComplete, onSkip }: UseProfileSetupProps) => {
  // Use the smaller, focused hooks
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

  const isLoading = isDataLoading || isSubmissionLoading || isSubmitLoading;

  const handleComplete = () => {
    // Use our enhanced submit functionality that ensures data flows to settings
    handleSubmit(profileData);
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
