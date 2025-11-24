// This file defines all types related to user profiles

export interface Profile {
  id: string;
  user_id?: string;  // Changed to optional to match supabase type
  name?: string; // Keep for backwards compatibility
  first_name?: string; // New mandatory field
  last_name?: string; // New mandatory field
  username?: string;
  email: string;
  profile_image?: string | null;
  bio?: string;
  dob?: string | null;
  birth_year?: number; // New mandatory field for AI recommendations
  shipping_address?: ShippingAddress;
  /**
   * @deprecated Use `interests` field instead. This field is maintained for backwards compatibility during Phase 1-4 migration.
   * Will be removed in Phase 5 (3-6 months after Phase 2 completion).
   */
  gift_preferences?: GiftPreference[];
  important_dates?: ImportantDate[];
  data_sharing_settings?: DataSharingSettings;
  wishlists?: Wishlist[];
  wishlist_count?: number;
  connection_count?: number;
  interests?: string[];  // Add interests field
  onboarding_completed?: boolean;
  updated_at?: string;
  recently_viewed?: RecentlyViewedItem[];  // Add recently_viewed field
  address_verified?: boolean;
  address_verification_method?: string;
  address_verified_at?: string;
  address_last_updated?: string;
  // Flexible metadata storage for sizes, themes, and feature flags
  metadata?: {
    sizes?: {
      tops?: string;
      bottoms?: string;
      shoes?: string;
      ring?: string;
      fit_preference?: "slim" | "regular" | "relaxed";
    };
    theme?: "light" | "dark" | "system";
    feature_flags?: Record<string, boolean>;
    [key: string]: any; // Allow additional metadata fields
  };
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
  line2?: string;   // Alias for address_line2
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
  interests?: 'private' | 'friends' | 'public';
  /**
   * @deprecated Use `interests` privacy setting instead. This field is maintained for backwards compatibility.
   */
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
  cover_image?: string; // Custom cover image for social sharing
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
  // Product source detection fields
  product_source?: string;
  vendor?: string;
  retailer?: string;
  isZincApiProduct?: boolean;
  skipCentsDetection?: boolean;
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
    line2: address.address_line2 || address.line2 || '',
    zipCode: address.zip_code || address.zipCode || ''
  };
}

/**
 * Create a mapping utility to convert between form data and API formats
 */
export function mapFormAddressToApiAddress(formAddress: any): ShippingAddress {
  console.log("🏠 mapFormAddressToApiAddress input:", JSON.stringify(formAddress, null, 2));
  
  if (!formAddress) {
    console.log("🏠 No address provided, returning empty object");
    return {};
  }
  
  const result = {
    address_line1: formAddress.street || '',
    address_line2: formAddress.line2 || '',
    city: formAddress.city || '',
    state: formAddress.state || '',
    zip_code: formAddress.zipCode || '',
    country: formAddress.country || '',
    is_default: true,
    // Add aliases
    street: formAddress.street || '',
    line2: formAddress.line2 || '',
    zipCode: formAddress.zipCode || ''
  };
  
  console.log("🏠 mapFormAddressToApiAddress output:", JSON.stringify(result, null, 2));
  return result;
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
    line2: apiAddress.address_line2 || '',
    city: apiAddress.city || '',
    state: apiAddress.state || '',
    zipCode: apiAddress.zip_code || apiAddress.zipCode || '',
    country: apiAddress.country || ''
  };
}

// Function to convert form data to API data format
export function profileFormToApiData(formData: any): Partial<Profile> {
  console.log("🔄 profileFormToApiData - Input:", JSON.stringify(formData, null, 2));
  
  // Handle name field extraction - extract first_name and last_name from name if not provided
  let firstName = formData.first_name;
  let lastName = formData.last_name;
  
  // If first_name or last_name are missing but name exists, extract them
  if ((!firstName || !lastName) && formData.name) {
    const nameParts = formData.name.trim().split(' ');
    if (!firstName) {
      firstName = nameParts[0] || '';
    }
    if (!lastName) {
      lastName = nameParts.slice(1).join(' ') || '';
    }
  }
  
  // Ensure we have minimum required fields
  if (!firstName) {
    firstName = formData.name?.split(' ')[0] || 'User';
  }
  if (!lastName) {
    lastName = formData.name?.split(' ').slice(1).join(' ') || 'Name';
  }
  
  // Convert date_of_birth to MM-DD format
  let dobString = null;
  if (formData.date_of_birth) {
    if (typeof formData.date_of_birth === 'object' && formData.date_of_birth.month && formData.date_of_birth.day) {
      // Handle { month, day } format
      const month = formData.date_of_birth.month.toString().padStart(2, '0');
      const day = formData.date_of_birth.day.toString().padStart(2, '0');
      dobString = `${month}-${day}`;
    } else if (formData.date_of_birth instanceof Date) {
      // Handle Date object
      const month = (formData.date_of_birth.getMonth() + 1).toString().padStart(2, '0');
      const day = formData.date_of_birth.getDate().toString().padStart(2, '0');
      dobString = `${month}-${day}`;
    }
  }

  // Convert important dates to proper format
  const processedImportantDates = formData.importantDates?.map((date: any) => {
    let dateString = '';
    if (date.date instanceof Date) {
      dateString = date.date.toISOString();
    } else if (typeof date.date === 'object' && date.date.month && date.date.day) {
      const month = date.date.month.toString().padStart(2, '0');
      const day = date.date.day.toString().padStart(2, '0');
      dateString = `${month}-${day}`;
    } else if (typeof date.date === 'string') {
      dateString = date.date;
    }
    
    return {
      title: date.description,
      date: dateString,
      type: 'custom'
    };
  });

  // PHASE 2: Stop mapping interests to gift_preferences
  // interests is now the single source of truth
  const result = {
    name: formData.name || `${firstName} ${lastName}`.trim(),
    first_name: firstName,
    last_name: lastName,
    email: formData.email,
    username: formData.username || null,
    bio: formData.bio || '',
    birth_year: formData.date_of_birth ? formData.date_of_birth.getFullYear() : new Date().getFullYear() - 25, // Default to 25 years old if no date provided
    dob: dobString,
    shipping_address: formData.address ? mapFormAddressToApiAddress(formData.address) : undefined,
    // NOTE: gift_preferences is DEPRECATED - no longer mapping from interests
    // The ProfileContext will handle backwards compatibility sync if needed
    interests: formData.interests,  // PRIMARY source of truth for user interests
    data_sharing_settings: formData.data_sharing_settings,
    important_dates: processedImportantDates
  };

  console.log("🔄 profileFormToApiData - Output:", JSON.stringify(result, null, 2));
  return result;
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
    added_at: item.added_at || item.created_at || new Date().toISOString(),
    // Product source fields for pricing
    product_source: item.product_source,
    vendor: item.vendor,
    retailer: item.retailer,
    isZincApiProduct: item.isZincApiProduct,
    skipCentsDetection: item.skipCentsDetection
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
