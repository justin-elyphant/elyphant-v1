
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { ProfileData } from "./types";

interface UseProfileSubmissionProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const useProfileSubmission = ({ onComplete, onSkip }: UseProfileSubmissionProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async (profileData: ProfileData) => {
    if (!user && !process.env.REACT_APP_DEBUG_MODE) {
      console.error("Cannot complete profile setup: No user is logged in");
      toast.error("You must be logged in to complete profile setup");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Saving profile data:", profileData);
      
      // Format gift preferences
      const giftPreferences = profileData.gift_preferences.map(pref => {
        if (typeof pref === 'string') {
          return { category: pref, importance: "medium" };
        }
        return pref;
      });
      
      // Prepare update data
      const userData = {
        name: profileData.name,
        username: profileData.username,
        email: profileData.email,
        profile_image: profileData.profile_image,
        dob: profileData.dob,
        shipping_address: profileData.shipping_address,
        gift_preferences: giftPreferences,
        data_sharing_settings: profileData.data_sharing_settings,
        updated_at: new Date().toISOString()
      };
      
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update(userData)
          .eq('id', user.id);
      
        if (error) throw error;
        
        toast.success("Profile setup complete!");
        onComplete();
      } else if (process.env.REACT_APP_DEBUG_MODE) {
        // Debug mode, just proceed
        console.log("Debug mode: Would save profile data:", userData);
        toast.success("Profile setup complete (Debug Mode)");
        onComplete();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile data");
    } finally {
      setIsLoading(false);
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
