
import { SettingsFormValues } from "@/hooks/settings/settingsFormSchema";
import { ShippingAddress } from "@/hooks/settings/types";

// Extend the settings form values with onboarding-specific fields
export interface ProfileData extends Omit<SettingsFormValues, 'address'> {
  address: ShippingAddress;
  next_steps_option?: string;
}

export type ProfileDataKey = keyof ProfileData;

// Re-export the Address type from settings to ensure consistency
export type { ShippingAddress as Address } from "@/hooks/settings/types";
