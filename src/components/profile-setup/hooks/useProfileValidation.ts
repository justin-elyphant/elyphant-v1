
import { validateStep } from "../utils/stepValidation";
import { ProfileData } from "./types";

export const useProfileValidation = (activeStep: number, profileData: ProfileData) => {
  // Now directly returns the boolean result rather than a function
  const isCurrentStepValid = validateStep(activeStep, profileData);

  return { isCurrentStepValid };
};
