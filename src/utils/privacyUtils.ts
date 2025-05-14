
export type PrivacyLevel = 'private' | 'friends' | 'public';

export interface DataSharingSettings {
  dob?: PrivacyLevel;
  shipping_address?: PrivacyLevel;
  gift_preferences?: PrivacyLevel;
  email?: PrivacyLevel;
  [key: string]: PrivacyLevel | undefined;
}

/**
 * Gets the default privacy settings for user data
 */
export const getDefaultDataSharingSettings = (): DataSharingSettings => {
  return {
    dob: 'friends',
    shipping_address: 'friends',
    gift_preferences: 'public',
    email: 'private',
  };
};

/**
 * Normalizes data sharing settings from potentially incomplete user input
 */
export const normalizeDataSharingSettings = (settings: any | null | undefined): DataSharingSettings => {
  const defaults = getDefaultDataSharingSettings();
  
  if (!settings) {
    return defaults;
  }
  
  return {
    dob: settings.dob || defaults.dob,
    shipping_address: settings.shipping_address || defaults.shipping_address,
    gift_preferences: settings.gift_preferences || defaults.gift_preferences,
    email: settings.email || defaults.email,
  };
};

/**
 * Check if a user should be able to see data given its privacy level and the relationship
 */
export const canViewData = (
  privacyLevel: PrivacyLevel,
  isOwner: boolean,
  isFriend: boolean
): boolean => {
  if (isOwner) return true;
  
  switch (privacyLevel) {
    case 'public':
      return true;
    case 'friends':
      return isFriend;
    case 'private':
    default:
      return false;
  }
};
