
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { ProfileData } from "@/components/profile-setup/hooks/types";

interface UseProfileSubmitProps {
  onComplete: () => void;
}

export const useProfileSubmit = ({ onComplete }: UseProfileSubmitProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (profileData: ProfileData) => {
    // Add more comprehensive logging
    console.log("Profile submit initiated", { user, debugMode: process.env.REACT_APP_DEBUG_MODE });

    if (!user && !process.env.REACT_APP_DEBUG_MODE) {
      console.error("Cannot submit profile: No user is logged in");
      toast.error("You must be logged in to save your profile");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Comprehensive data formatting
      const formattedData = {
        id: user?.id,
        name: profileData.name || "User",
        username: profileData.username || `user_${Date.now().toString(36)}`,
        email: profileData.email || user?.email || '',
        profile_image: profileData.profile_image,
        dob: profileData.dob || null,
        bio: profileData.bio || "",
        shipping_address: profileData.shipping_address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: ""
        },
        gift_preferences: profileData.gift_preferences || [],
        data_sharing_settings: profileData.data_sharing_settings || {
          dob: "friends",
          shipping_address: "friends", // Explicitly set to friends
          gift_preferences: "public"
        },
        important_dates: profileData.important_dates || [],
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };
      
      console.log('Formatted profile data:', formattedData);
      
      if (user || process.env.REACT_APP_DEBUG_MODE) {
        // Explicitly handle both user and debug mode scenarios
        const { error } = await supabase
          .from('profiles')
          .upsert(formattedData)
          .select();
        
        if (error) {
          console.error("Profile save error:", error);
          toast.error("Failed to save profile. Please try again.");
          throw error;
        }
        
        console.log("Profile saved successfully");
        toast.success("Profile setup complete!");
      }
      
      // Ensure onComplete is called with a small delay to allow toast to show
      setTimeout(() => {
        setIsLoading(false);
        onComplete();
      }, 500);
      
    } catch (err) {
      console.error("Unexpected error in profile submission:", err);
      
      // Ensure loading state is always resolved
      setIsLoading(false);
      
      toast.error("An unexpected error occurred. Please try again.");
      
      // Still call onComplete to prevent being stuck
      onComplete();
    }
  };

  return {
    isLoading,
    handleSubmit
  };
};

