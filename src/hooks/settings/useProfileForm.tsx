
import { useState, useEffect } from "react";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/hooks/profile/useProfile";
import { ProfileFormSchema } from "@/schemas/profileSchema";
import { Profile } from "@/types/supabase";

export const useProfileForm = () => {
  const [userData, setUserData] = useLocalStorage("userData", null);
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const [isLoading, setIsLoading] = useState(true);

  const [initialFormData, setInitialFormData] = useState<Partial<ProfileFormSchema>>({
    name: "",
    email: "",
    username: "",
    birthday: undefined,
    bio: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    },
    interests: [],
    importantDates: [],
    profile_image: null,
    data_sharing_settings: {
      dob: "friends",
      shipping_address: "private",
      gift_preferences: "public"
    }
  });
  
  useEffect(() => {
    if (!profileLoading && profile) {
      setInitialFormData(prevData => ({
        ...prevData,
        name: profile.name || userData?.name || prevData.name,
        email: user?.email || userData?.email || prevData.email,
        username: userData?.username || prevData.username,
        bio: profile.bio || userData?.bio || prevData.bio,
        profile_image: profile.profile_image || userData?.profile_image || prevData.profile_image,
        data_sharing_settings: profile.data_sharing_settings || prevData.data_sharing_settings
      }));
      
      // If profile has DOB, set it in the birthday field
      if (profile.dob) {
        // Convert MM-DD format to Date object (using current year)
        const [month, day] = profile.dob.split('-');
        const date = new Date();
        date.setMonth(parseInt(month, 10) - 1);
        date.setDate(parseInt(day, 10));
        setInitialFormData(prevData => ({
          ...prevData,
          birthday: date
        }));
      }
      
      // If profile has shipping address, set it
      if (profile.shipping_address) {
        setInitialFormData(prevData => ({
          ...prevData,
          address: profile.shipping_address
        }));
      }
      
      // If profile has gift preferences, set them as interests
      if (profile.gift_preferences) {
        setInitialFormData(prevData => ({
          ...prevData,
          interests: profile.gift_preferences.map(pref => pref.category)
        }));
      }
      
      setIsLoading(false);
    }
  }, [profile, profileLoading, user, userData]);

  const handleProfileImageUpdate = (url: string | null) => {
    setInitialFormData(prev => ({
      ...prev,
      profile_image: url
    }));
  };

  const addInterest = (newInterest: string) => {
    if (newInterest.trim() === "") return;
    
    setInitialFormData(prev => ({
      ...prev,
      interests: [...(prev.interests || []), newInterest.trim()]
    }));
  };

  const removeInterest = (index: number) => {
    setInitialFormData(prev => ({
      ...prev,
      interests: (prev.interests || []).filter((_, i) => i !== index)
    }));
  };

  const addImportantDate = (date: Date | undefined, description: string) => {
    if (!date || description.trim() === "") return;
    
    setInitialFormData(prev => ({
      ...prev,
      importantDates: [
        ...(prev.importantDates || []), 
        {
          date,
          description: description.trim()
        }
      ]
    }));
  };

  const removeImportantDate = (index: number) => {
    setInitialFormData(prev => ({
      ...prev,
      importantDates: (prev.importantDates || []).filter((_, i) => i !== index)
    }));
  };

  const saveProfile = async (formData: ProfileFormSchema) => {
    if (isLoading) return;
    
    try {
      // Create the DOB string in MM-DD format
      let dobString = "";
      if (formData.birthday) {
        const month = String(formData.birthday.getMonth() + 1).padStart(2, '0');
        const day = String(formData.birthday.getDate()).padStart(2, '0');
        dobString = `${month}-${day}`;
      }
      
      // Create gift preferences from interests
      const giftPreferences = formData.interests.map(interest => ({
        category: interest,
        importance: "medium" as const
      }));
      
      // Update profile in Supabase
      await updateProfile({
        name: formData.name,
        dob: dobString || null,
        shipping_address: formData.address,
        gift_preferences: giftPreferences,
        data_sharing_settings: formData.data_sharing_settings,
        profile_image: formData.profile_image,
        bio: formData.bio
      });
      
      // Update local storage
      setUserData({
        ...userData,
        name: formData.name,
        email: formData.email,
        username: formData.username,
        birthday: formData.birthday,
        bio: formData.bio,
        address: formData.address,
        interests: formData.interests,
        importantDates: formData.importantDates,
        profile_image: formData.profile_image
      });
      
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  return {
    initialFormData,
    isLoading,
    handleProfileImageUpdate,
    addInterest,
    removeInterest,
    addImportantDate,
    removeImportantDate,
    saveProfile,
    user
  };
};
