
import { ShippingAddress, SharingLevel, GiftPreference, ImportantDate } from "@/types/supabase";

export interface ProfileData {
  name: string;
  username: string;
  email: string;
  profile_image: string | null;
  dob: string;
  bio?: string;
  shipping_address: ShippingAddress;
  gift_preferences: GiftPreference[];
  important_dates?: ImportantDate[];
  data_sharing_settings: {
    dob: SharingLevel;
    shipping_address: SharingLevel;
    gift_preferences: SharingLevel;
  };
  next_steps_option: string;
}
