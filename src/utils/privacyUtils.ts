
export type PrivacyLevel = 'private' | 'friends' | 'public';

export function getSharingLevelLabel(level: PrivacyLevel): string {
  switch (level) {
    case 'private':
      return 'Only you';
    case 'friends':
      return 'Friends only';
    case 'public':
      return 'Public';
    default:
      return 'Unknown';
  }
}

export function getDefaultDataSharingSettings() {
  return {
    dob: "private" as PrivacyLevel,
    shipping_address: "private" as PrivacyLevel,
    gift_preferences: "friends" as PrivacyLevel,
    email: "private" as PrivacyLevel
  };
}

export function getPrivacyLevelDescription(level: PrivacyLevel): string {
  switch (level) {
    case 'private':
      return 'Only you can see this information';
    case 'friends':
      return 'Only your connected friends can see this information';
    case 'public':
      return 'Anyone can see this information';
    default:
      return 'Unknown privacy setting';
  }
}

/**
 * Normalizes data sharing settings to ensure all required fields have valid privacy levels
 * @param settings The data sharing settings from profile
 * @returns Normalized data sharing settings with all required fields
 */
export function normalizeDataSharingSettings(settings: any) {
  const defaults = getDefaultDataSharingSettings();
  
  if (!settings) {
    return defaults;
  }
  
  // Ensure all required fields are present with valid values
  return {
    dob: isValidPrivacyLevel(settings.dob) ? settings.dob : defaults.dob,
    shipping_address: isValidPrivacyLevel(settings.shipping_address) ? settings.shipping_address : defaults.shipping_address,
    gift_preferences: isValidPrivacyLevel(settings.gift_preferences) ? settings.gift_preferences : defaults.gift_preferences,
    email: isValidPrivacyLevel(settings.email) ? settings.email : defaults.email
  };
}

/**
 * Validates if the provided value is a valid privacy level
 * @param value The value to check
 * @returns Whether the value is a valid privacy level
 */
function isValidPrivacyLevel(value: any): value is PrivacyLevel {
  return value === 'private' || value === 'friends' || value === 'public';
}

// Export SharingLevel type alias for compatibility with components using this name
export type SharingLevel = PrivacyLevel;
