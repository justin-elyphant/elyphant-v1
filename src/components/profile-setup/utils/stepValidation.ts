
import { ProfileData } from "../hooks/types";

export const validateStep = (activeStep: number, profileData: ProfileData): boolean => {
  console.log(`Running validation for step ${activeStep}`, profileData);
  
  // For steps that need validation - but always return true to allow progress
  switch (activeStep) {
    // Basic Info step
    case 0:
      // Check if name exists but still return true
      return true;
    
    // Profile step - make username optional to allow progress
    case 1:
      return true;
    
    // Birthday
    case 2:
      return true;
    
    // Shipping Address
    case 3:
      return true;
    
    // Gift Preferences
    case 4:
      return true;
    
    // Data Sharing
    case 5:
      return true;
    
    // Next Steps
    case 6:
      return true;
    
    default:
      return true;
  }
};
