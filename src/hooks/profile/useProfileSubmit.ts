
import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useProfileCreate } from "./useProfileCreate";
import { toast } from "sonner";
import { ProfileData } from "@/components/profile-setup/hooks/types";

interface UseProfileSubmitProps {
  onSuccess?: (data: any) => void;
  onComplete: () => void;
}

export const useProfileSubmit = ({ onSuccess, onComplete }: UseProfileSubmitProps) => {
  const { user } = useAuth();
  const { profile, refetchProfile } = useProfile();
  const { createProfile } = useProfileCreate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitProfile = async (profileData: ProfileData) => {
    if (!user) {
      const error = "You must be logged in to submit profile data";
      setSubmitError(error);
      throw new Error(error);
    }

    setIsSubmitting(true);
    setSubmitError(null);
    
    console.log("Submitting profile data:", JSON.stringify(profileData, null, 2));

    try {
      // Create or update the profile
      const result = await createProfile(profileData);
      
      if (result) {
        console.log("Profile submission successful, refreshing profile context");
        
        // Force refresh the profile context to get the latest data
        await refetchProfile();
        
        // Mark onboarding as complete and trigger data sync
        localStorage.setItem("onboardingComplete", "true");
        localStorage.removeItem("newSignUp");
        
        // Delay to ensure database write completes
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force profile refresh to sync data
        await refetchProfile();
        
        toast.success("Profile created successfully!");
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        return result;
      }
    } catch (error: any) {
      console.error("Profile submission failed:", error);
      setSubmitError(error.message || "Failed to submit profile");
      toast.error("Failed to save profile data");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitProfile,
    isSubmitting,
    submitError
  };
};
