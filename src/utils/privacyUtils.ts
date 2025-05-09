
import { SharingLevel } from "@/types/supabase";

export interface DataSharingSettings {
  dob: SharingLevel;
  shipping_address: SharingLevel;
  gift_preferences: SharingLevel;
  email: SharingLevel;
}

/**
 * Returns default data sharing settings that comply with privacy best practices
 */
export function getDefaultDataSharingSettings(): DataSharingSettings {
  return {
    dob: "friends",
    shipping_address: "private",
    gift_preferences: "friends",
    email: "private" // Default to private for email
  };
}

/**
 * Gets the default sharing level for a specific data field
 * @param field The data field to get the default sharing level for
 * @returns The default sharing level for the specified field
 */
export function getDefaultSharingLevel(field: keyof DataSharingSettings): SharingLevel {
  const defaults = getDefaultDataSharingSettings();
  return defaults[field];
}

/**
 * Checks and completes data sharing settings to ensure all required fields are present
 * @param settings Partial data sharing settings
 * @returns Complete data sharing settings
 */
export function completeDataSharingSettings(settings?: Partial<DataSharingSettings>): DataSharingSettings {
  const defaults = getDefaultDataSharingSettings();
  
  if (!settings) {
    return defaults;
  }
  
  return {
    dob: settings.dob || defaults.dob,
    shipping_address: settings.shipping_address || defaults.shipping_address,
    gift_preferences: settings.gift_preferences || defaults.gift_preferences,
    email: settings.email || defaults.email
  };
}

/**
 * Checks if a piece of data should be visible based on privacy settings and connection status
 * @param data The data to check visibility for
 * @param sharingLevel The sharing level of the data
 * @param connectionStatus The connection status between the user and the profile owner
 * @returns Whether the data should be visible
 */
export function isDataVisible(
  data: any, 
  sharingLevel: SharingLevel, 
  connectionStatus: 'none' | 'pending' | 'accepted' | 'requested'
): boolean {
  // If no data, it's not visible regardless of settings
  if (data === undefined || data === null) {
    return false;
  }

  switch (sharingLevel) {
    case 'public':
      return true;
    case 'friends':
      return connectionStatus === 'accepted';
    case 'private':
      return false;
    default:
      return false;
  }
}

/**
 * Validates if the provided sharing level is valid
 * @param level The sharing level to validate
 * @returns Whether the sharing level is valid
 */
export function isValidSharingLevel(level: any): level is SharingLevel {
  return level === 'public' || level === 'friends' || level === 'private';
}

/**
 * Gets a human-readable label for a sharing level
 * @param level The sharing level
 * @returns A human-readable label for the sharing level
 */
export function getSharingLevelLabel(level: SharingLevel): string {
  switch (level) {
    case 'public':
      return 'Everyone';
    case 'friends':
      return 'Connected Friends Only';
    case 'private':
      return 'Only You';
    default:
      return 'Unknown';
  }
}

/**
 * Creates a complete data sharing settings object with all required fields
 * @param email Email sharing level
 * @param dob Date of birth sharing level
 * @param address Shipping address sharing level
 * @param preferences Gift preferences sharing level
 * @returns Complete data sharing settings
 */
export function createDataSharingSettings(
  email: SharingLevel = 'private',
  dob: SharingLevel = 'friends',
  address: SharingLevel = 'private',
  preferences: SharingLevel = 'friends'
): DataSharingSettings {
  return {
    email,
    dob,
    shipping_address: address,
    gift_preferences: preferences
  };
}
