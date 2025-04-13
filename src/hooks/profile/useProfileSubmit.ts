
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
    if (!user && !process.env.REACT_APP_DEBUG_MODE) {
      console.error("Cannot submit profile: No user is logged in");
      toast.error("You must be logged in to save your profile");
      return;
    }
    
    setIsLoading(true);
    console.log("Saving profile data to database:", profileData);
    
    try {
      // Format the data for saving to the profiles table
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
          shipping_address: "private",
          gift_preferences: "public"
        },
        important_dates: profileData.important_dates || [],
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };
      
      if (user) {
        // Update the database - use upsert to create if not exists
        const { error } = await supabase
          .from('profiles')
          .upsert(formattedData);
          
        if (error) {
          console.error("Profile save error:", error);
          throw error;
        }
        
        console.log("Profile data saved successfully");
        toast.success("Profile setup complete!");
        
        // Wait a moment to show the success message before proceeding
        setTimeout(() => {
          onComplete();
        }, 500);
      } else if (process.env.REACT_APP_DEBUG_MODE) {
        // Debug mode, just proceed without saving
        console.log("Debug mode: Would save profile data:", formattedData);
        toast.success("Profile setup complete (Debug Mode)");
        
        // Add a small delay to simulate saving
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Failed to save profile data");
      // Continue to dashboard even if saving fails
      setTimeout(() => {
        onComplete();
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSubmit
  };
};
