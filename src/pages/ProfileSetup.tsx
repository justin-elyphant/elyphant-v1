
import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileSetupFlow from "@/components/profile-setup/ProfileSetupFlow";
import Logo from "@/components/home/components/Logo";
import { useAuth } from "@/contexts/auth";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user, isDebugMode } = useAuth();
  
  // Redirect logged out users
  React.useEffect(() => {
    if (!user && !isDebugMode) {
      console.log("User not authenticated for profile setup, redirecting to sign-in");
      toast.error("You must be logged in to set up your profile");
      navigate("/sign-in");
    } else {
      console.log("User authenticated or debug mode enabled for profile setup");
    }
  }, [user, navigate, isDebugMode]);

  const handleSetupComplete = () => {
    console.log("Profile setup complete, navigating to dashboard");
    toast.success("Profile setup complete!");
    
    // Ensure we reload the user profile before navigating
    setTimeout(() => {
      navigate("/dashboard");
    }, 500);
  };

  const handleSkip = () => {
    toast.info("You can complete your profile later in settings");
    navigate("/dashboard");
  };

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
