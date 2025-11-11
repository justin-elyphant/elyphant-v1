
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
          // Ensure birth_year is calculated from dob
          const birthYear = profileData.date_of_birth ? profileData.date_of_birth.getFullYear() : new Date().getFullYear();
          
          // Convert complex objects to JSON for database storage and ensure required fields
          const dbData = {
            ...apiData,
            birth_year: birthYear,
            email: profileData.email || user.email, // Ensure email is present
            first_name: apiData.first_name || profileData.name?.split(' ')[0] || 'User', // Ensure first_name with fallback
            last_name: apiData.last_name || profileData.name?.split(' ').slice(1).join(' ') || 'Name', // Ensure last_name with fallback
            username: apiData.username || profileData.email?.split('@')[0] || `user${Date.now()}`, // Generate username from email if missing
            updated_at: new Date().toISOString(),
            data_sharing_settings: apiData.data_sharing_settings ? JSON.stringify(apiData.data_sharing_settings) : null,
            gift_preferences: apiData.gift_preferences ? JSON.stringify(apiData.gift_preferences) : null,
            important_dates: apiData.important_dates ? JSON.stringify(apiData.important_dates) : null,
            shipping_address: apiData.shipping_address ? JSON.stringify(apiData.shipping_address) : null,
            wishlists: apiData.wishlists ? JSON.stringify(apiData.wishlists) : null
          };
          
          const { data, error } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              ...dbData
            }, {
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
