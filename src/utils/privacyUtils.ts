
import { DataSharingSettings, SharingLevel } from "@/types/supabase";

// Privacy level type
export type PrivacyLevel = 'private' | 'friends' | 'public';

/**
 * Get default data sharing settings
 * @returns Default data sharing settings
 */
export function getDefaultDataSharingSettings(): DataSharingSettings {
  return {
    dob: 'friends' as SharingLevel,
    shipping_address: 'private' as SharingLevel,
    gift_preferences: 'public' as SharingLevel,
    email: 'private' as SharingLevel
  };
}

/**
 * Get a human-readable label for a sharing level
 */
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

/**
 * Normalize data sharing settings to ensure all required fields are present
 * @param settings - The settings to normalize
 * @returns Normalized data sharing settings
 */
export function normalizeDataSharingSettings(settings: any | null | undefined): DataSharingSettings {
  const defaults = getDefaultDataSharingSettings();
  
  if (!settings || typeof settings !== 'object') {
    return defaults;
  }
  
  return {
    dob: settings.dob || defaults.dob,
    shipping_address: settings.shipping_address || defaults.shipping_address,
    gift_preferences: settings.gift_preferences || defaults.gift_preferences,
    email: settings.email || defaults.email
  };
}
