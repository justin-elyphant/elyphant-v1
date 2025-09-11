
import { Profile } from "@/types/supabase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Function to check if a user profile has all required fields completed
export const isProfileComplete = (profile: Profile | null): boolean => {
  if (!profile) return false;

  // Check for required fields
  const hasName = !!profile.name;
  const hasDob = !!profile.dob;
  const hasShippingAddress = !!profile.shipping_address &&
    !!profile.shipping_address.address_line1 &&
    !!profile.shipping_address.city &&
    !!profile.shipping_address.state &&
    !!profile.shipping_address.zip_code &&
    !!profile.shipping_address.country;
  const hasGiftPreferences = !!profile.gift_preferences && profile.gift_preferences.length > 0;

  return hasName && hasDob && hasShippingAddress && hasGiftPreferences;
};

// Function to get user profile
export const getUserProfile = async (user: any) => {
  if (!user) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// Function to update user profile
export const updateUserProfile = async (user: any, updates: Partial<Profile>) => {
  if (!user) return;
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
      
    if (error) throw error;
    toast.success("Profile updated successfully");
  } catch (error) {
    console.error("Error updating profile:", error);
    toast.error("Failed to update profile");
    throw error;
  }
};

// Function to resend verification email
export const resendVerificationEmail = async (email: string | undefined) => {
  if (!email) {
    toast.error("No email provided");
    return;
  }
  
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    
    if (error) throw error;
    toast.success("Verification email sent");
  } catch (error: any) {
    console.error("Error resending verification email:", error);
    toast.error(error.message || "Failed to send verification email");
    throw error;
  }
};

// Function to send account deletion email
export const sendDeletionEmail = async (email: string, name?: string) => {
  try {
    // This would typically call an edge function to send the email
    return { success: true };
  } catch (error) {
    console.error("Error sending deletion email:", error);
    throw error;
  }
};

// Function to initialize storage bucket
export const initializeStorageBucket = async (): Promise<boolean> => {
  try {
    // Check if bucket exists and initialize if needed
    // This is a placeholder for actual bucket initialization code
    return true;
  } catch (error) {
    console.error("Error initializing storage bucket:", error);
    return false;
  }
};
