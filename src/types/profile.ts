// This file defines all types related to user profiles

export interface Profile {
  id: string;
  user_id?: string;  // Changed to optional to match supabase type
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
  interests?: string[];  // Add interests field
  onboarding_completed?: boolean;
  updated_at?: string;
  recently_viewed?: RecentlyViewedItem[];  // Add recently_viewed field
  // New gifting properties
  gift_giving_preferences?: {
    occasions?: string[];
    budget_ranges?: {
      preferred_min?: number;
      preferred_max?: number;
      last_budget?: { min: number; max: number };
    };
    recipient_types?: string[];
    preferred_categories?: string[];
  };
  gifting_history?: {
    searches?: any[];
    successful_gifts?: any[];
    ai_interactions?: any[];
  };
  ai_interaction_data?: {
    preferred_flow?: string | null;
    common_recipients?: any[];
    learned_preferences?: any;
  };
}

export interface ShippingAddress {
  // Standard fields
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  is_default?: boolean;
  
  // Convenience aliases for better DX
  street?: string;  // Alias for address_line1
  zipCode?: string; // Alias for zip_code
}

export interface RecentlyViewedItem {
  id: string;
  product_id: string;
  viewed_at: string;
  product_data: {
    title: string;
    price?: number;
    image_url?: string;
    brand?: string;
  };
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
  description?: string; // Add description as an alias for title for backwards compatibility
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
export function normalizeGiftPreference(pref: any): GiftPreference {
  if (typeof pref === 'string') {
    return { category: pref, importance: 'medium' };
  }
  return { 
    category: pref.category || 'general', 
    importance: pref.importance || 'medium' 
  };
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
    is_default: address.is_default || true,
    // Add aliases for compatibility
    street: address.address_line1 || address.street || '',
    zipCode: address.zip_code || address.zipCode || ''
  };
}

/**
 * Create a mapping utility to convert between form data and API formats
 */
export function mapFormAddressToApiAddress(formAddress: any): ShippingAddress {
  if (!formAddress) {
    return {};
  }
  
  return {
    address_line1: formAddress.street || '',
    city: formAddress.city || '',
    state: formAddress.state || '',
    zip_code: formAddress.zipCode || '',
    country: formAddress.country || '',
    is_default: true,
    // Add aliases
    street: formAddress.street || '',
    zipCode: formAddress.zipCode || ''
  };
}

/**
 * Map API address format to form address format
 */
export function mapApiAddressToFormAddress(apiAddress: ShippingAddress): any {
  if (!apiAddress) {
    return {};
  }
  
  return {
    street: apiAddress.address_line1 || apiAddress.street || '',
    city: apiAddress.city || '',
    state: apiAddress.state || '',
    zipCode: apiAddress.zip_code || apiAddress.zipCode || '',
    country: apiAddress.country || ''
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
    shipping_address: formData.address ? mapFormAddressToApiAddress(formData.address) : undefined,
    gift_preferences: formData.interests?.map((interest: string) => ({
      category: interest,
      importance: 'medium' as 'low' | 'medium' | 'high'
    })),
    interests: formData.interests,  // Add interests mapping
    data_sharing_settings: formData.data_sharing_settings,
    important_dates: formData.importantDates?.map((date: any) => ({
      title: date.description,
      date: date.date.toISOString(),
      type: 'custom'
    }))
  };
}

/**
 * Normalize a wishlist item
 */
export function normalizeWishlistItem(item: any): WishlistItem {
  return {
    id: item.id || crypto.randomUUID(),
    wishlist_id: item.wishlist_id || '',
    product_id: item.product_id || '',
    title: item.title || item.name || '',
    created_at: item.created_at || item.added_at || new Date().toISOString(),
    name: item.name || '',
    image_url: item.image_url || '',
    brand: item.brand || '',
    price: item.price || null,
    added_at: item.added_at || item.created_at || new Date().toISOString()
  };
}

/**
 * Normalize a wishlist
 */
export function normalizeWishlist(wishlist: any): Wishlist {
  const items = Array.isArray(wishlist.items) 
    ? wishlist.items.map(normalizeWishlistItem)
    : [];
  
  return {
    id: wishlist.id || crypto.randomUUID(),
    user_id: wishlist.user_id || '',
    title: wishlist.title || 'Untitled Wishlist',
    description: wishlist.description || '',
    is_public: typeof wishlist.is_public === 'boolean' ? wishlist.is_public : false,
    created_at: wishlist.created_at || new Date().toISOString(),
    updated_at: wishlist.updated_at || new Date().toISOString(),
    items,
    category: wishlist.category,
    tags: wishlist.tags,
    priority: wishlist.priority
  };
}
