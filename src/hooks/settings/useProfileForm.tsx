
import { useState, useEffect } from "react";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/hooks/profile/useProfile";
import { toast } from "sonner";
import { Profile } from "@/types/supabase";

export interface ProfileFormData {
  name: string;
  email: string;
  username: string;
  birthday: Date | undefined;
  bio: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  interests: string[];
  importantDates: Array<{
    date: Date;
    description: string;
  }>;
  profile_image: string | null;
  data_sharing_settings: {
    dob: "public" | "friends" | "private";
    shipping_address: "public" | "friends" | "private";
    gift_preferences: "public" | "friends" | "private";
  };
}

export const useProfileForm = () => {
  const [userData, setUserData] = useLocalStorage("userData", null);
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<ProfileFormData>({
    name: userData?.name || "",
    email: userData?.email || "",
    username: userData?.username || "",
    birthday: userData?.birthday ? new Date(userData.birthday) : undefined,
    bio: userData?.bio || "",
    address: {
      street: userData?.address?.street || "",
      city: userData?.address?.city || "",
      state: userData?.address?.state || "",
      zipCode: userData?.address?.zipCode || "",
      country: userData?.address?.country || ""
    },
    interests: userData?.interests || [],
    importantDates: userData?.importantDates || [],
    profile_image: userData?.profile_image || null,
    data_sharing_settings: profile?.data_sharing_settings || {
      dob: "friends",
      shipping_address: "private",
      gift_preferences: "public"
    }
  });
  
  useEffect(() => {
    if (!profileLoading && profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || prev.name,
        email: user?.email || prev.email,
        profile_image: profile.profile_image || prev.profile_image,
        data_sharing_settings: profile.data_sharing_settings || prev.data_sharing_settings,
        bio: profile.bio || prev.bio
      }));
      
      // If profile has DOB, set it in the birthday field
      if (profile.dob) {
        // Convert MM-DD format to Date object (using current year)
        const [month, day] = profile.dob.split('-');
        const date = new Date();
        date.setMonth(parseInt(month, 10) - 1);
        date.setDate(parseInt(day, 10));
        setFormData(prev => ({
          ...prev,
          birthday: date
        }));
      }
      
      // If profile has shipping address, set it
      if (profile.shipping_address) {
        setFormData(prev => ({
          ...prev,
          address: profile.shipping_address
        }));
      }
      
      // If profile has gift preferences, set them as interests
      if (profile.gift_preferences) {
        setFormData(prev => ({
          ...prev,
          interests: profile.gift_preferences.map(pref => pref.category)
        }));
      }
      
      setIsLoading(false);
    }
  }, [profile, profileLoading, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBirthdayChange = (date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      birthday: date
    }));
  };

  const handleAddressAutocomplete = (address: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      address: {
        street: address.address,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country
      }
    }));
  };

  const handleProfileImageUpdate = (url: string | null) => {
    setFormData(prev => ({
      ...prev,
      profile_image: url
    }));
  };

  const addInterest = (newInterest: string) => {
    if (newInterest.trim() === "") return;
    
    setFormData(prev => ({
      ...prev,
      interests: [...prev.interests, newInterest.trim()]
    }));
  };

  const removeInterest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  const addImportantDate = (date: Date | undefined, description: string) => {
    if (!date || description.trim() === "") return;
    
    setFormData(prev => ({
      ...prev,
      importantDates: [
        ...prev.importantDates, 
        {
          date,
          description: description.trim()
        }
      ]
    }));
  };

  const removeImportantDate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      importantDates: prev.importantDates.filter((_, i) => i !== index)
    }));
  };

  const handleDataSharingChange = (setting: keyof Profile['data_sharing_settings'], value: "public" | "friends" | "private") => {
    setFormData(prev => ({
      ...prev,
      data_sharing_settings: {
        ...prev.data_sharing_settings,
        [setting]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        profile_image: formData.profile_image
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
      
      toast.success("Profile information updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  return {
    formData,
    isLoading,
    handleChange,
    handleBirthdayChange,
    handleAddressAutocomplete,
    handleProfileImageUpdate,
    addInterest,
    removeInterest,
    addImportantDate,
    removeImportantDate,
    handleDataSharingChange,
    handleSubmit,
    user
  };
};
