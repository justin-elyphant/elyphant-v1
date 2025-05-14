
// This file defines all types related to user profiles

export interface Profile {
  id: string;
  user_id: string;
  name?: string;
  username?: string;
  email: string;
  profile_image?: string | null;
  bio?: string;
  dob?: string | null;
  shipping_address?: ShippingAddress;
  gift_preferences?: GiftPreference[];
  important_dates?: ImportantDate[];
  data_sharing_settings?: DataSharingSettings;
  wishlists?: Wishlist[];
  onboarding_completed?: boolean;
  updated_at?: string;
}

export interface ShippingAddress {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  is_default?: boolean;
}

export interface GiftPreference {
  category: string;
  importance?: 'low' | 'medium' | 'high';
}

export interface ImportantDate {
  id?: string;
  title: string;
  date: string;
  type: string;
  reminder_days?: number;
}

export interface DataSharingSettings {
  dob?: 'private' | 'friends' | 'public';
  shipping_address?: 'private' | 'friends' | 'public';
  gift_preferences?: 'private' | 'friends' | 'public';
  email?: 'private' | 'friends' | 'public';
}

export interface Wishlist {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  is_public: boolean;
  items: WishlistItem[];
  created_at: string;
  updated_at?: string;
  // Additional fields used in the application:
  category?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  title: string;
  created_at: string;
  // Additional fields used in the application:
  name?: string;
  brand?: string;
  added_at?: string;
  price?: number;
  image_url?: string;
}

// Helper functions for normalization
export function normalizeGiftPreference(preferences: any[] | null | undefined): GiftPreference[] {
  if (!preferences || !Array.isArray(preferences)) {
    return [];
  }
  
  return preferences.map(pref => {
    if (typeof pref === 'string') {
      return { category: pref, importance: 'medium' };
    }
    return { 
      category: pref.category || 'general', 
      importance: pref.importance || 'medium' 
    };
  });
}

export function normalizeShippingAddress(address: any | null | undefined): ShippingAddress {
  if (!address) {
    return {};
  }
  
  return {
    address_line1: address.address_line1 || address.street || '',
    address_line2: address.address_line2 || address.line2 || '',
    city: address.city || '',
    state: address.state || '',
    zip_code: address.zip_code || address.zipCode || '',
    country: address.country || 'US',
    is_default: address.is_default || true
  };
}

// Function to convert form data to API data format
export function profileFormToApiData(formData: any): Partial<Profile> {
  return {
    name: formData.name,
    email: formData.email,
    username: formData.username,
    bio: formData.bio || '',
    dob: formData.birthday ? formData.birthday.toISOString() : null,
    shipping_address: formData.address ? {
      address_line1: formData.address.street,
      city: formData.address.city,
      state: formData.address.state,
      zip_code: formData.address.zipCode,
      country: formData.address.country,
      is_default: true
    } : undefined,
    gift_preferences: formData.interests?.map((interest: string) => ({
      category: interest,
      importance: 'medium'
    })),
    data_sharing_settings: formData.data_sharing_settings,
    important_dates: formData.importantDates?.map((date: any) => ({
      title: date.description,
      date: date.date.toISOString(),
      type: 'custom'
    }))
  };
}
