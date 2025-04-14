
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
        return;
      }
      
      // Comprehensive data formatting
      const formattedData: any = {
        name: profileData.name || "User",
        username: profileData.username || `user_${Date.now().toString(36)}`,
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
      
      // If we have a user ID, use it
      if (userId) {
        formattedData.id = userId;
      }
      
      console.log('Profile data being submitted:', formattedData);
      
      try {
        let saveResult;
        
        // First try to find the profile by ID
        if (userId) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle();
            
          if (existingProfile) {
            // Update existing profile
            console.log("Updating existing profile with ID:", userId);
            saveResult = await supabase
              .from('profiles')
              .update(formattedData)
              .eq('id', userId)
              .select();
          } else {
            // Insert new profile with ID
            console.log("Creating new profile with ID:", userId);
            saveResult = await supabase
              .from('profiles')
              .insert(formattedData)
              .select();
          }
        } 
        // If no user ID, try to find by email
        else if (userEmail) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', userEmail)
            .maybeSingle();
            
          if (existingProfile) {
            // Update existing profile by email
            console.log("Updating existing profile with email:", userEmail);
            saveResult = await supabase
              .from('profiles')
              .update(formattedData)
              .eq('email', userEmail)
              .select();
          } else {
            // Insert new profile with email
            console.log("Creating new profile with email:", userEmail);
            saveResult = await supabase
              .from('profiles')
              .insert(formattedData)
              .select();
          }
        }
        
        if (saveResult?.error) {
          console.error("Profile save error:", saveResult.error);
          toast.error("Failed to save profile. Continuing anyway.");
        } else {
          console.log("Profile saved successfully");
          toast.success("Profile setup complete!");
        }
      } catch (dbError) {
        console.error("Database operation error:", dbError);
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
