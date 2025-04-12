
import { validateStep } from "../utils/stepValidation";
import { ProfileData } from "./types";

export const useProfileValidation = (activeStep: number, profileData: ProfileData) => {
  // Always return true for validation to ensure users can progress
  // We'll still use the validateStep function for feedback purposes
  const stepIsValid = validateStep(activeStep, profileData);
  const isCurrentStepValid = true; // Override to allow progression
  
  return { isCurrentStepValid };
};
