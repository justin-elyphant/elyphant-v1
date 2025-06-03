
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
        
        // First check if Nicole collected any data
        const nicoleDataStr = localStorage.getItem("nicoleCollectedData");
        let nicoleData = null;
        if (nicoleDataStr) {
          try {
            nicoleData = JSON.parse(nicoleDataStr);
            console.log("[Profile Setup] Found Nicole collected data:", nicoleData);
          } catch (e) {
            console.error("[Profile Setup] Error parsing Nicole data:", e);
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
        let mergedData = {
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

        // If Nicole has data, use it to pre-populate empty fields
        if (nicoleData) {
          console.log("[Profile Setup] Pre-populating with Nicole data:", nicoleData);
          
          // Use Nicole's name if profile name is empty
          if (!mergedData.name && nicoleData.name) {
            mergedData.name = nicoleData.name;
          }
          
          // Use Nicole's birthday if profile dob is empty
          if (!mergedData.dob && nicoleData.birthday) {
            mergedData.dob = nicoleData.birthday;
          }
          
          // Use Nicole's interests if profile has no gift preferences
          if ((!mergedData.gift_preferences || mergedData.gift_preferences.length === 0) && 
              nicoleData.interests && Array.isArray(nicoleData.interests)) {
            mergedData.gift_preferences = nicoleData.interests.map((interest: string) => ({ 
              category: interest, 
              importance: "medium" 
            }));
          }

          // Generate a bio if none exists
          if (!mergedData.bio && nicoleData.name) {
            mergedData.bio = `Hi, I'm ${nicoleData.name}! I'm here to make gift giving and receiving easier.`;
          }
        }

        console.log("[Profile Setup] Setting merged profile data:", mergedData);
        setProfileData(mergedData);
        
        // Clear Nicole data after using it to prevent re-use
        if (nicoleData) {
          localStorage.removeItem("nicoleCollectedData");
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
