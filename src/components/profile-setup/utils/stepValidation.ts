
import { ProfileData } from "../hooks/types";

export const validateStep = (activeStep: number, profileData: ProfileData): boolean => {
  console.log(`Running validation for step ${activeStep}`, profileData);
  
  // For steps that need validation
  switch (activeStep) {
    // Basic Info step
    case 0:
      console.log("Basic Info validation: ", { name: profileData.name });
      return profileData.name !== undefined && profileData.name.trim() !== '';
    
    // Birthday
    case 1:
      console.log("Birthday validation: ", { birthday: profileData.birthday });
      return true; // Make birthday optional
    
    // Address
    case 2:
      console.log("Address validation: ", { address: profileData.address });
      // Check if address exists and has required fields
      const address = profileData.address;
      if (!address) return false;
      
      // At minimum, city and country should be provided
      return !!(address.city && address.country);
    
    // Gift Preferences (interests)
    case 3:
      console.log("Gift Preferences validation: ", { interests: profileData.interests });
      return Array.isArray(profileData.interests) && profileData.interests.length > 0;
    
    // Data Sharing
    case 4:
      console.log("Data Sharing validation: ", { settings: profileData.data_sharing_settings });
      return !!profileData.data_sharing_settings;
    
    // Next Steps
    case 5:
      console.log("Next Steps validation: ", { option: profileData.next_steps_option });
      return true; // Always valid since any option is acceptable
    
    default:
      return true;
  }
};
