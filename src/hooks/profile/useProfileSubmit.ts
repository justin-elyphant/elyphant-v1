
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
      // Skip database operation if user is not available
      if (!user?.id && !process.env.REACT_APP_DEBUG_MODE) {
        console.log("No user ID available - skipping database save");
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
      const formattedData = {
        id: user?.id,
        name: profileData.name || "User",
        username: profileData.username || `user_${Date.now().toString(36)}`,
        email: profileData.email || user?.email || '',
        profile_image: profileData.profile_image,
        dob: profileData.dob || null,
        bio: profileData.bio || "",
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
        important_dates: profileData.important_dates || [],
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };
      
      console.log('Profile data being submitted:', { 
        ...formattedData, 
        id: formattedData.id ? 'exists' : 'missing' 
      });
      
      // Only try to save if we have a user ID or debug mode
      if (user?.id || process.env.REACT_APP_DEBUG_MODE) {
        console.log("Attempting to save profile data to database");
        
        try {
          const { error } = await supabase
            .from('profiles')
            .upsert(formattedData)
            .select();
          
          if (error) {
            console.error("Profile save error:", error);
            toast.error("Failed to save profile. Continuing anyway.");
          } else {
            console.log("Profile saved successfully");
            toast.success("Profile setup complete!");
          }
        } catch (dbError) {
          console.error("Database operation error:", dbError);
        }
      } else {
        console.log("No user ID available - skipping database save");
        toast.info("Profile setup completed (without saving)");
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
