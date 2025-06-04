

import { SettingsFormValues } from "@/hooks/settings/settingsFormSchema";

// Extend the settings form values with onboarding-specific fields
export interface ProfileData extends SettingsFormValues {
  next_steps_option?: string;
}

export type ProfileDataKey = keyof ProfileData;

// Re-export the Address type from settings to ensure consistency
export type { ShippingAddress as Address } from "@/hooks/settings/types";

