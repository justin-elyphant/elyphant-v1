
import React from "react";
import { useNavigate } from "react-router-dom";
import { useSignUpProcess } from "@/hooks/auth";
import SignUpContentWrapper from "@/components/auth/signup/SignUpContentWrapper";
import Header from "@/components/home/Header";
import { useAuth } from "@/contexts/auth";

const CLEAR_ONBOARDING_KEYS = [
  "userId",
  "userEmail",
  "userName",
  "newSignUp",
  "userIntent",
  "onboardingComplete",
  "onboardingSkipped",
  "onboardingSkippedTime",
  "bypassVerification",
  "profileSetupLoading",
  "emailVerified",
  "verifiedEmail",
  "pendingVerificationEmail",
  "pendingVerificationName",
  "verificationResendCount"
];

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // On mount: Forcibly clear all onboarding-related state and localStorage (including userIntent) for EVERY visit to /signup unless user is truly logged in. 
  React.useEffect(() => {
    // Always do this FIRST for new sessions or logouts.
    if (!user) {
      CLEAR_ONBOARDING_KEYS.forEach((key) => localStorage.removeItem(key));
      // Add extra wipe for good measure (debugging help)
      localStorage.clear(); // CAUTION: this removes everything—it's safe ONLY on this page!
    }
    console.log("[SignUp] Onboarding keys wiped!", { user });
  }, [user]);

  // After wiping keys, handle navigation
  React.useEffect(() => {
    // Evaluate after keys have been removed
    const newSignUp = localStorage.getItem("newSignUp") === "true";
    const hasIntent = !!localStorage.getItem("userIntent");
    console.log("[SignUp] Checking navigation conditions", { user, newSignUp, hasIntent });

    // Only auto-navigate if NOT a new signup, to allow onboarding flow
    if (user && (!newSignUp || hasIntent)) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const {
    step,
    userEmail,
    userName,
    onSignUpSubmit,
    handleBackToSignUp,
    isSubmitting,
    handleResendVerification,
    resendCount,
    bypassVerification = true, // Always enable hybrid verification for better UX
  } = useSignUpProcess();

  // Store verification bypass preference in localStorage for consistent experience across sessions
  React.useEffect(() => {
    localStorage.setItem("bypassVerification", "true");
    // If at verification, set newSignUp
    if (step === "verification") {
      localStorage.setItem("newSignUp", "true");
    }
    console.log("[SignUp] Step changed", { step });
  }, [step]);

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
    </div>
  );
};

export default SignUp;

