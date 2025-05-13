
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

export interface UserAddress {
  id: string;
  user_id: string;
  address_type: 'shipping' | 'billing';
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
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
