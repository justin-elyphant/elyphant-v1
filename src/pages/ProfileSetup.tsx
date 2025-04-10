
import React, { useState, useEffect } from "react";
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
  const { user, isDebugMode, isLoading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isNewSignUp, setIsNewSignUp] = useState(false);
  
  // Check for new signup flag on initial load
  useEffect(() => {
    const newSignUpFlag = localStorage.getItem("newSignUp") === "true";
    setIsNewSignUp(newSignUpFlag);
    
    // If we're on profile setup, clear the flag since we've made it here
    if (newSignUpFlag) {
      console.log("On profile setup page, new signup flow confirmed");
    } else {
      console.log("On profile setup page, standard flow");
    }
    
    // Always allow access to profile setup regardless of auth state
    // This is important for the flow right after signup
    setIsInitializing(false);
  }, []);

  // Handle completion of profile setup
  const handleSetupComplete = async () => {
    console.log("Profile setup complete");
    toast.success("Profile setup complete!");
    
    try {
      // Clear the new signup flag since we're done with the flow
      localStorage.removeItem("newSignUp");
      
      // Refresh the profile data from Supabase
      if (user) {
        console.log("Refreshing user session after profile setup");
        await supabase.auth.refreshSession();
      }
      
      // Navigate to dashboard
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Error during profile completion:", error);
      navigate("/dashboard", { replace: true });
    }
  };

  const handleSkip = () => {
    // Clear the new signup flag
    localStorage.removeItem("newSignUp");
    
    toast.info("You can complete your profile later in settings");
    navigate("/dashboard", { replace: true });
  };

  // Show a loading indicator if still initializing or auth state is loading
  if (isLoading && !isNewSignUp && !isDebugMode) {
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
            <Button asChild variant="ghost" size="sm">
              <span onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <ProfileSetupFlow onComplete={handleSetupComplete} onSkip={handleSkip} />
        </div>
      </main>
    </div>
  );
};

export default ProfileSetup;
