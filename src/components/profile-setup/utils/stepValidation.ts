
import { ProfileData } from "../hooks/types";
import { validateProfileStep } from "./sharedValidation";

export const validateStep = (activeStep: number, profileData: ProfileData): boolean => {
  return validateProfileStep(activeStep, profileData);
};
