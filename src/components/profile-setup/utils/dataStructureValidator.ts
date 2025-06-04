
import { SettingsFormValues } from "@/hooks/settings/settingsFormSchema";
import { ProfileData } from "../hooks/types";
import { getDefaultDataSharingSettings } from "@/utils/privacyUtils";

/**
 * Validates that ProfileData can be properly converted to SettingsFormValues
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

  // Check data sharing settings
  if (profileData.data_sharing_settings) {
    const requiredDataSharingFields = ['dob', 'shipping_address', 'gift_preferences', 'email'];
    const missing = requiredDataSharingFields.filter(field => 
      !profileData.data_sharing_settings![field as keyof typeof profileData.data_sharing_settings]
    );
    
    if (missing.length > 0) {
      errors.push(`Data sharing settings missing required fields: ${missing.join(', ')}`);
    }
  } else {
    errors.push('Data sharing settings are required but missing');
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
  // Ensure complete data sharing settings
  const completeDataSharingSettings = {
    ...getDefaultDataSharingSettings(),
    ...(profileData.data_sharing_settings || {})
  };

  // Convert to settings form format
  const settingsData: SettingsFormValues = {
    name: profileData.name || '',
    email: profileData.email || '',
    bio: profileData.bio || '',
    profile_image: profileData.profile_image || null,
    birthday: profileData.birthday || null,
    address: {
      street: profileData.address?.street || '',
      city: profileData.address?.city || '',
      state: profileData.address?.state || '',
      zipCode: profileData.address?.zipCode || '',
      country: profileData.address?.country || 'US'
    },
    interests: profileData.interests || [],
    importantDates: profileData.importantDates || [],
    data_sharing_settings: completeDataSharingSettings
  };

  return settingsData;
};

/**
 * Test function to validate the conversion works properly
 */
export const testDataStructureCompatibility = (profileData: ProfileData) => {
  console.log("=== Testing Profile Data Structure Compatibility ===");
  
  // Validate the profile data
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
  
  // Test conversion
  try {
    const convertedData = convertProfileDataToSettingsForm(profileData);
    console.log("✅ Conversion successful:");
    console.log("Original ProfileData:", profileData);
    console.log("Converted SettingsFormValues:", convertedData);
    
    // Verify required fields are present
    const hasRequiredFields = convertedData.name && 
                             convertedData.email && 
                             convertedData.address && 
                             convertedData.data_sharing_settings;
    
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
