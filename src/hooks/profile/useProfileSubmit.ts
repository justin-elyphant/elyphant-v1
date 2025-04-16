import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { ProfileData } from "@/components/profile-setup/hooks/types";

interface UseProfileSubmitProps {
  onComplete: () => void;
  nextStepsOption?: string;
}

export const useProfileSubmit = ({ onComplete, nextStepsOption }: UseProfileSubmitProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const submitAttemptedRef = useRef(false);

  // Clear any lingering timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }
      // Also clear the loading flag from localStorage
      localStorage.removeItem("profileSetupLoading");
    };
  }, []);

  const handleSubmit = useCallback(async (profileData: ProfileData) => {
    if (submitAttemptedRef.current) {
      console.log("Submit already attempted, ignoring duplicate call");
      return;
    }
    
    submitAttemptedRef.current = true;
    setIsLoading(true);
    
    try {
      const userId = user?.id || localStorage.getItem("userId");
      const userEmail = user?.email || localStorage.getItem("userEmail") || profileData.email;
      const userName = profileData.name || localStorage.getItem("userName") || "";
      
      console.log("Profile submit for user:", userId);
      console.log("Raw profile data:", JSON.stringify(profileData, null, 2));
      
      if (!userId) {
        console.error("No user ID available");
        toast.error("Cannot save profile: No user ID available");
        setIsLoading(false);
        return;
      }
      
      // Create username from name if not provided
      const username = profileData.username || 
        userName.toLowerCase().replace(/\s+/g, '_') || 
        `user_${Date.now().toString(36)}`;
      
      // Format the complete profile data matching Supabase schema exactly
      const formattedData = {
        id: userId,
        name: userName,
        email: userEmail,
        username: username,
        bio: profileData.bio || `Hi, I'm ${userName}`,
        profile_image: profileData.profile_image || null,
        dob: profileData.dob || null,
        shipping_address: profileData.shipping_address || {},
        gift_preferences: Array.isArray(profileData.gift_preferences) 
          ? profileData.gift_preferences.map(pref => ({
              category: typeof pref === 'string' ? pref : pref.category,
              importance: "medium"
            }))
          : [],
        important_dates: Array.isArray(profileData.important_dates) 
          ? profileData.important_dates 
          : [],
        data_sharing_settings: profileData.data_sharing_settings || {
          dob: "friends",
          shipping_address: "private",
          gift_preferences: "public"
        },
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      // Log the exact payload being sent to Supabase
      console.log("PROFILE SUBMISSION - EXACT PAYLOAD:", JSON.stringify(formattedData, null, 2));
      console.log("Payload field presence check:", {
        hasShippingAddress: !!formattedData.shipping_address,
        hasGiftPreferences: Array.isArray(formattedData.gift_preferences),
        hasDataSharingSettings: !!formattedData.data_sharing_settings,
        hasDob: !!formattedData.dob,
        hasUsername: !!formattedData.username,
        hasBio: !!formattedData.bio,
        hasImportantDates: !!formattedData.important_dates && Array.isArray(formattedData.important_dates)
      });

      // Try multiple times to update the profile
      let attempts = 0;
      let success = false;
      
      while (attempts < 3 && !success) {
        attempts++;
        console.log(`Attempt ${attempts} to update profile`);
        
        try {
          // Update profile in Supabase
          const { data, error } = await supabase
            .from('profiles')
            .upsert(formattedData, {
              onConflict: 'id'
            });
            
          if (error) {
            console.error(`Profile update failed (attempt ${attempts}):`, error);
            if (attempts === 3) throw error;
          } else {
            console.log("Profile saved successfully:", data);
            success = true;
          }
        } catch (error) {
          console.error(`Error in upsert operation (attempt ${attempts}):`, error);
          // On last attempt, throw to exit the while loop
          if (attempts === 3) throw error;
          // Otherwise wait and try again
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (success) {
        toast.success("Profile setup complete!");
        
        // Clear signup flags
        localStorage.removeItem("newSignUp");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        localStorage.removeItem("profileSetupLoading");
        
        setIsLoading(false);
        onComplete();
      } else {
        throw new Error("Failed to update profile after multiple attempts");
      }
    } catch (err) {
      console.error("Error in profile submission:", err);
      toast.error("Failed to save profile");
      setIsLoading(false);
      onComplete(); // Still complete to prevent users getting stuck
    }
  }, [user, onComplete]);

  return {
    isLoading,
    handleSubmit
  };
};
