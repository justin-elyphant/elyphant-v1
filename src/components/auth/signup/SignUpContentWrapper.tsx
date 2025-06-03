
import React from "react";
import SignUpView from "./views/SignUpView";
import VerificationView from "./views/VerificationView";
import { SignUpFormValues } from "./SignUpForm";
import NicoleOnboardingEngine from "@/components/onboarding/nicole/NicoleOnboardingEngine";
import { useNavigate } from "react-router-dom";

interface SignUpContentWrapperProps {
  step: "signup" | "verification";
  userEmail: string;
  userName: string;
  onSignUpSubmit: (values: SignUpFormValues) => Promise<void>;
  handleBackToSignUp: () => void;
  isSubmitting?: boolean;
  onResendVerification: () => Promise<{ success: boolean; rateLimited?: boolean }>;
  resendCount: number;
  bypassVerification?: boolean;
}

// Helper to check valid intent
const validIntent = (intent: string | null) => intent === "giftor" || intent === "giftee";

const SignUpContentWrapper: React.FC<SignUpContentWrapperProps> = ({
  step,
  userEmail,
  userName,
  onSignUpSubmit,
  handleBackToSignUp,
  isSubmitting = false,
  onResendVerification = () => Promise.resolve({ success: true }),
  resendCount = 0,
  bypassVerification = true
}) => {
  const [showNicoleOnboarding, setShowNicoleOnboarding] = React.useState(false);
  const [intentHandled, setIntentHandled] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (step !== "verification" || !userEmail) {
      if (showNicoleOnboarding) setShowNicoleOnboarding(false);
      if (intentHandled) setIntentHandled(false);
      return;
    }

    const intent = localStorage.getItem("userIntent");
    // Always show Nicole onboarding if no valid intent is found
    if (!validIntent(intent)) {
      localStorage.setItem("showingIntentModal", "true");
      setShowNicoleOnboarding(true);
      setIntentHandled(false);
    } else {
      setShowNicoleOnboarding(false);
      setIntentHandled(true);
    }
  }, [step, userEmail, intentHandled, showNicoleOnboarding]);

  // -- EARLY BLOCKER: If we should show Nicole onboarding, render ONLY the onboarding --
  if (
    step === "verification" &&
    userEmail &&
    !validIntent(localStorage.getItem("userIntent"))
  ) {
    const handleOnboardingComplete = () => {
      localStorage.removeItem("showingIntentModal");
      setShowNicoleOnboarding(false);
      setIntentHandled(true);

      // Navigate based on user intent (which Nicole will have set)
      const finalIntent = localStorage.getItem("userIntent");
      if (finalIntent === "giftor") {
        navigate("/onboarding-gift", { replace: true });
      } else {
        navigate("/profile-setup", { replace: true });
      }
    };

    const handleOnboardingClose = () => {
      // Fallback if user somehow closes without completing
      localStorage.setItem("userIntent", "explorer");
      handleOnboardingComplete();
    };

    return (
      <NicoleOnboardingEngine
        isOpen={true}
        onComplete={handleOnboardingComplete}
        onClose={handleOnboardingClose}
      />
    );
  }

  if (step === "signup") {
    return (
      <SignUpView 
        onSubmit={onSignUpSubmit} 
        isSubmitting={isSubmitting} 
      />
    );
  }

  return (
    <VerificationView
      userEmail={userEmail}
      userName={userName}
      onBackToSignUp={handleBackToSignUp}
      onResendVerification={onResendVerification}
      resendCount={resendCount}
      bypassVerification={bypassVerification}
    />
  );
};

export default SignUpContentWrapper;
