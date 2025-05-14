// Create basic types for Supabase tables

import { Profile as BaseProfile, ShippingAddress, GiftPreference, ImportantDate } from "./profile";

// Re-export Profile type with any necessary adjustments for Supabase
export interface Profile extends BaseProfile {
  // Any Supabase-specific additions or changes
}

// User address for multiple addresses
export interface UserAddress {
  id: string;
  user_id: string;
  is_default: boolean;
  address: ShippingAddress;
  created_at: string;
  updated_at: string;
  name: string;
}

// Re-export common types
export { ShippingAddress, GiftPreference, ImportantDate };
