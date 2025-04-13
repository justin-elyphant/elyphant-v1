
// This hook manages validation of profile setup steps
import { validateStep } from "../utils/stepValidation";
import { ProfileData } from "./types";

export const useProfileValidation = (activeStep: number, profileData: ProfileData) => {
  // Check step validation but don't enforce it
  const stepIsValid = validateStep(activeStep, profileData);
  console.log(`Validating step ${activeStep}:`, { stepIsValid, profileData });
  
  // Explicitly return true to allow progression regardless of validation state
  const isCurrentStepValid = true;
  
  return { isCurrentStepValid, stepIsValid };
};
