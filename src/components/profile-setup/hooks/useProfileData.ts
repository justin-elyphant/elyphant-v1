
import { useState, useCallback, useEffect } from "react";
import { ProfileData, BirthdayData } from "./types";
import { getDefaultDataSharingSettings } from "@/utils/privacyUtils";

const getInitialProfileData = (): ProfileData => ({
  name: "",
  email: "",
  bio: "",
  profile_image: null,
  birthday: null,
  address: {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: ""
  },
  interests: [],
  importantDates: [],
  data_sharing_settings: getDefaultDataSharingSettings()
});

export const useProfileData = () => {
  const [profileData, setProfileData] = useState<ProfileData>(getInitialProfileData);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with any saved data or defaults
  useEffect(() => {
    try {
      // Try to load from localStorage if available (for development)
      const saved = localStorage.getItem("profileSetupData");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure data_sharing_settings has all required fields
        if (!parsed.data_sharing_settings || !parsed.data_sharing_settings.email) {
          parsed.data_sharing_settings = {
            ...getDefaultDataSharingSettings(),
            ...parsed.data_sharing_settings
          };
        }
        setProfileData(parsed);
      }
    } catch (error) {
      console.log("No saved profile data found, using defaults");
    }
  }, []);

  // Save to localStorage whenever data changes (for development)
  useEffect(() => {
    try {
      localStorage.setItem("profileSetupData", JSON.stringify(profileData));
    } catch (error) {
      console.log("Could not save profile data to localStorage");
    }
  }, [profileData]);

  const updateProfileData = useCallback((key: keyof ProfileData, value: any) => {
    console.log(`Updating profile data: ${key} =`, value);
    
    setProfileData(prev => {
      const updated = { ...prev, [key]: value };
      
      // Special handling for birthday - auto-add to important dates
      if (key === 'birthday' && value && !prev.importantDates.some(date => date.description === "My Birthday")) {
        const birthdayDate = {
          date: new Date(2000, value.month - 1, value.day), // Use dummy year
          description: "My Birthday"
        };
        updated.importantDates = [birthdayDate, ...prev.importantDates];
      }
      
      return updated;
    });
  }, []);

  const resetProfileData = useCallback(() => {
    setProfileData(getInitialProfileData());
    localStorage.removeItem("profileSetupData");
  }, []);

  return {
    profileData,
    updateProfileData,
    resetProfileData,
    isLoading
  };
};
