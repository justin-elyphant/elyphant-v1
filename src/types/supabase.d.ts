
export type SharingLevel = "public" | "friends" | "private";

export interface DataSharingSettings {
  dob: SharingLevel;
  shipping_address: SharingLevel;
  gift_preferences: SharingLevel;
  email?: SharingLevel;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface GiftPreference {
  category: string;
  importance: "low" | "medium" | "high";
}

export interface ImportantDate {
  date: string; // ISO string format
  description: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username?: string;
  bio?: string;
  dob?: string; // ISO string format
  profile_image?: string | null;
  shipping_address?: ShippingAddress;
  gift_preferences?: GiftPreference[];
  important_dates?: ImportantDate[];
  data_sharing_settings?: DataSharingSettings;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
  recently_viewed?: RecentlyViewedProduct[];
}

export interface RecentlyViewedProduct {
  id: string;
  name: string;
  description?: string;
  price?: number;
  image?: string;
  url?: string;
  viewed_at: string; // ISO string format
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  action_text?: string;
  created_at: string;
  updated_at?: string;
}
