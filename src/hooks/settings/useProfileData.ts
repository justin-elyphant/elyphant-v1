
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { SettingsFormValues, ImportantDate } from "./settingsFormSchema";

export const useProfileData = (form: UseFormReturn<SettingsFormValues>) => {
  const { profile, loading, refetchProfile } = useProfile();

  // Load profile data when available
  const loadProfileData = () => {
    if (profile && !loading) {
      console.log("Loading profile data into settings form:", profile);
      
      // Convert birthday string to Date if available
      let birthdayDate = undefined;
      if (profile.dob) {
        try {
          birthdayDate = new Date(profile.dob);
        } catch (e) {
          console.error("Error parsing birthday date:", e);
        }
      }
      
      // Convert important dates if available
      const importantDates: ImportantDate[] = [];
      if (profile.important_dates && Array.isArray(profile.important_dates)) {
        profile.important_dates.forEach((date: any) => {
          if (date.date && date.description) {
            try {
              importantDates.push({
                date: new Date(date.date),
                description: date.description
              });
            } catch (e) {
              console.error("Error parsing important date:", e);
            }
          }
        });
      }
      
      // Extract interests from gift preferences
      const interests = Array.isArray(profile.gift_preferences)
        ? profile.gift_preferences.map((pref: any) => 
            typeof pref === 'string' ? pref : (pref.category || '')
          ).filter(Boolean)
        : [];
      
      // Map fields to form values
      form.reset({
        name: profile.name || '',
        email: profile.email || '',
        bio: profile.bio || '',
        profile_image: profile.profile_image || null,
        birthday: birthdayDate,
        address: profile.shipping_address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        interests: interests,
        importantDates: importantDates,
        data_sharing_settings: profile.data_sharing_settings || {
          dob: "friends",
          shipping_address: "private", 
          gift_preferences: "public"
        }
      });
      
      console.log("Profile data loaded into form successfully");
    }
  };

  // Load profile data when component mounts
  useEffect(() => {
    if (profile) {
      loadProfileData();
    }
  }, [profile]);

  return {
    profile,
    loading,
    loadProfileData,
    refetchProfile
  };
};
