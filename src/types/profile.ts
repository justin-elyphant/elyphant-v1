
import { ShippingAddress, SharingLevel, Profile } from "@/types/supabase";

// Standard Gift Preference type
export interface GiftPreference {
  category: string;
  importance: 'high' | 'medium' | 'low';
}

// Standard Important Date type
export interface ImportantDate {
  date: string; // ISO string format
  description: string;
}

// Standard Data Sharing Settings type
export interface DataSharingSettings {
  dob: SharingLevel;
  shipping_address: SharingLevel;
  gift_preferences: SharingLevel;
  [key: string]: SharingLevel; // Allow for extension
}

// Standardized profile data structure
export interface ProfileData extends Omit<Profile, 'gift_preferences' | 'important_dates' | 'data_sharing_settings'> {
  gift_preferences: GiftPreference[];
  important_dates: ImportantDate[];
  data_sharing_settings: DataSharingSettings;
}

// Helper function to convert string preferences to object format
export const normalizeGiftPreference = (pref: string | GiftPreference): GiftPreference => {
  if (typeof pref === 'string') {
    return { category: pref, importance: 'medium' };
  }
  return pref;
};

// Helper function to ensure date is in ISO format
export const normalizeDate = (date: string | Date): string => {
  if (date instanceof Date) {
    return date.toISOString();
  }
  // Try to parse the date if it's not already in ISO format
  if (!date.includes('T')) {
    try {
      return new Date(date).toISOString();
    } catch (e) {
      console.error("Invalid date format:", date);
      return date;
    }
  }
  return date;
};

// Ensure shipping address has all required fields
export const normalizeShippingAddress = (address?: Partial<ShippingAddress> | null): ShippingAddress => {
  return {
    street: address?.street || "",
    city: address?.city || "",
    state: address?.state || "",
    zipCode: address?.zipCode || "",
    country: address?.country || ""
  };
};

// Ensure data sharing settings have all required fields
export const normalizeDataSharingSettings = (settings?: Partial<DataSharingSettings> | null): DataSharingSettings => {
  return {
    dob: settings?.dob || "friends",
    shipping_address: settings?.shipping_address || "private",
    gift_preferences: settings?.gift_preferences || "public"
  };
};

// Converter for form data to API format
export const profileFormToApiData = (formData: any): Partial<ProfileData> => {
  return {
    name: formData.name,
    email: formData.email,
    bio: formData.bio,
    profile_image: formData.profile_image,
    dob: formData.birthday ? formData.birthday.toISOString() : null,
    shipping_address: normalizeShippingAddress(formData.address),
    gift_preferences: (formData.interests || []).map(normalizeGiftPreference),
    important_dates: (formData.importantDates || []).map((date: any) => ({
      date: date.date ? normalizeDate(date.date) : new Date().toISOString(),
      description: date.description || ""
    })),
    data_sharing_settings: normalizeDataSharingSettings(formData.data_sharing_settings)
  };
};
