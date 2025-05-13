
import { DataSharingSettings, SharingLevel } from "@/types/supabase";

/**
 * Ensures that data sharing settings have all required fields.
 * If settings are missing or invalid, returns default privacy settings.
 */
export function normalizeDataSharingSettings(settings: any): DataSharingSettings {
  if (!settings || typeof settings !== 'object') {
    return {
      email: 'private',
      dob: 'private',
      shipping_address: 'private',
      gift_preferences: 'private'
    };
  }

  return {
    email: isValidSharingLevel(settings.email) ? settings.email : 'private',
    dob: isValidSharingLevel(settings.dob) ? settings.dob : 'private',
    shipping_address: isValidSharingLevel(settings.shipping_address) ? settings.shipping_address : 'private',
    gift_preferences: isValidSharingLevel(settings.gift_preferences) ? settings.gift_preferences : 'private'
  };
}

/**
 * Validates that a value is a valid sharing level
 */
function isValidSharingLevel(value: any): value is SharingLevel {
  return typeof value === 'string' && ['private', 'friends', 'public'].includes(value);
}

/**
 * Checks if a user can access a specific data item based on privacy settings
 */
export function canAccessData(
  dataOwnerSettings: DataSharingSettings, 
  dataField: keyof DataSharingSettings, 
  connectionStatus: 'self' | 'friends' | 'none'
): boolean {
  if (connectionStatus === 'self') {
    return true;
  }

  const privacyLevel = dataOwnerSettings[dataField];
  
  if (privacyLevel === 'public') {
    return true;
  }
  
  if (privacyLevel === 'friends' && connectionStatus === 'friends') {
    return true;
  }
  
  return false;
}
