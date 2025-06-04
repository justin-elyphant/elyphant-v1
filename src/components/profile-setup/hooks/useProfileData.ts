
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SettingsFormValues } from "@/hooks/settings/settingsFormSchema";
import { getDefaultDataSharingSettings } from "@/utils/privacyUtils";

export const useProfileData = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize with settings-compatible structure with all required fields
  const [profileData, setProfileData] = useState<SettingsFormValues>({
    name: "",
    email: user?.email || "",
    bio: "",
    profile_image: null,
    birthday: null,
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US"
    },
    interests: [],
    importantDates: [],
    data_sharing_settings: getDefaultDataSharingSettings()
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
          // Map profile data to settings format exactly, ensuring all required fields
          const mappedData: Partial<SettingsFormValues> = {
            name: profile.name || "",
            email: profile.email || user.email || "",
            bio: profile.bio || "",
            profile_image: profile.profile_image,
            birthday: profile.dob ? new Date(profile.dob) : null,
            address: {
              street: profile.shipping_address?.street || profile.shipping_address?.address_line1 || "",
              city: profile.shipping_address?.city || "",
              state: profile.shipping_address?.state || "",
              zipCode: profile.shipping_address?.zipCode || profile.shipping_address?.zip_code || "",
              country: profile.shipping_address?.country || "US"
            },
            interests: Array.isArray(profile.gift_preferences) 
              ? profile.gift_preferences.map((pref: any) => 
                  typeof pref === 'string' ? pref : (pref.category || '')
                ).filter(Boolean)
              : [],
            importantDates: Array.isArray(profile.important_dates)
              ? profile.important_dates.map((date: any) => ({
                  date: new Date(date.date),
                  description: date.description || date.title || ""
                })).filter((date: any) => date.date && date.description)
              : [],
            data_sharing_settings: profile.data_sharing_settings || getDefaultDataSharingSettings()
          };

          setProfileData(prev => ({ ...prev, ...mappedData }));
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

  const updateProfileData = (key: keyof SettingsFormValues, value: any) => {
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
