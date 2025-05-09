
import { z } from "zod";
import { getDefaultDataSharingSettings } from "./privacyUtils";

/**
 * Validates and cleans profile data before submission
 * @param profileData Raw profile data
 * @returns [isValid, cleanedData]
 */
export function validateAndCleanProfileData(profileData: any): [boolean, any] {
  try {
    // Make sure we have an object
    if (!profileData || typeof profileData !== 'object') {
      console.error("Invalid profile data format");
      return [false, null];
    }

    // Create a cleaned data object
    const cleanedData = {
      ...profileData,
      // Ensure data sharing settings are complete
      data_sharing_settings: {
        ...getDefaultDataSharingSettings(),
        ...(profileData.data_sharing_settings || {})
      }
    };

    // Specific cleaning operations
    if (cleanedData.name) {
      cleanedData.name = cleanedData.name.trim();
    }

    if (cleanedData.bio && cleanedData.bio.length > 500) {
      cleanedData.bio = cleanedData.bio.substring(0, 500);
    }

    // Add onboarding_completed flag
    cleanedData.onboarding_completed = true;
    
    // Add timestamp
    cleanedData.updated_at = new Date().toISOString();

    return [true, cleanedData];
  } catch (error) {
    console.error("Error cleaning profile data:", error);
    return [false, null];
  }
}

/**
 * Formats profile data for submission to the API
 */
export function formatProfileForSubmission(profileData: any) {
  const [isValid, cleanedData] = validateAndCleanProfileData(profileData);
  
  if (!isValid || !cleanedData) {
    throw new Error("Failed to format profile data for submission");
  }
  
  return cleanedData;
}
