
import { useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export const useProfileCompletion = (user: User | null) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSetupComplete = useCallback(async () => {
    if (!user) {
      console.error("No user found, please sign in.");
      toast.error("No user found, please sign in.");
      signOut();
      return;
    }

    // Clear any stale flags
    localStorage.removeItem("signupRateLimited");
    
    // Set loading flag to prevent duplicate submissions
    const profileSetupLoading = localStorage.getItem("profileSetupLoading") === "true";
    if (profileSetupLoading) {
      console.warn("Profile setup is already in progress, please wait.");
      toast.error("Profile setup is already in progress, please wait.");
      return;
    }

    localStorage.setItem("profileSetupLoading", "true");

    try {
      // Get next steps option if available
      const nextStepsOption = localStorage.getItem("nextStepsOption") || "dashboard";
      
      // Make sure we update or create the profile with proper data sharing settings
      const profileUpdate = {
        id: user.id,
        email: user.email,
        onboarding_completed: true,
        data_sharing_settings: {
          dob: "friends",
          shipping_address: "private",
          gift_preferences: "public",
          email: "private"
        }
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert([profileUpdate], { onConflict: 'id' });

      if (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile. Please try again.");
        localStorage.removeItem("profileSetupLoading");
        return;
      }

      console.log("Profile updated successfully:", data);
      
      // Clear all signup & setup related flags
      localStorage.removeItem("profileSetupLoading");
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      
      // Set completion flag
      localStorage.setItem("profileCompleted", "true");
      
      // Refresh auth session
      try {
        await supabase.auth.refreshSession();
        console.log("Session refreshed successfully");
      } catch (refreshError) {
        console.error("Error refreshing session:", refreshError);
      }

      // Show success message
      toast.success("Profile setup complete!");
      
      // Determine destination based on next steps option
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
      
      // Navigate to destination
      navigate(destinationUrl, { replace: true });
      localStorage.removeItem("nextStepsOption");

    } catch (error) {
      console.error("Error during profile setup:", error);
      toast.error("An unexpected error occurred. Please try again.");
      localStorage.removeItem("profileSetupLoading");
    }
  }, [user, navigate, signOut]);
  
  const handleSkip = useCallback(() => {
    // Clear flags
    localStorage.removeItem("profileSetupLoading");
    localStorage.removeItem("newSignUp");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.setItem("profileCompleted", "true");
    
    // Notify and navigate
    toast.info("You can complete your profile later in settings");
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  const handleBackToDashboard = useCallback(() => {
    // Clear flags
    localStorage.removeItem("profileSetupLoading");
    localStorage.removeItem("newSignUp");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    
    // Navigate to dashboard
    navigate('/dashboard');
  }, [navigate]);

  return {
    handleSetupComplete,
    handleSkip,
    handleBackToDashboard
  };
};
