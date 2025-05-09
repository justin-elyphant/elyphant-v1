
import type { Database } from './supabase';

// Add this if it doesn't exist already
export type SharingLevel = 'private' | 'friends' | 'public';
export type ConnectionStatus = 'none' | 'pending' | 'accepted' | 'rejected' | 'self';

export interface DataSharingSettings {
  dob?: SharingLevel;
  shipping_address?: SharingLevel;
  gift_preferences?: SharingLevel;
  email?: SharingLevel;
}

export type Wishlist = Database['public']['Tables']['profiles']['Row'] & {
  wishlists?: WishlistData[];
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type GiftPreference = {
  category: string;
  subcategory?: string;
  importance: number;
  notes?: string;
};

export type WishlistItem = {
  id: string;
  product_id: string;
  name: string;
  price?: number;
  brand?: string;
  image_url?: string;
  added_at: string;
};

export type WishlistData = {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  items: WishlistItem[];
};

export type ShippingAddress = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  name?: string;
  id?: string;
};

// Function to ensure gift preferences are properly formatted
export function normalizeGiftPreference(pref: any): GiftPreference {
  if (!pref) {
    return {
      category: '',
      importance: 3
    };
  }
  
  return {
    category: pref.category || '',
    subcategory: pref.subcategory || '',
    importance: typeof pref.importance === 'number' ? pref.importance : 3,
    notes: pref.notes || ''
  };
}

// Function to ensure shipping address is properly formatted
export function normalizeShippingAddress(address: any): ShippingAddress {
  if (!address) {
    return {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    };
  }
  
  return {
    street: address.street || '',
    city: address.city || '',
    state: address.state || '',
    zipCode: address.zipCode || '',
    country: address.country || '',
    name: address.name || '',
    id: address.id || ''
  };
}

// Function to normalize data sharing settings
export function normalizeDataSharingSettings(settings: any): DataSharingSettings {
  if (!settings) {
    return {
      dob: 'friends',
      shipping_address: 'private',
      gift_preferences: 'public',
      email: 'private'  // Always private
    };
  }
  
  return {
    dob: settings.dob || 'friends',
    shipping_address: settings.shipping_address || 'private',
    gift_preferences: settings.gift_preferences || 'public',
    email: 'private'  // Always enforce email as private
  };
}

// Add this function to convert form data to API format
export function profileFormToApiData(formData: any): any {
  return {
    name: formData.name,
    email: formData.email,
    username: formData.username,
    bio: formData.bio || '',
    dob: formData.birthday ? new Date(formData.birthday).toISOString() : null,
    shipping_address: formData.address || {},
    data_sharing_settings: formData.data_sharing_settings || {},
    updated_at: new Date().toISOString()
  };
}
