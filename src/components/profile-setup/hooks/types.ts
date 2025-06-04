
import { SettingsFormValues } from "@/hooks/settings/settingsFormSchema";

// Use the exact same data structure as settings for consistency
export interface ProfileData extends SettingsFormValues {
  next_steps_option?: string;
  // Remove legacy fields that are no longer needed
}

export type ProfileDataKey = keyof ProfileData;

// Re-export the Address type from settings to ensure consistency
export type { ShippingAddress as Address } from "@/hooks/settings/types";
