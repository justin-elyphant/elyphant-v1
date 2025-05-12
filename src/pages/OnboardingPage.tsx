
import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { createConnection } from "@/hooks/signup/services/connectionService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import TourGuide, { TourStep } from "@/components/onboarding/TourGuide";
import { X } from "lucide-react";

const OnboardingPage = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [processingInvite, setProcessingInvite] = useState(false);
  const [showOnboardingReminder, setShowOnboardingReminder] = useState(false);
  const [showTour, setShowTour] = useState(false);
  
  // Check if onboarding has been completed
  const onboardingComplete = localStorage.getItem("onboardingComplete") === "true";
  const isNewSignUp = localStorage.getItem("newSignUp") === "true";
  
  // Process invitation parameters if present
  useEffect(() => {
    if (user && !processingInvite) {
      const params = new URLSearchParams(window.location.search);
      const invitedBy = params.get('invitedBy');
      const senderUserId = params.get('senderUserId');
      
      if (senderUserId && user?.id && invitedBy) {
        setProcessingInvite(true);
        
        const handleInvitation = async () => {
          try {
            await createConnection(senderUserId, user.id, invitedBy);
            toast.success(`Connected with ${invitedBy}!`);
            
            // Clear the invitation parameters from URL
            const newUrl = window.location.pathname;
            window.history.pushState({}, "", newUrl);
          } catch (error) {
            console.error("Error handling invitation:", error);
            toast.error("Could not connect with inviter");
          } finally {
            setProcessingInvite(false);
          }
        };
        
        handleInvitation();
      }
    }
  }, [user, processingInvite]);
  
  // Check if user has skipped onboarding before
  useEffect(() => {
    const hasSkippedBefore = localStorage.getItem("onboardingSkipped") === "true";
    const lastSkippedTime = localStorage.getItem("onboardingSkippedTime");
    
    if (hasSkippedBefore && !onboardingComplete && !isNewSignUp) {
      // Show reminder if it's been more than 24 hours since last skip
      if (lastSkippedTime) {
        const timeSinceSkip = Date.now() - parseInt(lastSkippedTime);
        const hoursSinceSkip = timeSinceSkip / (1000 * 60 * 60);
        
        if (hoursSinceSkip > 24) {
          setShowOnboardingReminder(true);
        }
      }
    }
  }, [onboardingComplete, isNewSignUp]);
  
  const handleSkipOnboarding = () => {
    localStorage.setItem("onboardingSkipped", "true");
    localStorage.setItem("onboardingSkippedTime", Date.now().toString());
    navigate("/dashboard");
  };
  
  const handleStartTour = () => {
    localStorage.setItem("onboardingComplete", "true");
    localStorage.removeItem("newSignUp");
    setShowTour(true);
  };
  
  // Feature tour steps
  const tourSteps: TourStep[] = [
    {
      id: "dashboard",
      title: "Your Dashboard",
      content: <p>Welcome to your dashboard! This is where you can find an overview of your wishlists, upcoming events, and more.</p>
    },
    {
      id: "wishlists",
      title: "Manage Wishlists",
      content: <p>Create and manage your wishlists here. Add items you'd love to receive as gifts.</p>
    },
    {
      id: "connections",
      title: "Connect with Friends",
      content: <p>Find and connect with friends to share your wishlists and discover what they want.</p>
    },
    {
      id: "complete",
      title: "You're All Set!",
      content: <p>You're now ready to use all features of the app. Enjoy your gifting experience!</p>
    }
  ];
  
  if (isLoading || processingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If onboarding already completed and user didn't just sign up, redirect to dashboard
  if (onboardingComplete && !isNewSignUp) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Show the reminder dialog if needed
  if (showOnboardingReminder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold">Complete Your Profile</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => navigate("/dashboard")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="my-4 text-muted-foreground">
            You haven't completed your onboarding yet. Taking a few moments to set up your profile will help you get the most out of the app.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate("/dashboard")}
            >
              Skip Again
            </Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowOnboardingReminder(false)}
            >
              Complete Now
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show the onboarding flow
  return (
    <>
      <OnboardingFlow onComplete={handleStartTour} onSkip={handleSkipOnboarding} />
      
      <TourGuide 
        steps={tourSteps}
        isOpen={showTour}
        onClose={() => {
          setShowTour(false);
          navigate("/dashboard");
        }}
        onComplete={() => {
          setShowTour(false);
          navigate("/dashboard");
        }}
      />
    </>
  );
};

export default OnboardingPage;
