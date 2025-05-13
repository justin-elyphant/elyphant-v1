
// Import the Database type without causing circular references
import { Database } from '@/integrations/supabase/types';

// Define types for profile data
export interface ProfileData {
  id?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  birthday?: string;
  email?: string;
  interests?: string[];
  gift_preferences?: GiftPreference[];
  shipping_address?: ShippingAddress;
  data_sharing_settings?: DataSharingSettings;
  next_steps_option?: string;
}

export interface GiftPreference {
  category: string;
  importance: number;
  notes?: string;
}

export interface ShippingAddress {
  id?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface DataSharingSettings {
  sharing_level: string;
  allow_marketing: boolean;
  allow_wishlist_suggestions: boolean;
  allow_event_reminders: boolean;
  allow_friend_recommendations: boolean;
  allow_data_analysis: boolean;
}

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  email?: string;
  bio: string;
  birthday?: string;
  interests: string[];
  gift_preferences?: GiftPreference[];
  data_sharing_settings?: DataSharingSettings;
};
