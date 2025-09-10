
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { ProfileData } from "./types";
import { profileFormToApiData } from "@/types/profile";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

export const useProfileSubmission = ({ onComplete, onSkip }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async (profileData: ProfileData) => {
    if (!user) {
      toast.error("You must be logged in to complete profile setup");
      return;
    }
    
    setIsLoading(true);
    console.log("Starting profile submission with data:", JSON.stringify(profileData, null, 2));
    
    try {
      // Use the same transformation logic as settings
      const apiData = profileFormToApiData(profileData);
      
      console.log("EXACT PAYLOAD FOR PROFILE SUBMISSION:", JSON.stringify(apiData, null, 2));

      // Try up to 3 times to save the profile data
      let attempts = 0;
      let success = false;
      
      while (attempts < 3 && !success) {
        attempts++;
        console.log(`Attempt ${attempts} to save profile data`);
        
        try {
        const upsertData = {
          id: user.id,
          ...apiData,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        };

        // Include address verification data if provided
        if (profileData.address_verified !== undefined) {
          upsertData.address_verified = profileData.address_verified;
          upsertData.address_verification_method = profileData.address_verification_method || 'profile_setup';
          upsertData.address_verified_at = profileData.address_verified_at || new Date().toISOString();
          upsertData.address_last_updated = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from('profiles')
          .upsert(upsertData, {
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
        // Clean up deprecated localStorage
        localStorage.removeItem("newSignUp");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        
        // Set state to trigger intent modal
        LocalStorageService.setProfileCompletionState({
          step: 'intent',
          source: 'email'
        });
        LocalStorageService.cleanupDeprecatedKeys();
        
        setIsLoading(false);
        onComplete();
      } else {
        throw new Error("Failed to save profile after multiple attempts");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile data, but continuing anyway");
      setIsLoading(false);
      onComplete();
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
