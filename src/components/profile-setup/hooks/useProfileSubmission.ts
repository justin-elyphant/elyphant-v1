
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { ProfileData } from "./types";

interface UseProfileSubmissionProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const useProfileSubmission = ({ onComplete, onSkip }: UseProfileSubmissionProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async (profileData: ProfileData) => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    try {
      setIsLoading(true);
      
      // Format gift preferences
      const gift_preferences = profileData.gift_preferences.map(pref => {
        if (typeof pref === 'string') {
          return { category: pref, importance: "medium" };
        }
        return pref;
      });
      
      // Prepare data for update
      const updateData = {
        name: profileData.name,
        email: profileData.email,
        username: profileData.username,
        profile_image: profileData.profile_image,
        dob: profileData.dob,
        shipping_address: profileData.shipping_address,
        gift_preferences: gift_preferences,
        data_sharing_settings: profileData.data_sharing_settings,
        profile_completed: true,
        updated_at: new Date().toISOString()
      };
      
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
        
      if (error) throw error;
      
      console.log("Profile setup completed successfully");
      toast.success("Profile setup completed!");
      
      // Call the onComplete callback
      onComplete();
    } catch (error) {
      console.error('Error completing profile setup:', error);
      toast.error("Failed to save profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return {
    isLoading,
    handleComplete,
    handleSkip
  };
};
