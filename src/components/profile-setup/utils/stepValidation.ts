
import { ProfileData } from "../hooks/types";
import { ShippingAddress } from "@/types/shipping";

export const validateStep = (activeStep: number, profileData: ProfileData): boolean => {
  console.log(`Running validation for step ${activeStep}`, profileData);
  
  // For steps that need validation
  switch (activeStep) {
    // Basic Info step
    case 0:
      // Name is required
      console.log("Basic Info validation: ", { name: profileData.name });
      return profileData.name !== undefined && profileData.name.trim() !== '';
    
    // Profile step
    case 1:
      console.log("Profile validation: ", { username: profileData.username });
      return profileData.username !== undefined && profileData.username.trim() !== '';
    
    // Birthday
    case 2:
      console.log("Birthday validation: ", { dob: profileData.dob });
      return true; // Make birthday optional
    
    // Shipping Address
    case 3:
      console.log("Shipping Address validation: ", { address: profileData.shipping_address });
      // First make sure shipping_address exists and is properly initialized
      const address: ShippingAddress = profileData.shipping_address || {
        address_line1: "",
        city: "",
        state: "",
        zip_code: "",
        country: ""
      };
      
      // At minimum, city and country should be provided
      return !!(address.city && address.country);
    
    // Gift Preferences
    case 4:
      console.log("Gift Preferences validation: ", { preferences: profileData.gift_preferences });
      return Array.isArray(profileData.gift_preferences) && profileData.gift_preferences.length > 0;
    
    // Data Sharing
    case 5:
      console.log("Data Sharing validation: ", { settings: profileData.data_sharing_settings });
      return !!profileData.data_sharing_settings;
    
    // Next Steps
    case 6:
      console.log("Next Steps validation: ", { option: profileData.next_steps_option });
      return true; // Always valid since any option is acceptable
    
    default:
      return true;
  }
};
