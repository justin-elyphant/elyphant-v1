
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
  const [isManuallyLoading, setIsManuallyLoading] = useState(false);
  
  // Clear any stale loading flags on mount and check for new signup
  useEffect(() => {
    // Clear any stale loading flags
    localStorage.removeItem("profileSetupLoading");
    
    // Timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setIsManuallyLoading(false);
      setIsInitializing(false);
    }, 3000); // Max 3 seconds before forcing render
    
    console.log("ProfileSetup: Component mounted with auth state", { 
      user: !!user, 
      authLoading,
      localStorage: {
        newSignUp: localStorage.getItem("newSignUp"),
        userEmail: localStorage.getItem("userEmail"),
        userName: localStorage.getItem("userName")
      }
    });
    
    const newSignUpFlag = localStorage.getItem("newSignUp") === "true";
    
    setIsNewSignUp(newSignUpFlag);
    
    // If we have newSignUp flag, initialize right away
    if (newSignUpFlag) {
      console.log("New signup detected, initializing immediately");
      setIsInitializing(false);
      clearTimeout(loadingTimeout);
    }
    
    return () => clearTimeout(loadingTimeout);
  }, [user, authLoading]);

  const handleSetupComplete = useCallback(async () => {
    console.log("Profile setup complete, transitioning to appropriate destination");
    setIsManuallyLoading(true);
    
    try {
      // Clear any loading flags
      localStorage.removeItem("profileSetupLoading");
      
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
      
      // Set a flag to prevent this page from reloading
      localStorage.setItem("profileCompleted", "true");
      
      // Navigate based on the selected option - with retry mechanism
      const navigateWithRetry = (destination: string, retries = 3) => {
        try {
          // Force navigation to handle potential issues with React Router
          if (retries === 0) {
            console.log("Falling back to direct location change");
            window.location.href = destination;
            return;
          }
          
          navigate(destination, { replace: true });
          console.log("Navigation successful to:", destination);
          
          // Double check with timeout as fallback
          setTimeout(() => {
            if (window.location.pathname !== destination) {
              console.log("Navigation may have failed, retrying...");
              navigateWithRetry(destination, retries - 1);
            }
          }, 300);
        } catch (navError) {
          console.error("Navigation error:", navError);
          if (retries > 0) {
            setTimeout(() => navigateWithRetry(destination, retries - 1), 300);
          } else {
            window.location.href = destination;
          }
        }
      };
      
      // Determine the destination URL based on selected option
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
        case "dashboard":
        default:
          destinationUrl = "/dashboard";
          break;
      }
      
      console.log("Navigating to:", destinationUrl);
      navigateWithRetry(destinationUrl);
      
      // Clear the nextStepsOption from localStorage after navigating
      localStorage.removeItem("nextStepsOption");
      
    } catch (error) {
      console.error("Error during profile completion:", error);
      // Fallback to dashboard on error
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSkip = useCallback(() => {
    // Clear any loading flags
    localStorage.removeItem("profileSetupLoading");
    localStorage.removeItem("newSignUp");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    
    // Set profile as completed
    localStorage.setItem("profileCompleted", "true");
    
    toast.info("You can complete your profile later in settings");
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  const handleBackToDashboard = useCallback(() => {
    // Clear any loading flags
    localStorage.removeItem("profileSetupLoading");
    localStorage.removeItem("newSignUp");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    
    // Set profile as completed
    localStorage.setItem("profileCompleted", "true");
    
    navigate("/dashboard");
  }, [navigate]);

  // CRITICAL FIX: Special rendering for new signups
  if (isNewSignUp && !isInitializing) {
    console.log("Rendering profile setup for new signup");
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="w-full bg-white shadow-sm py-4">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center">
              <Logo />
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
  }

  // Normal loading state
  if (authLoading || isManuallyLoading || isInitializing) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <span className="text-lg font-medium">Setting up your profile...</span>
      </div>
    );
  }

  // Standard render for existing users
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-white shadow-sm py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Logo />
            {user && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleBackToDashboard}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            )}
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
