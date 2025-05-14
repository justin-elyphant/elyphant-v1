import React from "react";
import SignUpView from "./views/SignUpView";
import VerificationView from "./views/VerificationView";
import { SignUpFormValues } from "./SignUpForm";
import OnboardingIntentModal from "./OnboardingIntentModal";
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

const SignUpContentWrapper: React.FC<SignUpContentWrapperProps> = ({
  step,
  userEmail,
  userName,
  onSignUpSubmit,
  handleBackToSignUp,
  isSubmitting = false,
  onResendVerification = () => Promise.resolve({ success: true }),
  resendCount = 0,
  bypassVerification = true, // Default to bypassing verification for better UX
}) => {
  const [showIntentModal, setShowIntentModal] = React.useState(false);
  const [intentHandled, setIntentHandled] = React.useState(false);
  const navigate = useNavigate();

  // Debug logs to help trace modal logic
  React.useEffect(() => {
    const intent = localStorage.getItem("userIntent");
    console.log("[SignUpContentWrapper] Effect: step/email/intent:", { step, userEmail, intent });
    if (step !== "verification" || !userEmail) {
      setShowIntentModal(false);
      setIntentHandled(false);
      return;
    }
    if (!intent) {
      setShowIntentModal(true);
      setIntentHandled(false);
    } else {
      setShowIntentModal(false);
      setIntentHandled(true);
    }
  }, [step, userEmail]);

  // Strict modal block: if modal is visible and unhandled, block everything
  if (showIntentModal && !intentHandled) {
    // Always double-check that userIntent is missing
    const handleSelectIntent = (userIntent: "giftor" | "giftee") => {
      localStorage.setItem("userIntent", userIntent);
      setShowIntentModal(false);
      setIntentHandled(true);

      if (userIntent === "giftor") {
        localStorage.setItem("onboardingComplete", "true");
        localStorage.removeItem("newSignUp");
        navigate("/marketplace", { replace: true });
      } else {
        navigate("/profile-setup", { replace: true });
      }
    };

    const handleSkip = () => {
      localStorage.setItem("userIntent", "skipped");
      setShowIntentModal(false);
      setIntentHandled(true);
      navigate("/profile-setup", { replace: true });
    };

    // Extra debug
    console.log("[SignUpContentWrapper] Modal is rendered, blocking UI.");

    return (
      <OnboardingIntentModal
        open={showIntentModal}
        onSelect={handleSelectIntent}
        onSkip={handleSkip}
      />
    );
  }

  // Show the signup form if we haven't submitted yet
  if (step === "signup") {
    return (
      <SignUpView 
        onSubmit={onSignUpSubmit} 
        isSubmitting={isSubmitting} 
      />
    );
  }

  // Only allow verification screen if modal was handled or onboarding complete
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
