
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { useProfile } from "@/hooks/profile/useProfile";
import { SettingsFormValues } from "./settingsFormSchema";

export const useProfileData = (form: UseFormReturn<SettingsFormValues>) => {
  const { profile, loading } = useProfile();

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
      const importantDates: {date: Date, description: string}[] = [];
      if (profile.important_dates && Array.isArray(profile.important_dates)) {
        profile.important_dates.forEach((date: any) => {
          if (date.date && date.description) {
            importantDates.push({
              date: new Date(date.date),
              description: date.description
            });
          }
        });
      }
      
      // Extract interests from gift preferences if available
      let interests: string[] = [];
      if (profile.gift_preferences && Array.isArray(profile.gift_preferences)) {
        interests = profile.gift_preferences.map((pref: any) => 
          typeof pref === 'string' ? pref : (pref.category || '')
        ).filter(Boolean);
      }
      
      // Map shipping_address to address
      const address = profile.shipping_address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      };
      
      form.reset({
        name: profile.name || '',
        email: profile.email || '',
        bio: profile.bio || '',
        profile_image: profile.profile_image,
        birthday: birthdayDate,
        address: address,
        interests: interests,
        importantDates: importantDates,
        data_sharing_settings: profile.data_sharing_settings || {
          dob: "private",
          shipping_address: "private",
          gift_preferences: "friends"
        }
      });
    }
  };

  return {
    profile,
    loading,
    loadProfileData
  };
};
