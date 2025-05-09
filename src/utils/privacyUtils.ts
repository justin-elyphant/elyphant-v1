
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
