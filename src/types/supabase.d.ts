/// <reference types="vite/client" />

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: any;
        Insert: any;
        Update: any;
      };
      // Add other tables as needed
    };
  };
}

export type UserAddress = {
  id: string;
  user_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type UserSpecialDate = {
  id: string;
  user_id: string;
  date_type: string;
  date: string;
  title: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
};

export type UserConnection = {
  id: string;
  user_id: string;
  connected_user_id: string;
  connection_type: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type RecentlyViewedProduct = {
  id: string;
  user_id: string;
  product_id: string;
  viewed_at: string;
  product_data?: any;
};

export type ImportantDate = {
  id: string;
  user_id: string;
  date: string;
  title: string;
  description?: string;
  reminders_enabled: boolean;
};
