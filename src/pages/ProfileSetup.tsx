
import React from "react";
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
  
  // Redirect logged out users
  React.useEffect(() => {
    const checkAuthStatus = async () => {
      // First check if we're still loading
      if (isLoading) {
        console.log("Auth state still loading, waiting...");
        return;
      }
      
      // If no user and debug mode is off, check one more time with fresh session
      if (!user && !isDebugMode) {
        console.log("No user detected, checking session again before redirecting...");
        
        // Try refreshing the session once before redirecting
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          console.log("Still no authenticated user after refresh, redirecting to sign-in");
          toast.error("You must be logged in to set up your profile");
          navigate("/sign-in");
        } else {
          console.log("Session found after refresh, allowing profile setup");
        }
      } else {
        console.log("User authenticated or debug mode enabled for profile setup");
      }
    };
    
    checkAuthStatus();
  }, [user, navigate, isDebugMode, isLoading]);

  const handleSetupComplete = async () => {
    console.log("Profile setup complete");
    toast.success("Profile setup complete!");
    
    try {
      // Refresh the profile data from Supabase
      if (user) {
        console.log("Refreshing user session after profile setup");
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.error("Error refreshing session:", error);
        } else {
          console.log("Session refreshed successfully:", data);
        }
      }
      
      // Navigate to dashboard after a brief delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error during profile completion:", error);
      navigate("/dashboard");
    }
  };

  const handleSkip = () => {
    toast.info("You can complete your profile later in settings");
    navigate("/dashboard");
  };

  // Show a loading indicator if auth state is still loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3">Loading your profile information...</span>
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
