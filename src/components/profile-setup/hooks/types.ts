
import { SettingsFormValues } from "@/hooks/settings/settingsFormSchema";
import { ShippingAddress } from "@/hooks/settings/types";

// Extend the settings form values with onboarding-specific fields
export interface ProfileData extends Omit<SettingsFormValues, 'address' | 'date_of_birth'> {
  address: ShippingAddress;
  date_of_birth: Date | null;
  next_steps_option?: string;
  // Address verification fields
  address_verified?: boolean;
  address_verification_method?: string;
  address_verified_at?: string;
  // Additional fields for compatibility
  birth_month?: number | null;
  birth_day?: number | null;
  birth_year?: number | null;
  shipping_address?: any;
  phone?: string;
}

export type ProfileDataKey = keyof ProfileData;

// Re-export the Address type from settings to ensure consistency
export type { ShippingAddress as Address } from "@/hooks/settings/types";
