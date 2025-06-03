
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
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // First check if Nicole collected any data
        const nicoleDataStr = localStorage.getItem("nicoleCollectedData");
        let nicoleData = null;
        if (nicoleDataStr) {
          try {
            nicoleData = JSON.parse(nicoleDataStr);
            console.log("Found Nicole collected data:", nicoleData);
          } catch (e) {
            console.error("Error parsing Nicole data:", e);
          }
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error("Error loading profile:", error);
          return;
        }
        
        // Ensure username is extracted, with fallback
        const username = data?.username || 
          (data?.email ? data.email.split('@')[0] : '') ||
          `user_${Date.now().toString(36)}`;
        
        // Merge Nicole data with existing profile data
        const mergedData = {
          name: nicoleData?.name || data?.name || "",
          username: username,
          bio: data?.bio || "",
          email: data?.email || user.email || '',
          profile_image: data?.profile_image || "",
          dob: nicoleData?.birthday || data?.dob || "",
          shipping_address: data?.shipping_address || {
            address_line1: "",
            city: "",
            state: "",
            zip_code: "",
            country: ""
          },
          gift_preferences: nicoleData?.interests ? 
            nicoleData.interests.map((interest: string) => ({ category: interest, importance: "medium" })) :
            data?.gift_preferences || [],
          important_dates: data?.important_dates || [],
          data_sharing_settings: data?.data_sharing_settings || getDefaultDataSharingSettings()
        };

        console.log("Setting profile data with Nicole integration:", mergedData);
        setProfileData(mergedData);
        
        // Clear Nicole data after using it
        if (nicoleData) {
          localStorage.removeItem("nicoleCollectedData");
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const updateProfileData = (field: keyof ProfileData, value: any) => {
    console.log(`Updating profile field "${field}" with value:`, value);
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  return {
    profileData,
    updateProfileData,
    isLoading
  };
};
