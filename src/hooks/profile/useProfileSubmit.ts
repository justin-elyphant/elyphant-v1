
import { useState, useEffect, useRef, useCallback } from "react";
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
    // Don't allow multiple submit attempts
    if (submitAttemptedRef.current) {
      console.log("Submit already attempted, ignoring duplicate call");
      return;
    }
    
    submitAttemptedRef.current = true;
    setIsLoading(true);
    
    try {
      // Get user ID from multiple sources for reliability
      const userId = user?.id || localStorage.getItem("userId");
      const userEmail = user?.email || localStorage.getItem("userEmail") || profileData.email;
      
      console.log("Profile submit for user:", userId, "with email:", userEmail);
      console.log("Next steps option:", nextStepsOption || profileData.next_steps_option || "dashboard");
      
      if (!userId) {
        console.error("No user ID available from any source");
        toast.error("Cannot save profile: No user ID available");
        setIsLoading(false);
        
        // Still call onComplete to proceed even if saving fails
        setTimeout(() => {
          onComplete();
        }, 50);
        return;
      }
      
      // Prepare profile data
      const formattedData = {
        name: profileData.name || "User",
        email: userEmail,
        profile_image: profileData.profile_image,
        dob: profileData.dob || null,
        bio: profileData.bio || `Hi, I'm ${profileData.name || "User"}`,
        shipping_address: profileData.shipping_address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: ""
        },
        gift_preferences: profileData.gift_preferences || [],
        important_dates: profileData.important_dates || [],
        data_sharing_settings: profileData.data_sharing_settings || {
          dob: "friends",
          shipping_address: "friends",
          gift_preferences: "public"
        },
        updated_at: new Date().toISOString(),
        username: profileData.username || `user_${Date.now().toString(36)}`,
        next_steps_option: profileData.next_steps_option || nextStepsOption || "dashboard",
        // Add onboarding_completed flag
        onboarding_completed: true
      };
      
      console.log("Creating/updating profile for user:", userId);
      console.log("Profile data to be saved:", formattedData);
      
      // Set a timeout to proceed regardless of API response
      submitTimeoutRef.current = setTimeout(() => {
        if (isLoading) { // Check if we're still loading
          console.warn("Profile submission timeout - proceeding anyway");
          setIsLoading(false);
          
          // Store the nextStepsOption in localStorage before completing
          if (nextStepsOption || (profileData && profileData.next_steps_option)) {
            localStorage.setItem("nextStepsOption", nextStepsOption || profileData.next_steps_option || "dashboard");
          }
          
          // Set a flag to indicate profile is completed
          localStorage.setItem("profileCompleted", "true");
          localStorage.removeItem("profileSetupLoading");
          
          onComplete();
        }
      }, 7000); // Increase timeout to 7 seconds
      
      try {
        // Try multiple update methods for reliability
        let updateSuccess = false;
        
        // 1. Try edge function first
        try {
          const response = await supabase.functions.invoke('create-profile', {
            body: {
              user_id: userId,
              profile_data: formattedData
            }
          });
          
          if (!response.error) {
            console.log("Profile saved via edge function:", response.data);
            updateSuccess = true;
          } else {
            console.error("Edge function profile update failed:", response.error);
          }
        } catch (edgeFnError) {
          console.error("Error calling edge function:", edgeFnError);
        }
        
        // 2. If edge function failed, try direct database update
        if (!updateSuccess) {
          const { error: directError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              ...formattedData,
              onboarding_completed: true
            }, {
              onConflict: 'id'
            });
              
          if (directError) {
            console.error("Direct profile update failed:", directError);
            throw directError;
          } else {
            console.log("Profile saved successfully via direct update");
            updateSuccess = true;
          }
        }
        
        if (updateSuccess) {
          toast.success("Profile setup complete!");
        } else {
          toast.error("Failed to save profile data completely. Some features may be limited.");
        }
      } catch (directErr) {
        console.error("Error in profile update:", directErr);
        toast.error("Error saving profile data, but continuing anyway");
      }
      
      // Clear the timeout since we got a response
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }
      
      // Store the nextStepsOption in localStorage before completing
      if (nextStepsOption || (profileData && profileData.next_steps_option)) {
        localStorage.setItem("nextStepsOption", nextStepsOption || profileData.next_steps_option || "dashboard");
      }
      
      // Set a flag to indicate profile is completed
      localStorage.setItem("profileCompleted", "true");
      localStorage.removeItem("profileSetupLoading");
      
      // Directly call onComplete after ensuring state updates have propagated
      setIsLoading(false);
      setTimeout(() => {
        onComplete();
      }, 100);
      
    } catch (err) {
      console.error("Unexpected error in profile submission:", err);
      toast.error("Failed to save profile, continuing anyway");
      
      // Clear loading state and continue
      setIsLoading(false);
      localStorage.removeItem("profileSetupLoading");
      
      // Even on error, let's continue rather than leaving the user stuck
      setTimeout(() => {
        onComplete();
      }, 100);
    }
  }, [user, onComplete, nextStepsOption]);

  return {
    isLoading,
    handleSubmit
  };
};
