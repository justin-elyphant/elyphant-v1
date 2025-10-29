
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

// Add the missing getSharingLevelLabel function
export function getSharingLevelLabel(level: PrivacyLevel): string {
  return getReadablePrivacyLevel(level);
}

export function getDefaultDataSharingSettings(): DataSharingSettings {
  return {
    dob: 'friends',
    shipping_address: 'friends',
    interests: 'public',
    gift_preferences: 'public', // Deprecated, sync'd from interests
    email: 'friends'
  };
}

export function normalizeDataSharingSettings(settings?: DataSharingSettings | null): DataSharingSettings {
  const defaultSettings = getDefaultDataSharingSettings();

  if (!settings) return defaultSettings;

  return {
    dob: settings.dob || defaultSettings.dob,
    shipping_address: settings.shipping_address || defaultSettings.shipping_address,
    interests: settings.interests || settings.gift_preferences || defaultSettings.interests, // Fallback to gift_preferences for transition
    gift_preferences: settings.gift_preferences || settings.interests || defaultSettings.gift_preferences, // Sync from interests
    email: settings.email || defaultSettings.email
  };
}
