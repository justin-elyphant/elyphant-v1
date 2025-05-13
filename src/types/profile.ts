
// Profile types for the application

import { SharingLevel } from "./supabase";

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  profile_image: string | null;
  interests: string[];
  created_at: string | null;
  updated_at: string | null;
  data_sharing_settings: DataSharingSettings;
  address: ShippingAddress | null;
  gift_preferences: GiftPreference[];
  important_dates: ImportantDate[];
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ImportantDate {
  date: Date;
  description: string;
}

export interface DataSharingSettings {
  email: SharingLevel;
  dob: SharingLevel;
  shipping_address: SharingLevel;
  gift_preferences: SharingLevel;
}

export interface GiftPreference {
  category: string;
  importance: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  items: WishlistItem[];
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id?: string;
  title: string;
  description?: string;
  price?: number;
  image_url?: string;
  url?: string;
  created_at: string;
  priority?: 'low' | 'medium' | 'high';
  purchased?: boolean;
  purchased_by?: string;
}

// Normalization utilities
export function normalizeGiftPreference(preference: any): GiftPreference {
  return {
    category: preference?.category || '',
    importance: preference?.importance || 'medium',
    notes: preference?.notes || undefined
  };
}

export function normalizeShippingAddress(address: any): ShippingAddress {
  return {
    street: address?.street || '',
    city: address?.city || '',
    state: address?.state || '',
    zipCode: address?.zipCode || '',
    country: address?.country || ''
  };
}
