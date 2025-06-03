
import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileSetupFlow from "@/components/profile-setup/ProfileSetupFlow";
import Logo from "@/components/home/components/Logo";
import LoadingState from "./profile-setup/LoadingState";
import { useProfileSetupState } from "./profile-setup/hooks/useProfileSetupState";
import { useProfileCompletion } from "@/hooks/profile/useProfileCompletion";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";

const ProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    isInitializing,
    isNewSignUp,
    isManuallyLoading,
    authLoading
  } = useProfileSetupState();
  
  const {
    handleSetupComplete,
    handleSkip,
    handleBackToDashboard
  } = useProfileCompletion(user);

  const showingIntentModal = localStorage.getItem("showingIntentModal") === "true";
  
  // Redirect to signup if no user and not in onboarding flow
  React.useEffect(() => {
    const isNewSignUp = localStorage.getItem("newSignUp") === "true";
    const onboardingComplete = localStorage.getItem("onboardingComplete") === "true";
    
    if (!user && !authLoading && !isNewSignUp && !onboardingComplete) {
      console.log("No user found and not in signup flow, redirecting to signup");
      navigate("/signup", { replace: true });
    }
  }, [user, authLoading, navigate]);
  
  if (showingIntentModal || authLoading || isManuallyLoading || isInitializing) {
    return <LoadingState message="Preparing your profile setup..." />;
  }

  // Show loading if we don't have a user yet but we're in a valid signup flow
  if (!user && (isNewSignUp || localStorage.getItem("onboardingComplete") === "true")) {
    return <LoadingState message="Setting up your account..." />;
  }

  if (isNewSignUp && !isInitializing) {
    return (
      <MainLayout>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <ProfileSetupFlow 
              onComplete={handleSetupComplete} 
              onSkip={handleSkip} 
            />
          </div>
        </main>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="flex-1 flex flex-col p-4">
        <div className="container mx-auto flex items-center mb-8">
          <Logo />
          {user && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBackToDashboard}
              className="ml-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <ProfileSetupFlow 
              onComplete={handleSetupComplete} 
              onSkip={handleSkip} 
            />
          </div>
        </div>
      </main>
    </MainLayout>
  );
};

export default ProfileSetup;
