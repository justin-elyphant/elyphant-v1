
import { validateStep } from "../utils/stepValidation";
import { ProfileData } from "./types";

export const useProfileValidation = (activeStep: number, profileData: ProfileData) => {
  const isCurrentStepValid = () => {
    return validateStep(activeStep, profileData);
  };

  return { isCurrentStepValid };
};
