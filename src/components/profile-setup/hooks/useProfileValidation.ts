
import { ProfileData } from "./useProfileData";
import { validateStep } from "../utils/stepValidation";

export const useProfileValidation = (activeStep: number, profileData: ProfileData) => {
  const isCurrentStepValid = () => {
    return validateStep(activeStep, profileData);
  };

  return {
    isCurrentStepValid
  };
};
