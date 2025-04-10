
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { ShippingAddress, SharingLevel, GiftPreference } from "@/types/supabase";

export interface ProfileData {
  name: string;
  username: string;
  email: string;
  profile_image: string | null;
  dob: string;
  shipping_address: ShippingAddress;
  gift_preferences: GiftPreference[];
  data_sharing_settings: {
    dob: SharingLevel;
    shipping_address: SharingLevel;
    gift_preferences: SharingLevel;
  };
  next_steps_option: string;
}

export const useProfileData = () => {
  const { user, getUserProfile } = useAuth();
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    username: "",
    email: user?.email || "",
    profile_image: null,
    dob: "",
    shipping_address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    },
    gift_preferences: [],
    data_sharing_settings: {
      dob: "friends" as SharingLevel,
      shipping_address: "private" as SharingLevel,
      gift_preferences: "public" as SharingLevel
    },
    next_steps_option: "dashboard"
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const profile = await getUserProfile();
        if (profile) {
          console.log("Loaded initial profile data:", profile);
          setProfileData(prevData => ({
            ...prevData,
            name: profile.name || prevData.name,
            username: profile.username || prevData.username || (profile.email ? profile.email.split('@')[0] : ''),
            email: profile.email || user.email || '',
            profile_image: profile.profile_image || prevData.profile_image,
            dob: profile.dob || prevData.dob,
            shipping_address: profile.shipping_address || prevData.shipping_address,
            gift_preferences: profile.gift_preferences || prevData.gift_preferences,
            data_sharing_settings: profile.data_sharing_settings || prevData.data_sharing_settings
          }));
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    };
    
    fetchUserProfile();
  }, [user, getUserProfile]);

  const updateProfileData = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  return {
    profileData,
    updateProfileData
  };
};
