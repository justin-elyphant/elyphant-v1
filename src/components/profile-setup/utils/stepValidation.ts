
import { ShippingAddress, SharingLevel, GiftPreference } from "@/types/supabase";

interface ProfileData {
  name: string;
  dob: string;
  shipping_address: ShippingAddress;
  gift_preferences: GiftPreference[];
  data_sharing_settings: {
    dob: SharingLevel;
    shipping_address: SharingLevel;
    gift_preferences: SharingLevel;
  };
}

export const validateStep = (step: number, profileData: ProfileData): boolean => {
  switch (step) {
    case 0:
      return !!profileData.name?.trim();
    case 1:
      return !!profileData.dob?.trim();
    case 2:
      return !!profileData.shipping_address?.street?.trim() &&
             !!profileData.shipping_address?.city?.trim() &&
             !!profileData.shipping_address?.state?.trim() &&
             !!profileData.shipping_address?.zipCode?.trim();
    case 3:
      return profileData.gift_preferences?.length > 0;
    case 4:
      return true;
    default:
      return true;
  }
};
