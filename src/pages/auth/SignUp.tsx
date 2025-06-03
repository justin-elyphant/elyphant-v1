
import React from "react";
import { useNavigate } from "react-router-dom";
import { useSignUpProcess } from "@/hooks/auth";
import SignUpContentWrapper from "@/components/auth/signup/SignUpContentWrapper";
import Header from "@/components/home/Header";
import { useAuth } from "@/contexts/auth";
import Footer from "@/components/home/Footer";

// List of all onboarding keys to clear
const CLEAR_ONBOARDING_KEYS = [
  "userIntent",
  "onboardingComplete",
  "newSignUp",
  "userEmail",
  "userName",
  "profileSetupLoading",
  "signupRateLimited",
  "bypassVerification",
  "onboardingSkipped",
  "onboardingSkippedTime",
  "pendingVerificationEmail",
  "pendingVerificationName",
  "verificationResendCount",
  "signupStep",
  "showingIntentModal",
];

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Clear onboarding keys for /signup, unless logged in
  React.useEffect(() => {
    if (!user) {
      CLEAR_ONBOARDING_KEYS.forEach((key) => localStorage.removeItem(key));
      console.log("[SignUp] Onboarding keys wiped and signup state force-reset!", { user });
    }
    setIsInitialized(true);
  }, [user]);

  // Handle navigation for logged in users
  React.useEffect(() => {
    if (!isInitialized) return;
    
    const newSignUp = localStorage.getItem("newSignUp") === "true";
    const userIntent = localStorage.getItem("userIntent");
    const validIntent = userIntent === "giftor" || userIntent === "giftee";
    const showingModal = localStorage.getItem("showingIntentModal") === "true";
    
    console.log("[SignUp] Navigation check", { 
      user: !!user, 
      newSignUp, 
      userIntent, 
      validIntent, 
      showingModal 
    });

    // Only navigate away if user exists and not in onboarding flow
    if (user && !newSignUp && !showingModal) {
      console.log("[SignUp] Auto-navigating to /dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate, isInitialized]);

  const {
    step,
    userEmail,
    userName,
    onSignUpSubmit,
    handleBackToSignUp,
    isSubmitting,
    handleResendVerification,
    resendCount,
    bypassVerification = true,
  } = useSignUpProcess();

  // Set bypassVerification in localStorage for consistent experience
  React.useEffect(() => {
    localStorage.setItem("bypassVerification", "true");
    if (step === "verification") {
      localStorage.setItem("newSignUp", "true");
      
      // Clear any invalid intent to ensure modal shows
      const currentIntent = localStorage.getItem("userIntent");
      if (currentIntent !== "giftor" && currentIntent !== "giftee") {
        localStorage.removeItem("userIntent");
      }
      console.log("[SignUp] Set 'newSignUp' and sanitized userIntent at verification step");
    }
    
    // If returning to signup step, clear newSignUp flag
    if (step === "signup") {
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("showingIntentModal");
    }
  }, [step]);

  // Show loading until initialized
  if (!isInitialized) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <SignUpContentWrapper
          step={step as "signup" | "verification"}
          userEmail={userEmail}
          userName={userName}
          onSignUpSubmit={onSignUpSubmit}
          handleBackToSignUp={handleBackToSignUp}
          isSubmitting={isSubmitting}
          onResendVerification={handleResendVerification}
          resendCount={resendCount}
          bypassVerification={bypassVerification}
        />
      </div>
      <Footer />
    </div>
  );
};

export default SignUp;
