
import { ProfileData } from "../hooks/types";

export const validateStep = (activeStep: number, profileData: ProfileData): boolean => {
  // For steps that need validation
  switch (activeStep) {
    // Basic Info step
    case 0:
      // Only require a name for the first step
      return !!profileData.name && profileData.name.trim() !== '';
    
    // Profile step - make username optional to allow progress
    case 1:
      return true;
    
    // Birthday
    case 2:
      return true; // Allow skipping this step
    
    // Shipping Address
    case 3:
      return true; // Allow skipping this step
    
    // Gift Preferences
    case 4:
      return true; // Allow skipping this step
    
    // Data Sharing
    case 5:
      return true; // Allow skipping this step
    
    // Next Steps
    case 6:
      return true; // Allow proceeding even without selection
    
    default:
      return true;
  }
};
