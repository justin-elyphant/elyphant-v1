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
        line2: profileData.address?.line2 || "",
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
  
  // Extract first_name and last_name from name
  const nameParts = cleanedData.name?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Extract birth_year from birthday if available
  let birthYear = new Date().getFullYear() - 25; // Default
  if (cleanedData.birthday?.month && cleanedData.birthday?.day) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const birthdayThisYear = new Date(currentYear, cleanedData.birthday.month - 1, cleanedData.birthday.day);
    
    if (birthdayThisYear > currentDate) {
      birthYear = currentYear - 25 - 1;
    } else {
      birthYear = currentYear - 25;
    }
  }
  
  // Add database-specific fields with proper mapping
  const databaseData = {
    ...cleanedData,
    first_name: firstName,
    last_name: lastName,
    username: cleanedData.username || `user_${Date.now()}`,
    birth_year: birthYear,
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
  if (!databaseProfile) {
    console.warn("⚠️ No database profile provided to mapDatabaseToSettingsForm");
    return null;
  }

  console.log("🔄 Mapping database profile to settings form:", {
    id: databaseProfile.id,
    name: databaseProfile.name,
    first_name: databaseProfile.first_name,
    last_name: databaseProfile.last_name,
    email: databaseProfile.email,
    username: databaseProfile.username,
    profile_image: databaseProfile.profile_image,
    dob: databaseProfile.dob,
    birth_year: databaseProfile.birth_year,
    shipping_address: databaseProfile.shipping_address,
    onboarding_completed: databaseProfile.onboarding_completed
  });

  // Extract first_name and last_name 
  const firstName = databaseProfile.first_name || "";
  const lastName = databaseProfile.last_name || "";
  
  // Create date of birth from stored dob (MM-DD) and birth_year
  let dateOfBirth: Date | null = null;
  const birthday = parseBirthdayFromStorage(databaseProfile.dob);
  const birthYear = databaseProfile.birth_year;
  
  if (birthday && birthYear) {
    dateOfBirth = new Date(birthYear, birthday.month - 1, birthday.day);
  }

  // Parse existing important dates
  let importantDates = Array.isArray(databaseProfile.important_dates)
    ? databaseProfile.important_dates.map((date: any) => ({
        date: new Date(date.date),
        description: date.title || date.description || ""
      }))
    : [];

  // Auto-populate birthday if it exists and isn't already in important dates
  if (birthday && birthYear) {
    const birthdayExists = importantDates.some(date => {
      const existingDate = new Date(date.date);
      return existingDate.getMonth() + 1 === birthday.month && 
             existingDate.getDate() === birthday.day;
    });

    if (!birthdayExists) {
      const birthdayDate = new Date(birthYear, birthday.month - 1, birthday.day);
      importantDates.unshift({
        date: birthdayDate,
        description: "My Birthday"
      });
    }
  }

  console.log("🔍 Profile data mapping debug:", {
    first_name: firstName,
    last_name: lastName,
    date_of_birth: dateOfBirth,
    profile_image: databaseProfile.profile_image ? "present" : "missing",
    onboarding_completed: databaseProfile.onboarding_completed
  });

  // Ensure we have a proper address object - check both shipping_address and address
  const shippingAddress = databaseProfile.shipping_address || databaseProfile.address || {};

  // Parse formatted address if individual components are missing
  const parseFormattedAddress = (formattedAddress: string) => {
    // Basic parsing for US addresses like "123 Main St, City, State 12345, Country"
    const parts = formattedAddress.split(', ');
    if (parts.length >= 3) {
      const street = parts[0] || "";
      const city = parts[1] || "";
      const stateZipMatch = parts[2]?.match(/^(.+?)\s+(\d{5}(?:-\d{4})?)$/) || [];
      const state = stateZipMatch[1] || parts[2] || "";
      const zipCode = stateZipMatch[2] || "";
      const country = parts[3] || "US";
      
      return { street, city, state, zipCode, country };
    }
    // Fallback: use formatted address as street
    return { 
      street: formattedAddress, 
      city: "", 
      state: "", 
      zipCode: "", 
      country: "US" 
    };
  };

  // If we have formatted_address but missing individual components, parse it
  let addressComponents = {
    street: shippingAddress.address_line1 || shippingAddress.street || "",
    city: shippingAddress.city || "",
    state: shippingAddress.state || "",
    zipCode: shippingAddress.zip_code || shippingAddress.zipCode || "",
    country: shippingAddress.country || "US"
  };

  // If components are missing but we have formatted_address, parse it
  if (!addressComponents.street && !addressComponents.city && shippingAddress.formatted_address) {
    const parsed = parseFormattedAddress(shippingAddress.formatted_address);
    addressComponents = { ...addressComponents, ...parsed };
  }

  // Handle apartment/suite field variations
  const apartmentField = shippingAddress.address_line2 || 
                        shippingAddress.line2 || 
                        shippingAddress.addressLine2 || 
                        "";

  const mappedData = {
    first_name: firstName,
    last_name: lastName,
    email: databaseProfile.email || "",
    username: databaseProfile.username || "",
    bio: databaseProfile.bio || "",
    profile_image: databaseProfile.profile_image || null,
    date_of_birth: dateOfBirth,
    // Legacy compatibility field
    name: databaseProfile.name || `${firstName} ${lastName}`.trim(),
    address: {
      street: addressComponents.street,
      line2: apartmentField,
      city: addressComponents.city,
      state: addressComponents.state,
      zipCode: addressComponents.zipCode,
      country: addressComponents.country
    },
    interests: Array.isArray(databaseProfile.interests) ? databaseProfile.interests : [],
    importantDates: importantDates,
    data_sharing_settings: {
      ...getDefaultDataSharingSettings(),
      ...(databaseProfile.data_sharing_settings || {})
    }
  };

  console.log("✅ Mapped data result:", {
    ...mappedData,
    profile_image_preview: mappedData.profile_image ? 
      `${mappedData.profile_image.substring(0, 50)}...` : null
  });
  return mappedData;
}
