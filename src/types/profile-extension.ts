import { Profile, GiftPreference, ShippingAddress, ImportantDate, DataSharingSettings } from "@/types/profile";

/**
 * Extended Profile interface that includes fields needed by various components
 * but not originally in the base Profile type
 */
export interface ExtendedProfile extends Profile {
  // Make the gift_preferences field required
  gift_preferences: GiftPreference[];
  
  // Other fields remain optional
  interests?: string[];
  recently_viewed?: any[];
  user_id: string;
  shipping_address?: ShippingAddress;
  important_dates?: ImportantDate[];
  data_sharing_settings?: DataSharingSettings;
}

/**
 * Extract interests from gift preferences
 */
export function extractInterests(profile: Profile | null): string[] {
  if (!profile || !profile.gift_preferences) {
    return [];
  }
  
  return profile.gift_preferences.map(pref => {
    if (typeof pref === 'string') {
      return pref;
    }
    if (typeof pref === 'object' && 'category' in pref) {
      return pref.category;
    }
    return '';
  }).filter(Boolean);
}

/**
 * Add interests field to profile object
 */
export function extendProfileWithInterests(profile: Profile | null): ExtendedProfile | null {
  if (!profile) {
    return null;
  }
  
  return {
    ...profile,
    interests: extractInterests(profile),
    user_id: profile.id,
    gift_preferences: profile.gift_preferences || [] // Ensure gift_preferences is never undefined
  };
}

/**
 * Convert gift preferences array to format expected by the API
 */
export function formatGiftPreferences(interests: string[]): GiftPreference[] {
  return interests.map(interest => ({
    category: interest,
    importance: 'medium'
  }));
}
