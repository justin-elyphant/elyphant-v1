
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
      console.log("Raw profile data:", profileData);
      
      if (!userId) {
        console.error("No user ID available");
        toast.error("Cannot save profile: No user ID available");
        setIsLoading(false);
        return;
      }
      
      // Format the complete profile data matching Supabase schema exactly
      const formattedData = {
        id: userId,
        name: userName,
        email: userEmail,
        username: profileData.username || userName.toLowerCase().replace(/\s+/g, '_'),
        bio: profileData.bio || `Hi, I'm ${userName}`,
        profile_image: profileData.profile_image,
        dob: profileData.dob || null, // Store as text (month + date only)
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

      // Ensure JSONB fields are properly formatted
      // Note: Supabase client automatically handles JSON serialization for jsonb columns,
      // so we don't need to manually stringify these objects

      // Update profile in Supabase
      const { data, error } = await supabase
        .from('profiles')
        .upsert(formattedData, {
          onConflict: 'id'
        });
        
      if (error) {
        console.error("Profile update failed:", error);
        throw error;
      }

      console.log("Profile saved successfully:", data);
      toast.success("Profile setup complete!");
      
      // Clear signup flags
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("profileSetupLoading");
      
      setIsLoading(false);
      onComplete();
      
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
