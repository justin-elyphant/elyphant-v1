
// This hook manages validation of profile setup steps
import { validateStep } from "../utils/stepValidation";
import { ProfileData } from "./types";

export const useProfileValidation = (activeStep: number, profileData: ProfileData) => {
  // Check step validation with the appropriate validation logic
  const stepIsValid = validateStep(activeStep, profileData);
  console.log(`Validating step ${activeStep}:`, { stepIsValid, profileData });
  
  // Use the actual validation result to determine if the step is valid
  const isCurrentStepValid = stepIsValid;
  
  return { isCurrentStepValid, stepIsValid };
};
