
import { ProfileData } from "../hooks/types";

export const validateStep = (activeStep: number, profileData: ProfileData): boolean => {
  // For steps that need to be fixed
  switch (activeStep) {
    // Basic Info step
    case 0:
      return !!profileData.name && profileData.name.trim() !== '';
    
    // Profile
    case 1:
      return !!profileData.username && profileData.username.trim() !== '';
    
    // Birthday
    case 2:
      return true; // Allow skipping this step for now
    
    // Shipping Address
    case 3:
      return true; // Allow skipping this step for now
    
    // Gift Preferences
    case 4:
      return true; // Allow skipping this step for now
    
    // Data Sharing
    case 5:
      return true; // Allow skipping this step for now
    
    // Next Steps
    case 6:
      return !!profileData.next_steps_option;
    
    default:
      return true;
  }
};
