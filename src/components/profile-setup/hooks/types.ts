
import { SettingsFormValues } from "@/hooks/settings/settingsFormSchema";
import { ShippingAddress } from "@/hooks/settings/types";

// Define birthday as month/day only
export interface BirthdayData {
  month: number;
  day: number;
}

// Extend the settings form values with onboarding-specific fields
export interface ProfileData extends Omit<SettingsFormValues, 'address' | 'birthday'> {
  address: ShippingAddress;
  birthday: BirthdayData | null;
  next_steps_option?: string;
}

export type ProfileDataKey = keyof ProfileData;

// Re-export the Address type from settings to ensure consistency
export type { ShippingAddress as Address } from "@/hooks/settings/types";
