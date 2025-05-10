
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useProfileCompletion = (user: User | null) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSetupComplete = async () => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // Mark profile as completed
      const { error } = await supabase
        .from("profiles")
        .update({ profile_completed: true })
        .eq("id", user.id);
        
      if (error) throw error;
      
      // Check if this is a new signup
      const isNewSignUp = localStorage.getItem("newSignUp") === "true";
      
      // Redirect based on user state
      if (isNewSignUp) {
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
        toast.success("Profile setup completed!");
      }
    } catch (error) {
      console.error("Error completing profile setup:", error);
      toast.error("Failed to complete profile setup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = () => {
    // Check if this is a new signup
    const isNewSignUp = localStorage.getItem("newSignUp") === "true";
    
    // Redirect based on user state
    if (isNewSignUp) {
      navigate("/onboarding");
    } else {
      navigate("/dashboard");
    }
  };
  
  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };
  
  return {
    handleSetupComplete,
    handleSkip,
    handleBackToDashboard,
    isSubmitting
  };
};
