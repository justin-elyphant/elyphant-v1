
import { useState } from "react";
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

  const handleSubmit = async (profileData: ProfileData) => {
    // Add more comprehensive logging
    console.log("Profile submit initiated", { userId: user?.id });

    // Safety timeout to prevent stuck loading state
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Safety timeout triggered in useProfileSubmit - forcing completion");
        setIsLoading(false);
        onComplete();
      }
    }, 5000); // 5 second safety timeout
    
    setIsLoading(true);
    
    try {
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
          shipping_address: "friends", // Explicitly set to friends
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
        const { error } = await supabase
          .from('profiles')
          .upsert(formattedData)
          .select();
        
        if (error) {
          console.error("Profile save error:", error);
          toast.error("Failed to save profile. Continuing anyway.");
          // Still proceed even on error
        } else {
          console.log("Profile saved successfully");
          toast.success("Profile setup complete!");
        }
      } else {
        console.log("No user ID available - skipping database save");
        toast.info("Profile setup completed (without saving)");
      }
      
      // Clear safety timeout as we're proceeding normally
      clearTimeout(safetyTimeout);
      
      // Ensure loading state is cleared
      setIsLoading(false);
      
      // Always call onComplete regardless of save result
      onComplete();
      
    } catch (err) {
      console.error("Unexpected error in profile submission:", err);
      
      // Clear safety timeout as we're handling the error
      clearTimeout(safetyTimeout);
      
      // Ensure loading state is resolved
      setIsLoading(false);
      
      // Still call onComplete to prevent being stuck
      toast.error("An error occurred during setup, but we'll continue anyway.");
      onComplete();
    }
  };

  return {
    isLoading,
    handleSubmit
  };
};
