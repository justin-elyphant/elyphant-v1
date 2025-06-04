
import { ProfileData } from '../hooks/types';

export const validateProfileStep = (stepIndex: number, profileData: ProfileData): boolean => {
  console.log(`Validating step ${stepIndex} with data:`, profileData);
  
  switch (stepIndex) {
    case 0: // Basic Info Step
      const isNameValid = profileData.name && profileData.name.trim().length > 0;
      console.log('Basic Info validation - name valid:', isNameValid, 'name:', profileData.name);
      return isNameValid;
      
    case 1: // Address Step
      const address = profileData.address;
      const isAddressValid = !!(
        address &&
        address.street &&
        address.city &&
        address.state &&
        address.zipCode
      );
      console.log('Address validation:', isAddressValid);
      return isAddressValid;
      
    case 2: // Interests Step - Optional, always valid
      console.log('Interests validation: always true');
      return true;
      
    case 3: // Important Dates Step - Optional, always valid
      console.log('Important Dates validation: always true');
      return true;
      
    case 4: // Privacy Step - Optional, always valid
      console.log('Privacy validation: always true');
      return true;
      
    case 5: // Next Steps Step - Optional, always valid
      console.log('Next Steps validation: always true');
      return true;
      
    default:
      console.log('Default validation: true');
      return true;
  }
};
