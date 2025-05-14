
// This file contains type definitions for Supabase database tables

export interface RecentlyViewedProduct {
  id: string;
  user_id: string;
  product_id: string;
  viewed_at: string;
  product_data: {
    id: string;
    title: string;
    price: number;
    image_url?: string;
    brand?: string;
    category?: string;
  };
}

export interface UserAddress {
  id: string;
  user_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserConnection {
  id: string;
  user_id: string;
  connection_id: string;
  connection_type: 'friend' | 'following' | 'pending' | 'blocked';
  created_at: string;
  updated_at?: string;
  connection_details?: {
    name?: string;
    username?: string;
    profile_image?: string;
  };
}
