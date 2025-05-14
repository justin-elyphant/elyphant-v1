
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

  // On mount: If user is NOT logged in, clear all onboarding-related state and localStorage for a fresh sign up experience, *especially userIntent*
  React.useEffect(() => {
    if (!user) {
      CLEAR_ONBOARDING_KEYS.forEach((key) => localStorage.removeItem(key));
    }
  }, [user]);

  // Only auto-navigate if NOT a new signup, to allow onboarding flow
  React.useEffect(() => {
    const newSignUp = localStorage.getItem("newSignUp") === "true";
    const hasIntent = !!localStorage.getItem("userIntent");
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

