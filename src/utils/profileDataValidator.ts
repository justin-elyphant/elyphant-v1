
import { Profile } from "@/types/profile";

/**
 * Validates profile data consistency and logs warnings for common issues
 */
export const validateProfileDataFlow = (profile: Profile, context: string = '') => {
  const warnings: string[] = [];
  
  // Check birthday format
  if (profile.dob) {
    try {
      // Check if it's in the new month/day format or old date format
      if (profile.dob.includes('-') && profile.dob.length > 10) {
        warnings.push(`Birthday is in old full-date format: ${profile.dob}. Should be MM-DD format.`);
      }
    } catch (e) {
      warnings.push(`Invalid birthday format: ${profile.dob}`);
    }
  }
  
  // Check important dates structure
  if (profile.important_dates && Array.isArray(profile.important_dates)) {
    profile.important_dates.forEach((date, index) => {
      if (!date.date) {
        warnings.push(`Important date at index ${index} missing date field`);
      }
      if (!date.title && !date.description) {
        warnings.push(`Important date at index ${index} missing title/description`);
      }
    });
  }
  
  // Check interests vs gift_preferences alignment
  const hasInterests = profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0;
  const hasGiftPrefs = profile.gift_preferences && Array.isArray(profile.gift_preferences) && profile.gift_preferences.length > 0;
  
  if (!hasInterests && !hasGiftPrefs) {
    warnings.push('No interests or gift preferences found');
  }
  
  // Check data sharing settings
  if (!profile.data_sharing_settings) {
    warnings.push('Missing data sharing settings');
  } else {
    const requiredFields = ['dob', 'shipping_address', 'gift_preferences', 'email'];
    requiredFields.forEach(field => {
      if (!profile.data_sharing_settings[field]) {
        warnings.push(`Missing data sharing setting for: ${field}`);
      }
    });
  }
  
  // Check address format
  if (profile.shipping_address) {
    const hasOldFormat = profile.shipping_address.street || profile.shipping_address.zipCode;
    const hasNewFormat = profile.shipping_address.address_line1 || profile.shipping_address.zip_code;
    
    if (hasOldFormat && !hasNewFormat) {
      warnings.push('Address is in old format (street/zipCode) - should include address_line1/zip_code');
    }
  }
  
  // Log warnings if any
  if (warnings.length > 0) {
    console.warn(`Profile data validation warnings${context ? ` (${context})` : ''}:`, warnings);
    console.warn('Profile data:', profile);
  } else {
    console.log(`Profile data validation passed${context ? ` (${context})` : ''}`);
  }
  
  return {
    isValid: warnings.length === 0,
    warnings
  };
};

/**
 * Formats profile data for consistent display
 */
export const formatProfileForDisplay = (profile: Profile) => {
  // Ensure interests are available for display
  const displayInterests = profile.interests || [];
  
  // Ensure important dates are in correct format
  const displayImportantDates = (profile.important_dates || []).filter(date => 
    date && date.date && (date.title || date.description)
  );
  
  return {
    ...profile,
    interests: displayInterests,
    important_dates: displayImportantDates
  };
};
