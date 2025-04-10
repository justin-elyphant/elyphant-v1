
export type SharingLevel = 'public' | 'friends' | 'private';

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface GiftPreference {
  category: string;
  importance: 'high' | 'medium' | 'low';
}

export interface DataSharingSettings {
  dob: SharingLevel;
  shipping_address: SharingLevel;
  gift_preferences: SharingLevel;
}

export interface Profile {
  id: string;
  created_at?: string;
  updated_at?: string;
  name?: string;
  username?: string;
  email?: string;
  profile_image?: string | null;
  profile_type?: string;
  dob?: string;
  shipping_address?: ShippingAddress;
  gift_preferences?: GiftPreference[];
  data_sharing_settings?: DataSharingSettings;
  next_steps_option?: string;
}

// Add more types as needed
