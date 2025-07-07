import { z } from "zod";
import { getDefaultDataSharingSettings } from "./privacyUtils";
import { ProfileData, BirthdayData } from "@/components/profile-setup/hooks/types";

/**
 * Database-specific profile data type that extends ProfileData with additional fields
 */
type DatabaseProfileData = ProfileData & {
  onboarding_completed?: boolean;
  updated_at?: string;
};

/**
 * Converts birthday month/day to a formatted string for storage
 */
export function formatBirthdayForStorage(birthday: BirthdayData | null): string | null {
  if (!birthday) return null;
  return `${birthday.month.toString().padStart(2, '0')}-${birthday.day.toString().padStart(2, '0')}`;
}

/**
 * Converts stored birthday string back to month/day object
 */
export function parseBirthdayFromStorage(birthdayStr: string | null): BirthdayData | null {
  if (!birthdayStr) return null;
  
  try {
    const [monthStr, dayStr] = birthdayStr.split('-');
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { month, day };
    }
  } catch (error) {
    console.error("Error parsing birthday from storage:", error);
  }
  
  return null;
}

/**
 * Validates and cleans profile data before submission
 */
export function validateAndCleanProfileData(profileData: ProfileData): [boolean, ProfileData | null] {
  try {
    // Make sure we have an object
    if (!profileData || typeof profileData !== 'object') {
      console.error("Invalid profile data format");
      return [false, null];
    }

    // Create a cleaned data object with proper type conversion
    const cleanedData: ProfileData = {
      ...profileData,
      // Ensure data sharing settings are complete
      data_sharing_settings: {
        ...getDefaultDataSharingSettings(),
        ...(profileData.data_sharing_settings || {})
      },
      // Handle birthday validation
      birthday: profileData.birthday && 
                profileData.birthday.month >= 1 && 
                profileData.birthday.month <= 12 &&
                profileData.birthday.day >= 1 && 
                profileData.birthday.day <= 31 
                ? profileData.birthday 
                : null,
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

    console.log("Cleaned profile data:", JSON.stringify(cleanedData, null, 2));
    return [true, cleanedData];
  } catch (error) {
    console.error("Error cleaning profile data:", error);
    return [false, null];
  }
}

/**
 * Formats profile data for submission to the API with database-specific fields
 */
export function formatProfileForSubmission(profileData: ProfileData): any {
  const [isValid, cleanedData] = validateAndCleanProfileData(profileData);
  
  if (!isValid || !cleanedData) {
    throw new Error("Failed to format profile data for submission");
  }
  
  // Add database-specific fields
  const databaseData = {
    ...cleanedData,
    // Convert birthday to storage format
    dob: formatBirthdayForStorage(cleanedData.birthday),
    onboarding_completed: true,
    updated_at: new Date().toISOString()
  };
  
  return databaseData;
}

/**
 * Maps database profile data to settings form format
 */
export function mapDatabaseToSettingsForm(databaseProfile: any) {
  if (!databaseProfile) return null;

  return {
    name: databaseProfile.name || "",
    email: databaseProfile.email || "",
    username: databaseProfile.username || "",
    bio: databaseProfile.bio || "",
    profile_image: databaseProfile.profile_image || null,
    birthday: parseBirthdayFromStorage(databaseProfile.dob),
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
