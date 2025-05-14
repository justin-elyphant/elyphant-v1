
// Utility functions for handling privacy settings
import { SharingLevel } from '@/types/supabase';

export type PrivacyLevel = 'private' | 'friends' | 'public';

export function getSharingLevelLabel(level: SharingLevel): string {
  switch (level) {
    case 'private':
      return 'Only Me';
    case 'friends':
      return 'Friends Only';
    case 'public':
      return 'Everyone';
    default:
      return 'Unknown';
  }
}

export function normalizeDataSharingSettings(settings: any): Record<string, PrivacyLevel> {
  const defaultSettings = {
    email: 'private',
    dob: 'friends',
    shipping_address: 'private',
    gift_preferences: 'friends'
  };

  if (!settings) return defaultSettings;

  return {
    email: settings.email || defaultSettings.email,
    dob: settings.dob || defaultSettings.dob,
    shipping_address: settings.shipping_address || defaultSettings.shipping_address,
    gift_preferences: settings.gift_preferences || defaultSettings.gift_preferences
  };
}

export function getPrivacyIcon(level: PrivacyLevel): string {
  switch (level) {
    case 'private':
      return 'Lock';
    case 'friends':
      return 'Users';
    case 'public':
      return 'Globe';
    default:
      return 'Info';
  }
}

export function getPrivacyColor(level: PrivacyLevel): string {
  switch (level) {
    case 'private':
      return 'text-red-500';
    case 'friends':
      return 'text-amber-500';
    case 'public':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}
