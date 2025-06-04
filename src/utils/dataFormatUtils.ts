
import { z } from "zod";
import { getDefaultDataSharingSettings } from "./privacyUtils";
import { ProfileData } from "@/components/profile-setup/hooks/types";

/**
 * Validates and cleans profile data before submission
 */
export function validateAndCleanProfileData(profileData: ProfileData): [boolean, any] {
  try {
    // Make sure we have an object
    if (!profileData || typeof profileData !== 'object') {
      console.error("Invalid profile data format");
      return [false, null];
    }

    // Create a cleaned data object with proper type conversion
    const cleanedData = {
      ...profileData,
      // Ensure data sharing settings are complete
      data_sharing_settings: {
        ...getDefaultDataSharingSettings(),
        ...(profileData.data_sharing_settings || {})
      },
      // Handle birthday conversion
      birthday: profileData.birthday instanceof Date ? profileData.birthday : null,
      // Ensure interests is an array
      interests: Array.isArray(profileData.interests) ? profileData.interests : [],
      // Ensure importantDates is an array with proper structure
      importantDates: Array.isArray(profileData.importantDates) 
        ? profileData.importantDates.filter(date => date.date && date.description)
        : [],
      // Ensure address has all required fields
      address: {
        street: profileData.address?.street || "",
        city: profileData.address?.city || "",
        state: profileData.address?.state || "",
        zipCode: profileData.address?.zipCode || "",
        country: profileData.address?.country || "US"
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

    console.log("Cleaned profile data:", JSON.stringify(cleanedData, null, 2));
    return [true, cleanedData];
  } catch (error) {
    console.error("Error cleaning profile data:", error);
    return [false, null];
  }
}

/**
 * Formats profile data for submission to the API
 */
export function formatProfileForSubmission(profileData: ProfileData) {
  const [isValid, cleanedData] = validateAndCleanProfileData(profileData);
  
  if (!isValid || !cleanedData) {
    throw new Error("Failed to format profile data for submission");
  }
  
  return cleanedData;
}

/**
 * Maps database profile data to settings form format
 */
export function mapDatabaseToSettingsForm(databaseProfile: any) {
  if (!databaseProfile) return null;

  return {
    name: databaseProfile.name || "",
    email: databaseProfile.email || "",
    bio: databaseProfile.bio || "",
    profile_image: databaseProfile.profile_image || null,
    birthday: databaseProfile.dob ? new Date(databaseProfile.dob) : null,
    address: {
      street: databaseProfile.shipping_address?.address_line1 || databaseProfile.shipping_address?.street || "",
      city: databaseProfile.shipping_address?.city || "",
      state: databaseProfile.shipping_address?.state || "",
      zipCode: databaseProfile.shipping_address?.zip_code || databaseProfile.shipping_address?.zipCode || "",
      country: databaseProfile.shipping_address?.country || "US"
    },
    interests: Array.isArray(databaseProfile.interests) ? databaseProfile.interests : [],
    importantDates: Array.isArray(databaseProfile.important_dates)
      ? databaseProfile.important_dates.map((date: any) => ({
          date: new Date(date.date),
          description: date.title || date.description || ""
        }))
      : [],
    data_sharing_settings: {
      ...getDefaultDataSharingSettings(),
      ...(databaseProfile.data_sharing_settings || {})
    }
  };
}
