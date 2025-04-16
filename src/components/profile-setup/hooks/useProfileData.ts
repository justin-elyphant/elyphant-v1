
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfileData } from "./types";

export const useProfileData = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    // Add username to initial state
    username: "",
    // Add bio to initial state
    bio: "",
    email: user?.email || "",
    profile_image: null,
    dob: "",
    shipping_address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    },
    gift_preferences: [],
    important_dates: [],
    data_sharing_settings: {
      dob: "friends",
      shipping_address: "private",
      gift_preferences: "public",
    },
    next_steps_option: "dashboard"
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Error loading profile:", error);
          return;
        }
        
        if (data) {
          console.log("Loaded initial profile data:", data);
          
          // Ensure username is extracted, with fallback
          const username = data.username || 
            (data.email ? data.email.split('@')[0] : '') ||
            `user_${Date.now().toString(36)}`;
          
          setProfileData(prevData => ({
            ...prevData,
            name: data.name || prevData.name,
            username: username,
            // Add bio to profile data loading
            bio: data.bio || prevData.bio,
            email: data.email || user.email || '',
            profile_image: data.profile_image || prevData.profile_image,
            dob: data.dob || prevData.dob,
            shipping_address: data.shipping_address || prevData.shipping_address,
            gift_preferences: data.gift_preferences || [],
            important_dates: data.important_dates || [],
            data_sharing_settings: data.data_sharing_settings || {
              dob: "friends",
              shipping_address: "private",
              gift_preferences: "public"
            }
          }));
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const updateProfileData = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  return {
    profileData,
    updateProfileData,
    isLoading
  };
};
