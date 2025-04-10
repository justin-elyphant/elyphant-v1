
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfileData } from "./useProfileData";
import { useAuth } from "@/contexts/auth";

interface UseProfileSubmissionProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const useProfileSubmission = ({ onComplete, onSkip }: UseProfileSubmissionProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async (profileData: ProfileData) => {
    try {
      setIsLoading(true);
      
      const formattedGiftPreferences = profileData.gift_preferences.map(pref => ({
        category: pref.category,
        importance: pref.importance || "medium"
      }));
      
      let dataToUpdate: any = {
        name: profileData.name,
        email: profileData.email,
        profile_image: profileData.profile_image,
        dob: profileData.dob,
        shipping_address: profileData.shipping_address,
        gift_preferences: formattedGiftPreferences,
        data_sharing_settings: profileData.data_sharing_settings,
        updated_at: new Date().toISOString(),
        
        bio: profileData.name ? `Hi, I'm ${profileData.name}` : "Hello!",
        interests: formattedGiftPreferences.map(pref => pref.category)
      };
      
      console.log("Saving final profile data:", dataToUpdate);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(dataToUpdate)
        .eq('id', user?.id)
        .select();
      
      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }
      
      console.log("Profile setup completed successfully:", data);
      toast.success("Profile updated successfully!");
      
      switch (profileData.next_steps_option) {
        case "create_wishlist":
          navigate("/wishlist/create");
          break;
        case "find_friends":
          navigate("/connections");
          break;
        case "shop_gifts":
          navigate("/marketplace");
          break;
        case "explore_marketplace":
          navigate("/marketplace/explore");
          break;
        default:
          onComplete();
      }
    } catch (err) {
      console.error("Error completing profile setup:", err);
      toast.error("Failed to save profile data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    toast.info("You can complete your profile later in settings");
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  return {
    isLoading,
    handleComplete,
    handleSkip
  };
};
