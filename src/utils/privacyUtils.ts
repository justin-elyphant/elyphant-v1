
// Privacy utilities for managing data sharing settings

import { DataSharingSettings } from "@/types/supabase";

/**
 * Get default data sharing settings
 * @returns DataSharingSettings with default values
 */
export const getDefaultDataSharingSettings = (): DataSharingSettings => ({
  email: 'private',
  dob: 'private',
  shipping_address: 'private',
  gift_preferences: 'friends'
});

/**
 * Normalize data sharing settings by ensuring all required fields exist
 * @param settings Partial settings object
 * @returns Complete settings object with defaults for missing values
 */
export const normalizeDataSharingSettings = (settings?: Partial<DataSharingSettings>): DataSharingSettings => {
  const defaults = getDefaultDataSharingSettings();
  
  if (!settings) return defaults;
  
  return {
    email: settings.email || defaults.email,
    dob: settings.dob || defaults.dob,
    shipping_address: settings.shipping_address || defaults.shipping_address,
    gift_preferences: settings.gift_preferences || defaults.gift_preferences
  };
};

/**
 * Check if a specific field should be visible based on current sharing level and viewer relationship
 * @param fieldSharingLevel The privacy level set for the field ('private', 'friends', 'public')
 * @param isFriend Whether the viewer is a friend of the profile owner
 * @param isOwner Whether the viewer is the profile owner
 * @returns Boolean indicating if the field should be visible
 */
export const isFieldVisible = (
  fieldSharingLevel: string, 
  isFriend: boolean = false,
  isOwner: boolean = false
): boolean => {
  if (isOwner) return true; // Owner always sees their own data
  if (fieldSharingLevel === 'public') return true;
  if (fieldSharingLevel === 'friends' && isFriend) return true;
  return false;
};
