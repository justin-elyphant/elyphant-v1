
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfileData } from "./types";
import { getDefaultDataSharingSettings } from "@/utils/privacyUtils";
import { parseBirthdayFromStorage } from "@/utils/dataFormatUtils";

export const useProfileData = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize with complete required structure using consistent defaults
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: user?.email || "",
    bio: "",
    profile_image: null,
    date_of_birth: null,
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US"
    },
    interests: [],
    importantDates: [],
    data_sharing_settings: getDefaultDataSharingSettings(),
    next_steps_option: undefined
  });

  // Load existing profile data if available
  useEffect(() => {
    const loadExistingProfile = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading profile:", error);
          return;
        }

        if (profile) {
          console.log("Loading existing profile data:", profile);
          
          // Ensure complete data sharing settings with email field using consistent defaults
          const shippingAddressData = profile.shipping_address as any;
          const giftPreferencesData = profile.gift_preferences as any;
          const importantDatesData = profile.important_dates as any;
          const dataSharingData = profile.data_sharing_settings as any;
          
          const completeDataSharingSettings = {
            ...getDefaultDataSharingSettings(),
            ...(dataSharingData || {})
          };

          // Convert stored birthday back to full date
          let fullBirthDate: Date | null = null;
          if (profile.dob && profile.birth_year) {
            const [month, day] = profile.dob.split('-').map(Number);
            fullBirthDate = new Date(profile.birth_year, month - 1, day);
          }

          // Map profile data to onboarding format with proper structure
          const mappedData: Partial<ProfileData> = {
            name: profile.name || "",
            email: profile.email || user.email || "",
            bio: profile.bio || "",
            profile_image: profile.profile_image,
            date_of_birth: fullBirthDate,
            address: {
              street: shippingAddressData?.street || shippingAddressData?.address_line1 || "",
              city: shippingAddressData?.city || "",
              state: shippingAddressData?.state || "",
              zipCode: shippingAddressData?.zipCode || shippingAddressData?.zip_code || "",
              country: shippingAddressData?.country || "US"
            },
            interests: Array.isArray(giftPreferencesData) 
              ? giftPreferencesData.map((pref: any) => 
                  typeof pref === 'string' ? pref : (pref.category || '')
                ).filter(Boolean)
              : [],
            importantDates: Array.isArray(importantDatesData)
              ? importantDatesData.map((date: any) => ({
                  date: new Date(date.date),
                  description: date.description || date.title || ""
                })).filter((date: any) => date.date && date.description)
              : [],
            data_sharing_settings: completeDataSharingSettings
          };

          setProfileData(prev => ({ ...prev, ...mappedData }));
          console.log("Profile data loaded with full birthday:", fullBirthDate);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load existing profile data");
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingProfile();
  }, [user?.id, user?.email]);

  const updateProfileData = (key: keyof ProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return {
    profileData,
    updateProfileData,
    isLoading
  };
};
