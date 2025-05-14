import React from "react";
import { useNavigate } from "react-router-dom";
import { useSignUpProcess } from "@/hooks/auth";
import SignUpContentWrapper from "@/components/auth/signup/SignUpContentWrapper";
import Header from "@/components/home/Header";
import { useAuth } from "@/contexts/auth";

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
  "onboardingSkippedTime"
];

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Always clear onboarding keys for /signup, unless logged in
  React.useEffect(() => {
    if (!user) {
      CLEAR_ONBOARDING_KEYS.forEach((key) => localStorage.removeItem(key));
      // HACK: remove all onboarding-related state but keep localStorage functional
      // (removing all of localStorage could break 3rd party integrations)
      // localStorage.clear(); // Uncomment if you do want to clear everything
      console.log("[SignUp] Onboarding keys wiped!", { user });
    }
  }, [user]);

  // WARNING: Do NOT navigate to /profile-setup unless userIntent is present AND valid!
  React.useEffect(() => {
    const newSignUp = localStorage.getItem("newSignUp") === "true";
    const userIntent = localStorage.getItem("userIntent");
    // Only 'giftor' or 'giftee' should allow proceeding
    const validIntent = userIntent === "giftor" || userIntent === "giftee";
    console.log("[SignUp] Checking navigation after key wipe", { user, newSignUp, userIntent, validIntent });

    if (user && (!newSignUp || validIntent)) {
      console.log("[SignUp] Auto-navigating to /dashboard, not blocking onboarding modal.", { user, newSignUp, userIntent, validIntent });
      navigate("/dashboard", { replace: true });
    }
    // Else: explicitly do NOTHING, modal+onboarding will control all navigation.
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
    bypassVerification = true,
  } = useSignUpProcess();

  // Always set bypassVerification in localStorage for consistent experience
  React.useEffect(() => {
    localStorage.setItem("bypassVerification", "true");
    if (step === "verification") {
      localStorage.setItem("newSignUp", "true");
      // If in verification phase, enforce intent cleared to ensure modal shows
      const currentIntent = localStorage.getItem("userIntent");
      if (currentIntent !== "giftor" && currentIntent !== "giftee") {
        localStorage.removeItem("userIntent");
      }
      console.log("[SignUp] Set 'newSignUp' and sanitized userIntent at verification step");
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
