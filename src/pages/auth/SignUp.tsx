
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
  // ALSO: Fully reset any stuck sign up state (step/userEmail) for a cold visit
  React.useEffect(() => {
    if (!user) {
      CLEAR_ONBOARDING_KEYS.forEach((key) => localStorage.removeItem(key));
      // This ensures NO persisted email/name/step carryover from a prior session.

      // Extra fix: wipe any in-memory stuck state if starting at signup with no "newSignUp" present
      // (patches issues from prior state leaks in hooks)
      if (!localStorage.getItem("newSignUp")) {
        localStorage.setItem("signupStep", "signup");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
      }
      console.log("[SignUp] Onboarding keys wiped and signup state force-reset!", { user });
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
    // If returning to signup step, clear newSignUp flag so cold reload starts over!
    if (step === "signup") {
      localStorage.removeItem("newSignUp");
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
