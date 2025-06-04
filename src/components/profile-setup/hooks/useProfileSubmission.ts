
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { ProfileData } from "./types";
import { getDefaultDataSharingSettings } from "@/utils/privacyUtils";

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
      // Create username from name if not provided
      const username = profileData.name?.toLowerCase().replace(/\s+/g, '_') || 
        `user_${Date.now().toString(36)}`;

      // Format the data for storage - mapping new fields to database fields
      const formattedData = {
        id: user.id,
        name: profileData.name || "",
        username: username,
        email: profileData.email || user.email || "",
        profile_image: profileData.profile_image || null,
        bio: profileData.bio || `Hi, I'm ${profileData.name || "there"}`,
        dob: profileData.birthday ? profileData.birthday.toISOString().split('T')[0] : null,
        shipping_address: profileData.address || {},
        gift_preferences: Array.isArray(profileData.interests) 
          ? profileData.interests.map(interest => ({
              category: typeof interest === 'string' ? interest : interest,
              importance: 'medium'
            }))
          : [],
        important_dates: Array.isArray(profileData.importantDates) 
          ? profileData.importantDates.map(date => ({
              date: date.date.toISOString().split('T')[0],
              description: date.description
            }))
          : [],
        data_sharing_settings: {
          dob: "friends",
          shipping_address: "friends", 
          gift_preferences: "public",
          email: "private",
          ...(profileData.data_sharing_settings || {})
        },
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      console.log("EXACT PAYLOAD FOR PROFILE SUBMISSION:", JSON.stringify(formattedData, null, 2));

      // Try up to 3 times to save the profile data
      let attempts = 0;
      let success = false;
      
      while (attempts < 3 && !success) {
        attempts++;
        console.log(`Attempt ${attempts} to save profile data`);
        
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
        localStorage.removeItem("newSignUp");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
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
