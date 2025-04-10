
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface DataSharingSettings {
  dob: "public" | "friends" | "private";
  shipping_address: "public" | "friends" | "private";
  gift_preferences: "public" | "friends" | "private";
}

export interface ImportantDateType {
  date: Date;
  description: string;
}

export interface ProfileFormData {
  name: string;
  email: string;
  username?: string;
  bio?: string;
  birthday?: Date;
  profile_image?: string | null;
  address: ShippingAddress;
  interests: string[];
  importantDates: ImportantDateType[];
  data_sharing_settings: DataSharingSettings;
}

export const useProfileForm = () => {
  const { user, getUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [initialFormData, setInitialFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    bio: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    interests: [],
    importantDates: [],
    data_sharing_settings: {
      dob: "private",
      shipping_address: "private",
      gift_preferences: "friends",
    }
  });

  useEffect(() => {
    const loadUserProfile = async () => {
      setIsLoading(true);
      try {
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        // Get profile data from Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          console.log("Loaded profile data for settings:", data);
          
          // Convert birthday string to Date if available
          let birthdayDate = undefined;
          if (data.dob) {
            try {
              birthdayDate = new Date(data.dob);
            } catch (e) {
              console.error("Error parsing birthday date:", e);
            }
          }
          
          // Convert important dates if available
          const importantDates: ImportantDateType[] = [];
          if (data.important_dates && Array.isArray(data.important_dates)) {
            data.important_dates.forEach((date: any) => {
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
          if (data.gift_preferences && Array.isArray(data.gift_preferences)) {
            interests = data.gift_preferences.map((pref: any) => pref.category);
          } else if (data.interests && Array.isArray(data.interests)) {
            interests = data.interests;
          }
          
          // Map shipping_address to address
          const address: ShippingAddress = data.shipping_address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          };
          
          setInitialFormData({
            name: data.name || '',
            email: data.email || user.email || '',
            bio: data.bio || `Hi, I'm ${data.name}`,
            profile_image: data.profile_image,
            birthday: birthdayDate,
            address: address,
            interests: interests,
            importantDates: importantDates,
            data_sharing_settings: data.data_sharing_settings || {
              dob: "friends",
              shipping_address: "friends",
              gift_preferences: "public",
            }
          });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [user, getUserProfile]);

  // Handle profile image update
  const handleProfileImageUpdate = (imageUrl: string) => {
    setInitialFormData(prev => ({
      ...prev,
      profile_image: imageUrl,
    }));
  };

  // Handle adding an interest
  const addInterest = (interest: string) => {
    setInitialFormData(prev => ({
      ...prev,
      interests: [...prev.interests, interest]
    }));
  };

  // Handle removing an interest
  const removeInterest = (index: number) => {
    setInitialFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  // Handle adding an important date
  const addImportantDate = (date: ImportantDateType) => {
    setInitialFormData(prev => ({
      ...prev,
      importantDates: [...prev.importantDates, date]
    }));
  };

  // Handle removing an important date
  const removeImportantDate = (index: number) => {
    setInitialFormData(prev => ({
      ...prev,
      importantDates: prev.importantDates.filter((_, i) => i !== index)
    }));
  };

  // Save profile information
  const saveProfile = async (data: ProfileFormData) => {
    try {
      console.log('Saving profile data:', data);
      
      // Format gift preferences from interests
      const gift_preferences = data.interests.map(interest => ({
        category: interest,
        importance: "medium"
      }));
      
      // Format important dates
      const important_dates = data.importantDates.map(date => ({
        date: date.date.toISOString(),
        description: date.description
      }));
      
      // Prepare data for update
      const updateData = {
        name: data.name,
        email: data.email,
        bio: data.bio,
        profile_image: data.profile_image,
        dob: data.birthday ? data.birthday.toISOString() : null,
        shipping_address: data.address,
        gift_preferences: gift_preferences,
        important_dates: important_dates,
        data_sharing_settings: data.data_sharing_settings,
        updated_at: new Date().toISOString()
      };
      
      const { data: updatedData, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user?.id)
        .select();
        
      if (error) throw error;
      
      console.log('Profile updated successfully:', updatedData);
      setInitialFormData(data);
      return updatedData;
    } catch (error) {
      console.error('Error saving profile:', error);
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
