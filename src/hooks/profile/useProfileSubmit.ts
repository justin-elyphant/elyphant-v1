
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { ProfileData } from "@/components/profile-setup/hooks/types";

interface UseProfileSubmitProps {
  onComplete: () => void;
}

export const useProfileSubmit = ({ onComplete }: UseProfileSubmitProps) => {
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
    };
  }, []);

  const handleSubmit = useCallback(async (profileData: ProfileData) => {
    // Don't allow multiple submit attempts
    if (submitAttemptedRef.current) {
      console.log("Submit already attempted, ignoring duplicate call");
      return;
    }
    
    submitAttemptedRef.current = true;
    console.log("Profile submit initiated", { userId: user?.id });
    setIsLoading(true);
    
    // Safety timeout to prevent stuck loading state - shorter timeout
    submitTimeoutRef.current = setTimeout(() => {
      console.warn("Safety timeout triggered in useProfileSubmit - forcing completion");
      setIsLoading(false);
      onComplete();
    }, 2000); // Reduced from 3000 to 2000 ms
    
    try {
      // Determine user ID - use auth if available or look at localStorage
      const userId = user?.id || localStorage.getItem("userId");
      const userEmail = user?.email || localStorage.getItem("userEmail") || profileData.email;
      
      console.log("Looking for user with ID:", userId, "or email:", userEmail);
      
      if (!userId && !userEmail) {
        console.log("No user ID or email available - skipping database save");
        toast.info("Profile setup completed (without saving)");
        
        // Clear timeout and loading state
        if (submitTimeoutRef.current) {
          clearTimeout(submitTimeoutRef.current);
          submitTimeoutRef.current = null;
        }
        setIsLoading(false);
        
        // Still call onComplete to proceed
        onComplete();
        return;
      }
      
      // Prepare profile data
      const formattedData = {
        name: profileData.name || "User",
        email: userEmail,
        profile_image: profileData.profile_image,
        dob: profileData.dob || null,
        shipping_address: profileData.shipping_address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: ""
        },
        gift_preferences: profileData.gift_preferences || [],
        data_sharing_settings: profileData.data_sharing_settings || {
          dob: "friends",
          shipping_address: "friends",
          gift_preferences: "public"
        },
        updated_at: new Date().toISOString()
      };
      
      if (userId) {
        console.log("Creating/updating profile via Edge Function for user:", userId);
        
        try {
          // Use our Edge Function to create/update the profile
          const response = await supabase.functions.invoke('create-profile', {
            body: {
              user_id: userId,
              profile_data: formattedData
            }
          });
          
          if (response.error) {
            console.error("Error with create-profile edge function:", response.error);
            toast.error("Failed to save profile. Please try again later.");
          } else {
            console.log("Profile saved successfully via edge function:", response.data);
            toast.success("Profile setup complete!");
          }
        } catch (err) {
          console.error("Failed to call create-profile function:", err);
          toast.error("Error saving profile data.");
        }
      } else {
        console.log("No user ID available, can't save profile");
        toast.warning("No user ID available, profile not saved");
      }
    } catch (err) {
      console.error("Unexpected error in profile submission:", err);
    } finally {
      // Always clean up timeout and loading state
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }
      
      // Ensure loading state is cleared
      setIsLoading(false);
      
      // Directly call onComplete after a very short delay to ensure state updates have propagated
      setTimeout(() => {
        onComplete();
      }, 50);
    }
  }, [user, onComplete]);

  return {
    isLoading,
    handleSubmit
  };
};
