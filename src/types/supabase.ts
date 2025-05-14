
// Import types we need
import { PrivacyLevel } from "@/utils/privacyUtils";

// Define types for Supabase-related data structures
export type Database = {
  public: {
    Tables: {
      // Define your tables here
    };
  };
};

// User connection type
export type UserConnection = {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at?: string;
  relationship_type: string;
  data_access_permissions?: {
    dob: boolean;
    gift_preferences: boolean;
    shipping_address: boolean;
  };
};

// User special date type
export type UserSpecialDate = {
  id: string;
  user_id: string;
  date_type: string;
  date: string;
  visibility: string;
  created_at?: string;
  updated_at?: string;
};

// User address type
export type UserAddress = {
  id: string;
  user_id: string;
  name: string;
  address: Record<string, any>;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
};

// Export types needed elsewhere
export type { PrivacyLevel, PrivacyLevel as SharingLevel };
