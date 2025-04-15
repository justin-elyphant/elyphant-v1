
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export const useProfileCompletion = (user: User | null) => {
  const navigate = useNavigate();

  const handleSetupComplete = useCallback(async () => {
    console.log("Profile setup complete, transitioning to appropriate destination");
    
    try {
      localStorage.removeItem("profileSetupLoading");
      const nextStepsOption = localStorage.getItem("nextStepsOption") || "dashboard";
      
      // Clear signup-related localStorage values
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      
      if (user) {
        try {
          await supabase.auth.refreshSession();
          console.log("Session refreshed successfully");
        } catch (refreshError) {
          console.error("Error refreshing session:", refreshError);
        }
      }
      
      toast.success("Welcome! Your profile is ready.");
      localStorage.setItem("profileCompleted", "true");
      
      // Determine destination and navigate
      let destinationUrl = "/dashboard";
      switch (nextStepsOption) {
        case "create_wishlist":
          destinationUrl = "/wishlists";
          break;
        case "find_friends":
          destinationUrl = "/connections";
          break;
        case "shop_gifts":
          destinationUrl = "/gifting";
          break;
        case "explore_marketplace":
          destinationUrl = "/marketplace";
          break;
      }
      
      navigate(destinationUrl, { replace: true });
      localStorage.removeItem("nextStepsOption");
      
    } catch (error) {
      console.error("Error during profile completion:", error);
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSkip = useCallback(() => {
    localStorage.removeItem("profileSetupLoading");
    localStorage.removeItem("newSignUp");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.setItem("profileCompleted", "true");
    
    toast.info("You can complete your profile later in settings");
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  const handleBackToDashboard = useCallback(() => {
    localStorage.removeItem("profileSetupLoading");
    localStorage.removeItem("newSignUp");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.setItem("profileCompleted", "true");
    
    navigate("/dashboard");
  }, [navigate]);

  return {
    handleSetupComplete,
    handleSkip,
    handleBackToDashboard
  };
};
