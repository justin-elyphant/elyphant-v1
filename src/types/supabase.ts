
// Import types we need
import { PrivacyLevel } from "@/utils/privacyUtils";
import { ShippingAddress, ImportantDate, GiftPreference, RecentlyViewedItem } from "@/types/profile";

// Define types for Supabase-related data structures
export type Database = {
  public: {
    Tables: {
      // Define your tables here
    };
  };
};

// Profile type that matches our database structure
export type Profile = {
  id: string;
  user_id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  email: string;
  profile_image?: string | null;
  bio?: string;
  dob?: string | null;
  shipping_address?: ShippingAddress;
  gift_preferences?: GiftPreference[];
  important_dates?: ImportantDate[];
  data_sharing_settings?: DataSharingSettings;
  onboarding_completed?: boolean;
  updated_at?: string;
  recently_viewed?: RecentlyViewedItem[];
  interests?: string[];
};

// User connection type
export type UserConnection = {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at?: string;
  relationship_type: string;
  data_access_permissions?: {
    dob: boolean;
    gift_preferences: boolean;
    shipping_address: boolean;
  };
};

// User special date type
export type UserSpecialDate = {
  id: string;
  user_id: string;
  date_type: string;
  date: string;
  visibility: string;
  created_at?: string;
  updated_at?: string;
};

// User address type
export type UserAddress = {
  id: string;
  user_id: string;
  name: string;
  address: ShippingAddress;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
};

// Data sharing settings
export type DataSharingSettings = {
  dob?: PrivacyLevel;
  shipping_address?: PrivacyLevel;
  interests?: PrivacyLevel;
  /** @deprecated Use `interests` field instead. Maintained for backwards compatibility during transition. */
  gift_preferences?: PrivacyLevel;
  email?: PrivacyLevel;
};

// Export types needed elsewhere
export type { PrivacyLevel, PrivacyLevel as SharingLevel };

// Re-export types from profile.ts for backward compatibility
export type { ShippingAddress, ImportantDate, GiftPreference, RecentlyViewedItem };
