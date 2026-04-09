
import { SettingsFormValues } from "@/hooks/settings/settingsFormSchema";
import { ProfileData } from "../hooks/types";

/**
 * Validates that ProfileData can be properly converted to SettingsFormValues.
 * NOTE: data_sharing_settings validation removed — privacy now lives in privacy_settings table.
 */
export const validateDataStructureCompatibility = (profileData: ProfileData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check address structure
  if (profileData.address) {
    const requiredAddressFields = ['street', 'city', 'state', 'zipCode', 'country'];
    const missingFields = requiredAddressFields.filter(field => !profileData.address[field as keyof typeof profileData.address]);
    
    if (missingFields.length > 0) {
      warnings.push(`Address missing fields: ${missingFields.join(', ')}`);
    }
  }

  // Check core fields
  if (!profileData.name || profileData.name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters');
  }

  if (!profileData.email || !profileData.email.includes('@')) {
    errors.push('Valid email is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Converts ProfileData to SettingsFormValues format
 */
export const convertProfileDataToSettingsForm = (profileData: ProfileData): SettingsFormValues => {
  // Split name into first and last name
  const nameParts = profileData.name?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const settingsData: SettingsFormValues = {
    first_name: firstName,
    last_name: lastName,
    name: profileData.name || '',
    email: profileData.email || '',
    username: profileData.username || '',
    bio: profileData.bio || '',
    profile_image: profileData.profile_image || null,
    date_of_birth: profileData.date_of_birth || undefined,
    address: {
      street: profileData.address?.street || '',
      city: profileData.address?.city || '',
      state: profileData.address?.state || '',
      zipCode: profileData.address?.zipCode || '',
      country: profileData.address?.country || 'US'
    },
    interests: profileData.interests || [],
    importantDates: profileData.importantDates || [],
    // data_sharing_settings kept as minimal defaults for form compat
    // Real privacy settings now live in privacy_settings table
  };

  return settingsData;
};

/**
 * Test function to validate the conversion works properly
 */
export const testDataStructureCompatibility = (profileData: ProfileData) => {
  console.log("=== Testing Profile Data Structure Compatibility ===");
  
  const validation = validateDataStructureCompatibility(profileData);
  console.log("Validation Results:", validation);
  
  if (!validation.isValid) {
    console.error("❌ Profile data validation failed:");
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.warn("⚠️ Validation warnings:");
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  try {
    const convertedData = convertProfileDataToSettingsForm(profileData);
    console.log("✅ Conversion successful");
    
    const hasRequiredFields = convertedData.first_name && 
                             convertedData.last_name &&
                             convertedData.email && 
                             convertedData.address;
    
    if (hasRequiredFields) {
      console.log("✅ All required fields present in converted data");
    } else {
      console.error("❌ Missing required fields in converted data");
    }
    
    return { success: true, convertedData, validation };
  } catch (error) {
    console.error("❌ Conversion failed:", error);
    return { success: false, error, validation };
  }
};
