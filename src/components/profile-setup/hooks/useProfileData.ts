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
        
        // Enhanced Nicole data loading with multiple sources
        const nicoleDataStr = localStorage.getItem("nicoleCollectedData") || localStorage.getItem("nicoleGifteeData");
        const nicoleDataReady = localStorage.getItem("nicoleDataReady") === "true";
        const nicoleTimestamp = localStorage.getItem("nicoleDataTimestamp");
        
        let nicoleData = null;
        if (nicoleDataStr && nicoleDataReady) {
          try {
            nicoleData = JSON.parse(nicoleDataStr);
            console.log("[Profile Setup] Found Nicole collected data:", nicoleData);
            console.log("[Profile Setup] Nicole data timestamp:", nicoleTimestamp);
          } catch (e) {
            console.error("[Profile Setup] Error parsing Nicole data:", e);
            // Clear corrupted data
            localStorage.removeItem("nicoleCollectedData");
            localStorage.removeItem("nicoleGifteeData");
            localStorage.removeItem("nicoleDataReady");
            localStorage.removeItem("nicoleDataTimestamp");
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
        
        console.log("[Profile Setup] Existing profile:", existingProfile);
        
        // Generate username if not available
        const username = existingProfile?.username || 
          (user.email ? user.email.split('@')[0] : '') ||
          `user_${Date.now().toString(36)}`;
        
        // Initialize base profile data from existing profile
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

        // Enhanced Nicole data integration with priority to Nicole data
        if (nicoleData && nicoleData.profile_data) {
          console.log("[Profile Setup] Merging Nicole data with priority...");
          const profileData = nicoleData.profile_data;
          
          // Apply Nicole data with higher priority
          if (profileData.name) {
            mergedData.name = profileData.name;
            console.log("[Profile Setup] Applied name from Nicole:", profileData.name);
          }
          
          if (profileData.dob) {
            // Handle different date formats from Nicole
            let formattedDob = profileData.dob;
            if (profileData.dob.includes('-') && profileData.dob.length > 5) {
              // If it's in YYYY-MM-DD format, keep as is
              formattedDob = profileData.dob;
            } else if (profileData.dob.match(/^\d{2}-\d{2}$/)) {
              // If it's MM-DD format, add current year
              formattedDob = `${new Date().getFullYear()}-${profileData.dob}`;
            }
            mergedData.dob = formattedDob;
            console.log("[Profile Setup] Applied birthday from Nicole:", formattedDob);
          }
          
          if (profileData.bio) {
            mergedData.bio = profileData.bio;
            console.log("[Profile Setup] Applied bio from Nicole:", profileData.bio);
          }
          
          if (profileData.gift_preferences && Array.isArray(profileData.gift_preferences)) {
            mergedData.gift_preferences = profileData.gift_preferences;
            console.log("[Profile Setup] Applied gift preferences from Nicole:", profileData.gift_preferences);
          }

          if (profileData.interests && Array.isArray(profileData.interests)) {
            // Convert interests to gift preferences if needed
            if (!mergedData.gift_preferences || mergedData.gift_preferences.length === 0) {
              mergedData.gift_preferences = profileData.interests.map(interest => ({
                category: interest,
                importance: 'medium'
              }));
              console.log("[Profile Setup] Converted interests to gift preferences:", mergedData.gift_preferences);
            }
          }

          if (profileData.important_dates && Array.isArray(profileData.important_dates)) {
            mergedData.important_dates = profileData.important_dates;
            console.log("[Profile Setup] Applied important dates from Nicole:", profileData.important_dates);
          }

          if (profileData.shipping_address) {
            mergedData.shipping_address = { ...mergedData.shipping_address, ...profileData.shipping_address };
            console.log("[Profile Setup] Applied shipping address from Nicole");
          }

          if (profileData.data_sharing_settings) {
            mergedData.data_sharing_settings = { ...mergedData.data_sharing_settings, ...profileData.data_sharing_settings };
            console.log("[Profile Setup] Applied data sharing settings from Nicole");
          }
        }

        console.log("[Profile Setup] Final merged profile data:", mergedData);
        setProfileData(mergedData);
        
        // Clear Nicole data after successful merge to prevent reuse
        if (nicoleData) {
          localStorage.removeItem("nicoleCollectedData");
          localStorage.removeItem("nicoleGifteeData");
          localStorage.removeItem("nicoleDataReady");
          localStorage.removeItem("nicoleDataTimestamp");
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
