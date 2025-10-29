
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { ShippingAddress, DataSharingSettings, ImportantDateType, ProfileFormData } from "../types";

export const useProfileData = () => {
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
      interests: "friends",
      gift_preferences: "friends",
      email: "private"
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
        
        console.log("Loading profile data for user:", user.id);
        
        // Get profile data from Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Error loading profile data:", error);
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
            interests = data.gift_preferences.map((pref: any) => 
              typeof pref === 'string' ? pref : pref.category || ''
            ).filter(Boolean);
          } else if (data.interests && Array.isArray(data.interests)) {
            interests = (data.interests as any[]) || [];
          }
          
          // Map shipping_address to address
          const address: ShippingAddress = (data.shipping_address as any) || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          };
          
          console.log("Formatted address data:", address);
          console.log("Formatted interests:", interests);
          
          setInitialFormData({
            name: data.name || '',
            email: data.email || user.email || '',
            bio: data.bio || `Hi, I'm ${data.name || 'there'}`,
            profile_image: data.profile_image,
            birthday: birthdayDate,
            address: address,
            interests: interests,
            importantDates: importantDates,
            data_sharing_settings: (data.data_sharing_settings as any) || {
              dob: "friends",
              shipping_address: "friends",
              interests: "public",
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
  }, [user]);

  return {
    initialFormData,
    isLoading,
    user
  };
};
