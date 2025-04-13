
import { ProfileData } from "../hooks/types";

export const validateStep = (activeStep: number, profileData: ProfileData): boolean => {
  console.log(`Running validation for step ${activeStep}`, profileData);
  
  // For steps that need validation - but always return true to allow progress
  switch (activeStep) {
    // Basic Info step
    case 0:
      // Log validation check but return true
      console.log("Basic Info validation: ", { name: profileData.name });
      return true;
    
    // Profile step
    case 1:
      console.log("Profile validation: ", { username: profileData.username });
      return true;
    
    // Birthday
    case 2:
      console.log("Birthday validation: ", { dob: profileData.dob });
      return true;
    
    // Shipping Address
    case 3:
      console.log("Shipping Address validation: ", { address: profileData.shipping_address });
      return true;
    
    // Gift Preferences
    case 4:
      console.log("Gift Preferences validation: ", { preferences: profileData.gift_preferences });
      return true;
    
    // Data Sharing
    case 5:
      console.log("Data Sharing validation: ", { settings: profileData.data_sharing_settings });
      return true;
    
    // Next Steps
    case 6:
      console.log("Next Steps validation: ", { option: profileData.next_steps_option });
      return true;
    
    default:
      return true;
  }
};
