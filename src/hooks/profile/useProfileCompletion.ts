
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useProfileCompletion = (user: User | null) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map next steps options to actual routes
  const getRouteFromNextStepsOption = (option: string | undefined): string => {
    switch (option) {
      case "explore_marketplace":
      case "shop_gifts":
        return "/marketplace";
      case "create_wishlist":
        return "/wishlists";
      case "find_friends":
        return "/connections";
      case "dashboard":
      default:
        return "/dashboard";
    }
  };

  const handleSetupComplete = async (nextStepsOption?: string) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // Mark profile as completed using the correct column name
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);
        
      if (error) throw error;
      
      // Check if this is a new signup
      const isNewSignUp = localStorage.getItem("newSignUp") === "true";
      
      // Determine the route based on next steps option
      const targetRoute = getRouteFromNextStepsOption(nextStepsOption);
      
      // Clear signup flags
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      
      // Redirect based on user state and their selection
      if (isNewSignUp) {
        // For new signups, check if they chose a specific option
        if (nextStepsOption && nextStepsOption !== "dashboard") {
          navigate(targetRoute);
          toast.success("Profile setup completed!");
        } else {
          navigate("/dashboard");
          toast.success("Profile setup completed!");
        }
      } else {
        navigate(targetRoute);
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
    
    // Clear signup flags
    localStorage.removeItem("newSignUp");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    
    // Redirect based on user state
    if (isNewSignUp) {
      navigate("/dashboard");
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
