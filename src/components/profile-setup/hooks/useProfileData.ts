
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfileData } from "./types";
import { getDefaultDataSharingSettings } from "@/utils/privacyUtils";

export const useProfileData = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    username: "",
    bio: "",
    email: user?.email || "",
    profile_image: "",
    dob: "",
    shipping_address: {
      address_line1: "",
      city: "",
      state: "",
      zip_code: "",
      country: ""
    },
    gift_preferences: [],
    important_dates: [],
    data_sharing_settings: {
      dob: "friends",
      shipping_address: "private",
      gift_preferences: "public",
      email: "private"
    },
  });

  useEffect(() => {
    const initializeProfileData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        console.log("[Profile Setup] Initializing profile data...");
        
        // Enhanced Nicole data loading with better error handling
        const nicoleDataStr = localStorage.getItem("nicoleCollectedData");
        const nicoleDataReady = localStorage.getItem("nicoleDataReady") === "true";
        
        let nicoleData = null;
        if (nicoleDataStr && nicoleDataReady) {
          try {
            nicoleData = JSON.parse(nicoleDataStr);
            console.log("[Profile Setup] Found Nicole collected data:", nicoleData);
          } catch (e) {
            console.error("[Profile Setup] Error parsing Nicole data:", e);
            localStorage.removeItem("nicoleCollectedData");
            localStorage.removeItem("nicoleDataReady");
          }
        }
        
        // Try to load existing profile
        const { data: existingProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') {
          console.error("[Profile Setup] Error loading profile:", error);
        }
        
        // Generate username if not available
        const username = existingProfile?.username || 
          (user.email ? user.email.split('@')[0] : '') ||
          `user_${Date.now().toString(36)}`;
        
        // Initialize base profile data
        let mergedData: ProfileData = {
          name: existingProfile?.name || "",
          username: username,
          bio: existingProfile?.bio || "",
          email: existingProfile?.email || user.email || '',
          profile_image: existingProfile?.profile_image || "",
          dob: existingProfile?.dob || "",
          shipping_address: existingProfile?.shipping_address || {
            address_line1: "",
            city: "",
            state: "",
            zip_code: "",
            country: ""
          },
          gift_preferences: existingProfile?.gift_preferences || [],
          important_dates: existingProfile?.important_dates || [],
          data_sharing_settings: existingProfile?.data_sharing_settings || getDefaultDataSharingSettings()
        };

        // Enhanced Nicole data integration
        if (nicoleData && nicoleData.profile_data) {
          console.log("[Profile Setup] Merging Nicole data into profile...");
          const profileData = nicoleData.profile_data;
          
          // Use Nicole's name if profile name is empty
          if (!mergedData.name && profileData.name) {
            mergedData.name = profileData.name;
            console.log("[Profile Setup] Set name from Nicole:", profileData.name);
          }
          
          // Use Nicole's birthday if profile dob is empty - convert MM-DD to proper format
          if (!mergedData.dob && profileData.dob) {
            mergedData.dob = profileData.dob;
            console.log("[Profile Setup] Set birthday from Nicole:", profileData.dob);
          }
          
          // Use Nicole's gift preferences if profile has none
          if ((!mergedData.gift_preferences || mergedData.gift_preferences.length === 0) && 
              profileData.gift_preferences && Array.isArray(profileData.gift_preferences)) {
            mergedData.gift_preferences = profileData.gift_preferences;
            console.log("[Profile Setup] Set gift preferences from Nicole:", profileData.gift_preferences);
          }

          // Use Nicole's important dates if profile has none
          if ((!mergedData.important_dates || mergedData.important_dates.length === 0) && 
              profileData.important_dates && Array.isArray(profileData.important_dates)) {
            mergedData.important_dates = profileData.important_dates;
            console.log("[Profile Setup] Set important dates from Nicole:", profileData.important_dates);
          }

          // Generate a bio if none exists
          if (!mergedData.bio && profileData.name) {
            mergedData.bio = `Hi, I'm ${profileData.name}! I'm here to make gift giving and receiving easier.`;
            console.log("[Profile Setup] Generated bio for Nicole user");
          }
        }

        console.log("[Profile Setup] Final merged profile data:", mergedData);
        setProfileData(mergedData);
        
        // Clear Nicole data after successful merge
        if (nicoleData) {
          localStorage.removeItem("nicoleCollectedData");
          localStorage.removeItem("nicoleDataReady");
          console.log("[Profile Setup] Cleared Nicole data after successful merge");
        }
      } catch (error) {
        console.error("[Profile Setup] Error initializing profile data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeProfileData();
  }, [user]);

  const updateProfileData = (field: keyof ProfileData, value: any) => {
    console.log(`[Profile Setup] Updating profile field "${field}" with value:`, value);
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  return {
    profileData,
    updateProfileData,
    isLoading
  };
};
