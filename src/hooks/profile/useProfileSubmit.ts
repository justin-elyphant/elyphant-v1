
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateAndCleanProfileData } from "@/utils/dataFormatUtils";
import { useProfileValidation } from "./useProfileValidation";
import { useAuth } from "@/contexts/auth";

interface UseProfileSubmitOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export function useProfileSubmit(options: UseProfileSubmitOptions = {}) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);
  const { validateProfileData } = useProfileValidation();
  
  const submitProfile = useCallback(async (profileData: any) => {
    if (!user) {
      const error = new Error("You must be logged in to update your profile");
      toast.error(error.message);
      setSubmitError(error);
      if (options.onError) options.onError(error);
      return false;
    }
    
    // First, validate the data structure
    if (!validateProfileData(profileData)) {
      console.error("Profile data validation failed");
      return false;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Format the data for submission
      const [isValid, cleanedData] = validateAndCleanProfileData(profileData);
      
      if (!isValid || !cleanedData) {
        throw new Error("Failed to prepare profile data for submission");
      }
      
      // Ensure we have the user ID
      cleanedData.id = user.id;
      
      // Try up to 3 times to submit in case of network issues
      let attempts = 0;
      let success = false;
      let result = null;
      
      while (attempts < 3 && !success) {
        attempts++;
        console.log(`Profile submission attempt ${attempts}`);
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .upsert(cleanedData, {
              onConflict: 'id'
            })
            .select();
            
          if (error) {
            console.error(`Error in submission attempt ${attempts}:`, error);
            if (attempts === 3) throw error;
          } else {
            success = true;
            result = data;
            console.log("Profile submission successful:", data);
          }
        } catch (err) {
          if (attempts === 3) throw err;
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (success) {
        toast.success("Profile updated successfully");
        if (options.onSuccess) options.onSuccess(result);
        return true;
      } else {
        throw new Error("Profile submission failed after multiple attempts");
      }
    } catch (error: any) {
      console.error("Profile submission error:", error);
      setSubmitError(error);
      toast.error("Failed to update profile", { 
        description: error.message || "An unexpected error occurred"
      });
      if (options.onError) options.onError(error);
      return false;
    } finally {
      setIsSubmitting(false);
      if (options.onComplete) options.onComplete();
    }
  }, [user, validateProfileData, options]);
  
  return {
    submitProfile,
    isSubmitting,
    submitError
  };
}
