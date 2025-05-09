
import { useMemo } from 'react';
import { ProfileData } from './types';

export const useProfileValidation = (activeStep: number, profileData: ProfileData) => {
  const isCurrentStepValid = useMemo(() => {
    // Check validity based on active step
    switch (activeStep) {
      case 0: // Profile step (combined with name now)
        return !!profileData.name && profileData.name.trim().length >= 2 && 
               (!profileData.username || profileData.username.length >= 3);
      
      case 1: // Date of birth
        return !!profileData.dob;
      
      case 2: // Shipping address
        return !!profileData.shipping_address && 
               !!profileData.shipping_address.street &&
               !!profileData.shipping_address.city &&
               !!profileData.shipping_address.state &&
               !!profileData.shipping_address.zipCode &&
               !!profileData.shipping_address.country;
      
      case 3: // Gift preferences
        return Array.isArray(profileData.gift_preferences) && 
               profileData.gift_preferences.length > 0;
      
      case 4: // Data sharing
        return !!profileData.data_sharing_settings && 
               !!profileData.data_sharing_settings.dob &&
               !!profileData.data_sharing_settings.shipping_address &&
               !!profileData.data_sharing_settings.gift_preferences &&
               !!profileData.data_sharing_settings.email; // Added email check
      
      case 5: // Next steps
        return true; // Always valid - any option or no option is fine
      
      default:
        return false;
    }
  }, [activeStep, profileData]);

  return { isCurrentStepValid };
};
