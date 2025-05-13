
import { ShippingAddress, ImportantDate, GiftPreference } from "@/types/supabase";

export interface ProfileData {
  name: string;
  bio: string;
  username: string;
  email: string;
  dob: string; 
  profile_image: string;
  shipping_address: ShippingAddress;
  important_dates: ImportantDate[];
  gift_preferences: GiftPreference[];
  data_sharing: {
    email: "public" | "private" | "friends";
    dob: "public" | "private" | "friends";
    shipping_address: "public" | "private" | "friends";
    gift_preferences: "public" | "private" | "friends";
  };
}
