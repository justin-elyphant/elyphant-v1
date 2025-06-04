
import { useMemo } from 'react';
import { ProfileData } from './types';

export const useProfileValidation = (activeStep: number, profileData: ProfileData) => {
  const isCurrentStepValid = useMemo(() => {
    // Check validity based on active step
    switch (activeStep) {
      case 0: // Basic info (name, email, username)
        return !!profileData.name && 
               profileData.name.trim().length >= 2 && 
               !!profileData.email &&
               profileData.email.includes('@');
      
      case 1: // Birthday
        return !!profileData.birthday;
      
      case 2: // Address
        return !!profileData.address && 
               !!profileData.address.street &&
               !!profileData.address.city &&
               !!profileData.address.state &&
               !!profileData.address.zipCode &&
               !!profileData.address.country;
      
      case 3: // Interests (gift preferences)
        return Array.isArray(profileData.interests) && 
               profileData.interests.length > 0;
      
      case 4: // Data sharing
        return !!profileData.data_sharing_settings && 
               !!profileData.data_sharing_settings.dob &&
               !!profileData.data_sharing_settings.shipping_address &&
               !!profileData.data_sharing_settings.gift_preferences &&
               !!profileData.data_sharing_settings.email;
      
      case 5: // Next steps
        return true; // Always valid - any option or no option is fine
      
      default:
        return false;
    }
  }, [activeStep, profileData]);

  return { isCurrentStepValid };
};
