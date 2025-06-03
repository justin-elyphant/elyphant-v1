
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
  const [isReadyForModal, setIsReadyForModal] = React.useState(false);
  const navigate = useNavigate();

  // Stable intent check with proper debouncing
  const shouldShowNicole = React.useMemo(() => {
    if (step !== "verification" || !userEmail || !isReadyForModal) return false;
    
    const intent = localStorage.getItem("userIntent");
    const showingModal = localStorage.getItem("showingIntentModal");
    
    console.log("Intent check:", { intent, showingModal, step, userEmail, isReadyForModal });
    
    return !validIntent(intent) && showingModal !== "false";
  }, [step, userEmail, isReadyForModal]);

  // Delayed initialization to prevent race conditions
  React.useEffect(() => {
    if (step === "verification" && userEmail) {
      const readyTimer = setTimeout(() => {
        setIsReadyForModal(true);
      }, 500); // Wait for auth state to stabilize

      return () => clearTimeout(readyTimer);
    } else {
      setIsReadyForModal(false);
    }
  }, [step, userEmail]);

  // Initialize Nicole onboarding state with proper timing
  React.useEffect(() => {
    console.log("SignUpContentWrapper effect:", { step, userEmail, shouldShowNicole, isReadyForModal });
    
    if (shouldShowNicole) {
      const showTimer = setTimeout(() => {
        localStorage.setItem("showingIntentModal", "true");
        setShowNicoleOnboarding(true);
      }, 200); // Small delay to ensure stable state

      return () => clearTimeout(showTimer);
    } else {
      setShowNicoleOnboarding(false);
    }
  }, [shouldShowNicole]);

  // Handle Nicole onboarding completion
  const handleOnboardingComplete = React.useCallback(() => {
    console.log("Nicole onboarding completed");
    localStorage.removeItem("showingIntentModal");
    setShowNicoleOnboarding(false);

    // Navigate based on user intent (which Nicole will have set)
    const finalIntent = localStorage.getItem("userIntent");
    console.log("Final intent:", finalIntent);
    
    const navigationTimer = setTimeout(() => {
      if (finalIntent === "giftor") {
        navigate("/onboarding-gift", { replace: true });
      } else {
        navigate("/profile-setup", { replace: true });
      }
    }, 100); // Small delay for smooth transition

    return () => clearTimeout(navigationTimer);
  }, [navigate]);

  // Handle Nicole onboarding close
  const handleOnboardingClose = React.useCallback(() => {
    console.log("Nicole onboarding closed");
    localStorage.setItem("userIntent", "explorer");
    localStorage.setItem("showingIntentModal", "false");
    handleOnboardingComplete();
  }, [handleOnboardingComplete]);

  // Show Nicole onboarding if needed
  if (showNicoleOnboarding && isReadyForModal) {
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
