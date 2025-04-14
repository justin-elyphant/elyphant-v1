
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileSetupFlow from "@/components/profile-setup/ProfileSetupFlow";
import Logo from "@/components/home/components/Logo";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user, isDebugMode, isLoading: authLoading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isNewSignUp, setIsNewSignUp] = useState(false);
  
  useEffect(() => {
    console.log("ProfileSetup: Component mounted");
    console.log("ProfileSetup: Current auth state", { 
      user, 
      isDebugMode, 
      authLoading 
    });
    
    const newSignUpFlag = localStorage.getItem("newSignUp") === "true";
    const userEmail = localStorage.getItem("userEmail");
    
    console.log("ProfileSetup: Signup flags", { 
      newSignUpFlag, 
      userEmail 
    });
    
    setIsNewSignUp(newSignUpFlag);
    setIsInitializing(false);
  }, [user, authLoading]);

  const handleSetupComplete = useCallback(async () => {
    console.log("Profile setup complete, transitioning to appropriate destination");
    
    try {
      // Get the next steps option from localStorage
      const nextStepsOption = localStorage.getItem("nextStepsOption") || "dashboard";
      console.log("Next steps option selected:", nextStepsOption);
      
      // Clear signup-related localStorage values
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      
      if (user) {
        console.log("Refreshing user session after profile setup");
        try {
          await supabase.auth.refreshSession();
          console.log("Session refreshed successfully");
        } catch (refreshError) {
          console.error("Error refreshing session:", refreshError);
        }
      }
      
      toast.success("Welcome! Your profile is ready.");
      
      // Navigate based on the selected option
      switch (nextStepsOption) {
        case "create_wishlist":
          navigate("/wishlists", { replace: true });
          break;
        case "find_friends":
          navigate("/connections", { replace: true });
          break;
        case "shop_gifts":
          navigate("/gifting", { replace: true });
          break;
        case "explore_marketplace":
          navigate("/marketplace", { replace: true });
          break;
        case "dashboard":
        default:
          navigate("/dashboard", { replace: true });
          break;
      }
      
      // Clear the nextStepsOption from localStorage after navigating
      localStorage.removeItem("nextStepsOption");
      
    } catch (error) {
      console.error("Error during profile completion:", error);
      // Fallback to dashboard on error
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSkip = useCallback(() => {
    localStorage.removeItem("newSignUp");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    
    toast.info("You can complete your profile later in settings");
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  const handleBackToDashboard = useCallback(() => {
    localStorage.removeItem("newSignUp");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    navigate("/dashboard");
  }, [navigate]);

  if (authLoading && !isNewSignUp && !isDebugMode) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <span className="text-lg font-medium">Setting up your profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-white shadow-sm py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Logo />
            <Button 
              asChild 
              variant="ghost" 
              size="sm"
              onClick={handleBackToDashboard}
            >
              <span>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <ProfileSetupFlow 
            onComplete={handleSetupComplete} 
            onSkip={handleSkip} 
          />
        </div>
      </main>
    </div>
  );
};

export default ProfileSetup;
