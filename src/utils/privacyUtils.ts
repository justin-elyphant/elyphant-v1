
import { DataSharingSettings } from "@/types/profile";

export type PrivacyLevel = 'private' | 'friends' | 'public';

export const privacyLevels: PrivacyLevel[] = ['private', 'friends', 'public'];

export function getReadablePrivacyLevel(level: PrivacyLevel): string {
  switch (level) {
    case 'private': return 'Only Me';
    case 'friends': return 'Friends Only';
    case 'public': return 'Everyone';
    default: return 'Unknown';
  }
}

export function getSharingLevelLabel(level: PrivacyLevel): string {
  return getReadablePrivacyLevel(level);
}

/**
 * @deprecated Privacy settings now live in the privacy_settings table.
 * Use usePrivacySettings hook instead. Kept for backward compatibility during transition.
 */
export function getDefaultDataSharingSettings(): DataSharingSettings {
  return {
    dob: 'friends',
    shipping_address: 'private',
    interests: 'public',
    gift_preferences: 'public',
    email: 'friends'
  };
}

/**
 * @deprecated Privacy settings now live in the privacy_settings table.
 * Use usePrivacySettings hook instead.
 */
export function normalizeDataSharingSettings(settings?: DataSharingSettings | null): DataSharingSettings {
  const defaultSettings = getDefaultDataSharingSettings();

  if (!settings) return defaultSettings;

  return {
    dob: settings.dob || defaultSettings.dob,
    shipping_address: settings.shipping_address || defaultSettings.shipping_address,
    interests: settings.interests || settings.gift_preferences || defaultSettings.interests,
    gift_preferences: settings.gift_preferences || settings.interests || defaultSettings.gift_preferences,
    email: settings.email || defaultSettings.email
  };
}
