
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";

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
  const { user } = useAuth();
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
        // In a real app, fetch user profile from API
        // For demo, we'll use mock data based on the current user
        setTimeout(() => {
          if (user) {
            setInitialFormData({
              name: user.email?.split('@')[0] || 'User', // Use email prefix as name fallback
              email: user.email || '',
              bio: 'I love giving and receiving thoughtful gifts!',
              profile_image: null, // User type doesn't have profile_image
              address: {
                street: '123 Main St',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'United States',
              },
              interests: ['Photography', 'Travel', 'Cooking'],
              importantDates: [
                { 
                  date: new Date('2023-07-15'), 
                  description: 'Anniversary' 
                }
              ],
              data_sharing_settings: {
                dob: "friends",
                shipping_address: "friends",
                gift_preferences: "public",
              }
            });
          }
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [user]);

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
    // In a real app, this would be an API call to update the profile
    console.log('Saving profile data:', data);
    
    // Simulate API delay
    return new Promise((resolve) => {
      setTimeout(() => {
        setInitialFormData(data);
        resolve(data);
      }, 500);
    });
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
