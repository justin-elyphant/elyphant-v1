
import { z } from 'zod';

/**
 * Converts a date object to ISO string, with null/undefined handling
 */
export function safeDateToIsoString(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  try {
    if (typeof date === 'string') {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString();
      }
      return date; // Return the original string if it can't be parsed
    }
    return date.toISOString();
  } catch (error) {
    console.error("Error converting date:", error);
    return null;
  }
}

/**
 * Ensures we have properly structured gift preferences
 */
export function normalizeGiftPreferences(preferences: any[] | null | undefined): any[] {
  if (!preferences || !Array.isArray(preferences)) {
    return [];
  }
  
  return preferences.map(pref => {
    // If it's already a string, convert to object format
    if (typeof pref === 'string') {
      return { category: pref, importance: 'medium' };
    }
    
    // If it's an object make sure it has required properties
    if (typeof pref === 'object' && pref !== null) {
      return {
        category: pref.category || 'other',
        importance: pref.importance || 'medium'
      };
    }
    
    return { category: 'other', importance: 'medium' };
  });
}

/**
 * Format profile data for API submission
 */
export function formatProfileForSubmission(profileData: any): any {
  // Create a deep copy to avoid mutating the original object
  const formattedData = JSON.parse(JSON.stringify(profileData));
  
  // Format date fields
  if (formattedData.dob) {
    formattedData.dob = safeDateToIsoString(formattedData.dob);
  }
  if (formattedData.birthday) {
    formattedData.dob = safeDateToIsoString(formattedData.birthday);
    delete formattedData.birthday; // Use dob instead of birthday for consistency
  }
  
  // Normalize important dates
  if (formattedData.important_dates && Array.isArray(formattedData.important_dates)) {
    formattedData.important_dates = formattedData.important_dates.map((date: any) => ({
      date: safeDateToIsoString(date.date) || new Date().toISOString(),
      description: date.description || ''
    }));
  }
  
  // Ensure shipping_address is properly structured
  if (!formattedData.shipping_address) {
    formattedData.shipping_address = {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    };
  }
  
  // Normalize gift preferences
  formattedData.gift_preferences = normalizeGiftPreferences(formattedData.gift_preferences);
  
  // Ensure we have data sharing settings
  if (!formattedData.data_sharing_settings) {
    formattedData.data_sharing_settings = {
      dob: 'friends',
      shipping_address: 'friends',
      gift_preferences: 'public',
      email: 'private'
    };
  }
  
  // Add timestamp
  formattedData.updated_at = new Date().toISOString();
  
  return formattedData;
}

/**
 * Validate and clean profile form data
 * Returns a tuple of [isValid, cleanedData]
 */
export function validateAndCleanProfileData(data: any): [boolean, any | null] {
  try {
    // Basic validation of required fields
    if (!data.name || data.name.trim().length < 2) {
      console.error("Name validation failed");
      return [false, null];
    }
    
    // Format and normalize the data
    const formattedData = formatProfileForSubmission(data);
    
    return [true, formattedData];
  } catch (error) {
    console.error("Error validating/cleaning profile data:", error);
    return [false, null];
  }
}
