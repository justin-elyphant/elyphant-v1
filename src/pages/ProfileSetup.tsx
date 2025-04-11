
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
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [sessionChecked, setSessionChecked] = React.useState(false);
  
  // Check auth status on initial load with auto-retry
  React.useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const checkAuthStatus = async () => {
      // First check if we're still loading
      if (isLoading) {
        console.log("Auth state still loading, waiting...");
        return;
      }
      
      // If no user and debug mode is off, check one more time with fresh session
      if (!user && !isDebugMode) {
        console.log(`No user detected in ProfileSetup, checking session... (attempt ${retryCount + 1})`);
        
        try {
          // Try refreshing the session once before redirecting
          const { data } = await supabase.auth.getSession();
          
          if (!data.session) {
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`No authenticated session found, refreshing... (attempt ${retryCount + 1})`);
              setTimeout(checkAuthStatus, 1000); // Retry after 1 second
              return;
            }
            
            console.log("No authenticated user after multiple refresh attempts, redirecting to sign-in");
            toast.error("Authentication required", {
              description: "Please sign in to continue setting up your profile"
            });
            navigate("/sign-in");
          } else {
            console.log("Session found:", data.session.user.email);
            setSessionChecked(true);
          }
        } catch (error) {
          console.error("Error checking session:", error);
        }
      } else {
        console.log("User authenticated or debug mode enabled for profile setup");
        setSessionChecked(true);
      }
      
      setIsInitializing(false);
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
      }, 500);
    } catch (error) {
      console.error("Error during profile completion:", error);
      navigate("/dashboard");
    }
  };

  const handleSkip = () => {
    toast.info("You can complete your profile later in settings");
    navigate("/dashboard");
  };

  // Show a loading indicator if still initializing or auth state is loading
  if (isLoading || isInitializing) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <span className="text-lg font-medium">Setting up your profile...</span>
        <p className="text-gray-500 mt-2 text-center max-w-md">
          Just a moment while we prepare your profile information
        </p>
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
