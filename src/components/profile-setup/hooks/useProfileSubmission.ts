
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { ProfileData } from "./types";

export const useProfileSubmission = ({ onComplete, onSkip }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async (profileData: ProfileData) => {
    if (!user) {
      toast.error("You must be logged in to complete profile setup");
      return;
    }
    
    setIsLoading(true);
    console.log("Starting profile submission with data:", profileData);
    
    try {
      // Format the data for storage
      const formattedData = {
        id: user.id,
        name: profileData.name,
        username: profileData.username,
        email: profileData.email || user.email,
        profile_image: profileData.profile_image,
        bio: profileData.bio || `Hi, I'm ${profileData.name}`,
        dob: profileData.dob,
        shipping_address: profileData.shipping_address,
        gift_preferences: profileData.gift_preferences.map(pref => ({
          category: typeof pref === 'string' ? pref : pref.category,
          importance: 'medium'
        })),
        important_dates: profileData.important_dates,
        data_sharing_settings: {
          ...profileData.data_sharing_settings,
          shipping_address: "friends" // Ensure shipping address is shared with friends
        },
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      console.log("Formatted profile data for submission:", formattedData);

      // Now that RLS allows users to directly insert their own profile,
      // we can simplify the insertion/update logic
      const { error } = await supabase
        .from('profiles')
        .upsert(formattedData, {
          onConflict: 'id'
        });

      if (error) {
        console.error("Error saving profile:", error);
        throw new Error(`Failed to save profile: ${error.message}`);
      }
      
      console.log("Profile saved successfully");
      toast.success("Profile setup complete!");

      // Clear signup-related flags
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      
      setIsLoading(false);
      onComplete();
      
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile data, but continuing anyway");
      setIsLoading(false);
      onComplete(); // Still complete to prevent users getting stuck
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      toast.info("You can complete your profile later in settings");
      onComplete();
    }
  };

  return {
    isLoading,
    handleComplete,
    handleSkip
  };
};
