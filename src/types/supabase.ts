export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  profile_image: string | null;
  profile_type: string | null;
  created_at: string | null;
  updated_at: string | null;
  // New fields
  dob: string | null;
  shipping_address: ShippingAddress | null;
  gift_preferences: GiftPreference[] | null;
  data_sharing_settings: DataSharingSettings | null;
  bio?: string | null;
};

export type ShippingAddress = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

export type GiftPreference = {
  category: string;
  importance: 'high' | 'medium' | 'low';
};

export type DataSharingSettings = {
  dob: SharingLevel;
  shipping_address: SharingLevel;
  gift_preferences: SharingLevel;
};

export type SharingLevel = 'public' | 'friends' | 'private';

export type UserConnection = {
  id: string;
  user_id: string;
  connected_user_id: string;
  relationship_type: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  updated_at: string;
  data_access_permissions: {
    dob: boolean;
    shipping_address: boolean;
    gift_preferences: boolean;
  };
};

export type UserAddress = {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  address: ShippingAddress;
  created_at: string;
  updated_at: string;
};

export type UserSpecialDate = {
  id: string;
  user_id: string;
  date_type: 'birthday' | 'anniversary' | 'custom';
  date: string; // MM-DD format
  visibility: SharingLevel;
  created_at: string;
  updated_at: string;
};

export type AutoGiftingRule = {
  id: string;
  user_id: string;
  recipient_id: string;
  date_type: 'birthday' | 'anniversary' | 'custom';
  is_active: boolean;
  gift_preferences?: {
    categories?: string[];
    min_price?: number;
    max_price?: number;
    note?: string;
  };
  budget_limit: number;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      user_connections: {
        Row: UserConnection;
        Insert: Omit<UserConnection, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserConnection, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_addresses: {
        Row: UserAddress;
        Insert: Omit<UserAddress, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserAddress, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_special_dates: {
        Row: UserSpecialDate;
        Insert: Omit<UserSpecialDate, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserSpecialDate, 'id' | 'created_at' | 'updated_at'>>;
      };
      auto_gifting_rules: {
        Row: AutoGiftingRule;
        Insert: Omit<AutoGiftingRule, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AutoGiftingRule, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
};
