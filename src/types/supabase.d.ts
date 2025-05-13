
// This file provides type definitions for our Supabase database schema

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      // Add other tables as needed
    };
  };
}

export interface Profile {
  id: string;
  name: string;
  bio?: string;
  username?: string;
  profile_image?: string;
  dob?: string;
  shipping_address?: ShippingAddress;
  interests?: string[];
  important_dates?: ImportantDate[];
  recently_viewed?: RecentlyViewedProduct[];
  data_sharing_settings: DataSharingSettings;
  created_at?: string;
  updated_at?: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ImportantDate {
  id: string;
  name: string;
  date: string;
  type: string;
  reminder_days?: number;
}

export interface RecentlyViewedProduct {
  id: string;
  name: string;
  image?: string;
  price?: number;
  viewed_at: string;
}

export interface DataSharingSettings {
  email: "public" | "private" | "friends";
  dob: "public" | "private" | "friends";
  shipping_address: "public" | "private" | "friends";
  gift_preferences: "public" | "private" | "friends";
}

export interface UserAddress {
  id: string;
  user_id: string;
  address_type: 'billing' | 'shipping';
  is_default: boolean;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface UserConnection {
  id: string;
  user_id: string;
  connection_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface UserSpecialDate {
  id: string;
  user_id: string;
  date_type: 'birthday' | 'anniversary' | 'custom';
  date: string;
  name: string;
  description?: string;
}

export interface GiftPreference {
  category: string;
  importance: number;
}
