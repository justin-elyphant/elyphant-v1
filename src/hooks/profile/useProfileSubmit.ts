
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProfileData } from "@/components/profile-setup/hooks/types";
import { getDefaultDataSharingSettings } from "@/utils/privacyUtils";

interface UseProfileSubmitProps {
  onComplete: () => void;
  nextStepsOption?: string;
}

export const useProfileSubmit = ({ onComplete, nextStepsOption = "dashboard" }: UseProfileSubmitProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Store next steps option for handling completion
  useEffect(() => {
    if (nextStepsOption && nextStepsOption !== "dashboard") {
      localStorage.setItem("nextStepsOption", nextStepsOption);
    }
  }, [nextStepsOption]);

  const validateProfileData = (data: ProfileData): string[] => {
    const errors: string[] = [];
    
    // Basic required field validation
    if (!data.name || data.name.trim() === "") {
      errors.push("Name is required");
    }
    
    if (!data.username || data.username.trim() === "") {
      errors.push("Username is required");
    }
    
    // Ensure data_sharing_settings has required fields
    if (!data.data_sharing_settings) {
      errors.push("Data sharing settings are missing");
    } else {
      const requiredSettings = ['dob', 'shipping_address', 'gift_preferences', 'email'];
      for (const setting of requiredSettings) {
        if (!data.data_sharing_settings[setting]) {
          errors.push(`Missing ${setting} privacy setting`);
        }
      }
    }
    
    return errors;
  };

  const handleSubmit = useCallback(async (profileData: ProfileData) => {
    if (!user) {
      toast.error("You must be logged in to complete profile setup");
      return;
    }
    
    // Validate profile data
    const validationErrors = validateProfileData(profileData);
    if (validationErrors.length > 0) {
      toast.error(`Please correct the following: ${validationErrors.join(", ")}`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create username from name if not provided
      const username = profileData.username || 
        profileData.name?.toLowerCase().replace(/\s+/g, '_') || 
        `user_${Date.now().toString(36)}`;

      // Format the data for storage - ensuring ALL fields are included
      const formattedData = {
        id: user.id,
        name: profileData.name || "",
        username: username,
        email: profileData.email || user.email || "",
        profile_image: profileData.profile_image || null,
        bio: profileData.bio || `Hi, I'm ${profileData.name || "there"}`,
        dob: profileData.dob || null,
        shipping_address: profileData.shipping_address || {},
        gift_preferences: Array.isArray(profileData.gift_preferences) 
          ? profileData.gift_preferences 
          : [],
        important_dates: Array.isArray(profileData.important_dates) 
          ? profileData.important_dates 
          : [],
        data_sharing_settings: profileData.data_sharing_settings || getDefaultDataSharingSettings(),
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      // Try up to 3 times to save the profile data
      let attempts = 0;
      let success = false;
      
      while (attempts < 3 && !success) {
        attempts++;
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .upsert(formattedData, {
              onConflict: 'id'
            });

          if (error) {
            console.error(`Error saving profile (attempt ${attempts}):`, error);
            if (attempts === 3) throw error;
          } else {
            console.log("Profile saved successfully, response:", data);
            success = true;
          }
        } catch (error) {
          console.error(`Error in upsert operation (attempt ${attempts}):`, error);
          if (attempts === 3) throw error;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (success) {
        toast.success("Profile setup complete!");

        // Clear signup-related flags
        localStorage.removeItem("newSignUp");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        localStorage.removeItem("profileSetupLoading");
        
        setIsLoading(false);
        onComplete();
      } else {
        throw new Error("Failed to save profile after multiple attempts");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile data");
      setIsLoading(false);
    }
  }, [user, onComplete]);

  return {
    isLoading,
    handleSubmit
  };
};

export default useProfileSubmit;
