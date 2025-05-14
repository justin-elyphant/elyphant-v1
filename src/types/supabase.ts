
// Supabase related types

export type SharingLevel = 'private' | 'friends' | 'public';

export interface UserSpecialDate {
  id: string;
  user_id: string;
  date_type: 'birthday' | 'anniversary' | 'custom';
  date: string;
  visibility: SharingLevel;
  description?: string;
  created_at?: string;
}

export interface UserConnection {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default?: boolean;
}

export interface GiftPreference {
  category: string;
  importance: 'low' | 'medium' | 'high';
}

export interface RecentlyViewedProduct {
  id: string;
  user_id: string;
  product_id: string;
  viewed_at: string;
  product: {
    id: string;
    name: string;
    image_url: string;
    price: number;
  };
}

export interface DataSharingSettings {
  email: SharingLevel;
  dob: SharingLevel;
  shipping_address: SharingLevel;
  gift_preferences: SharingLevel;
}

export interface Profile {
  id: string;
  user_id?: string;
  name?: string;
  username?: string;
  email: string;
  profile_image?: string | null;
  bio?: string;
  dob?: string | null;
  shipping_address?: ShippingAddress;
  gift_preferences?: GiftPreference[];
  important_dates?: UserSpecialDate[];
  data_sharing_settings?: DataSharingSettings;
  updated_at?: string;
  created_at?: string;
  onboarding_completed?: boolean;
}
