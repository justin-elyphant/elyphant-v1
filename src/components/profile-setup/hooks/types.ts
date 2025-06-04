
import { SettingsFormValues } from "@/hooks/settings/settingsFormSchema";

// Use the same data structure as settings, but add missing fields for onboarding
export interface ProfileData extends SettingsFormValues {
  next_steps_option?: string;
  // Add legacy field mappings for compatibility
  username?: string;
  dob?: string;
  shipping_address?: any;
  gift_preferences?: any;
  important_dates?: any;
}

export type ProfileDataKey = keyof ProfileData;

// Address interface that matches the form structure - made optional for setup flow
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}
