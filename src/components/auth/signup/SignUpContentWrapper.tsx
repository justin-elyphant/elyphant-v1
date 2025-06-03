
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
  const navigate = useNavigate();

  // Memoize the intent check to prevent unnecessary re-renders
  const shouldShowNicole = React.useMemo(() => {
    if (step !== "verification" || !userEmail) return false;
    
    const intent = localStorage.getItem("userIntent");
    const showingModal = localStorage.getItem("showingIntentModal");
    
    console.log("Intent check:", { intent, showingModal, step, userEmail });
    
    return !validIntent(intent) && showingModal !== "false";
  }, [step, userEmail]);

  // Initialize Nicole onboarding state
  React.useEffect(() => {
    console.log("SignUpContentWrapper effect:", { step, userEmail, shouldShowNicole });
    
    if (shouldShowNicole) {
      localStorage.setItem("showingIntentModal", "true");
      setShowNicoleOnboarding(true);
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
    
    if (finalIntent === "giftor") {
      navigate("/onboarding-gift", { replace: true });
    } else {
      navigate("/profile-setup", { replace: true });
    }
  }, [navigate]);

  // Handle Nicole onboarding close
  const handleOnboardingClose = React.useCallback(() => {
    console.log("Nicole onboarding closed");
    // Fallback if user somehow closes without completing
    localStorage.setItem("userIntent", "explorer");
    localStorage.setItem("showingIntentModal", "false");
    handleOnboardingComplete();
  }, [handleOnboardingComplete]);

  // Show Nicole onboarding if needed
  if (showNicoleOnboarding) {
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
