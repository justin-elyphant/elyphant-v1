
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile, ShippingAddress, GiftPreference, DataSharingSettings } from "@/types/supabase";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching profile for user:", user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      console.log("Fetched profile data:", data);
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return null;
    }
    
    try {
      console.log("Updating profile with:", updates);
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log("Profile updated successfully:", data);
      setProfile(prev => prev ? { ...prev, ...updates } : data);
      toast.success("Profile updated successfully");
      
      return data;
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile");
      throw err;
    }
  };

  const updateDOB = async (dob: string) => {
    return updateProfile({ dob });
  };

  const updateShippingAddress = async (shippingAddress: ShippingAddress) => {
    return updateProfile({ shipping_address: shippingAddress });
  };

  const updateGiftPreferences = async (giftPreferences: GiftPreference[]) => {
    return updateProfile({ gift_preferences: giftPreferences });
  };

  const updateDataSharingSettings = async (dataSharingSettings: DataSharingSettings) => {
    return updateProfile({ data_sharing_settings: dataSharingSettings });
  };

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    updateDOB,
    updateShippingAddress,
    updateGiftPreferences,
    updateDataSharingSettings
  };
};
