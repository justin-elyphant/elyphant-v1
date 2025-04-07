
import { Profile } from "@/types/supabase";

// Function to check if a user profile has all required fields completed
export const isProfileComplete = (profile: Profile | null): boolean => {
  if (!profile) return false;

  // Check for required fields
  const hasName = !!profile.name;
  const hasDob = !!profile.dob;
  const hasShippingAddress = !!profile.shipping_address &&
    !!profile.shipping_address.street &&
    !!profile.shipping_address.city &&
    !!profile.shipping_address.state &&
    !!profile.shipping_address.zipCode &&
    !!profile.shipping_address.country;
  const hasGiftPreferences = !!profile.gift_preferences && profile.gift_preferences.length > 0;

  return hasName && hasDob && hasShippingAddress && hasGiftPreferences;
};
