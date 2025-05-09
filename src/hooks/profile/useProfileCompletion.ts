
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatProfileForSubmission } from "@/utils/dataFormatUtils";
import { handleProfileError } from "@/utils/profileErrorUtils";
import { User } from "@supabase/supabase-js";

export const useProfileCompletion = (user: User | null) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle when profile setup is completed
  const handleSetupComplete = useCallback(async (profileData?: any) => {
    if (!user) {
      toast.error("You must be logged in to complete profile setup");
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (profileData) {
        // Format profile data for submission
        const formattedData = formatProfileForSubmission({
          ...profileData,
          id: user.id,
          onboarding_completed: true
        });
        
        // Submit to Supabase
        const { error } = await supabase
          .from('profiles')
          .upsert(formattedData, {
            onConflict: 'id'
          });
          
        if (error) throw error;
        
        toast.success("Profile setup complete!");
        
        // Clear any related local storage flags
        localStorage.removeItem("newSignUp");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        localStorage.removeItem("profileSetupLoading");
      } else {
        // If no profile data, just mark onboarding as complete
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
          
        if (error) throw error;
      }
      
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      handleProfileError(error, "Failed to complete profile setup");
    } finally {
      setIsSubmitting(false);
    }
  }, [user, navigate]);

  // Handle when user skips profile setup
  const handleSkip = useCallback(() => {
    navigate("/dashboard");
    toast.info("You can complete your profile later in settings");
  }, [navigate]);

  // Handle back to dashboard
  const handleBackToDashboard = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  return {
    handleSetupComplete,
    handleSkip,
    handleBackToDashboard,
    isSubmitting
  };
};
