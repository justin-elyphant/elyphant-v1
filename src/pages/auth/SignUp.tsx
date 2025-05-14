
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

  // Always clear onboarding keys for /signup, unless logged in
  React.useEffect(() => {
    if (!user) {
      CLEAR_ONBOARDING_KEYS.forEach((key) => localStorage.removeItem(key));
      localStorage.clear();
      console.log("[SignUp] Onboarding keys wiped!", { user });
    }
  }, [user]);

  // WARNING: Do NOT navigate to /profile-setup unless userIntent is present!
  React.useEffect(() => {
    const newSignUp = localStorage.getItem("newSignUp") === "true";
    const userIntent = localStorage.getItem("userIntent");
    console.log("[SignUp] Checking navigation after key wipe", { user, newSignUp, userIntent });

    // Only navigate away if intent is set (block otherwise, let modal run)
    if (user && (!newSignUp || !!userIntent)) {
      console.log("[SignUp] Auto-navigating to /dashboard, not blocking onboarding modal.", { user, newSignUp, userIntent });
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

  // Always set bypassVerification in localStorage
  React.useEffect(() => {
    localStorage.setItem("bypassVerification", "true");
    // Only set newSignUp at VERIFICATION (never anywhere else!)
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
