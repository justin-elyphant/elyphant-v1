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

  // Whenever userIntent is missing and we reach step=verification, show modal. If userIntent changes (e.g., by other tabs), instantly close it.
  React.useEffect(() => {
    if (step !== "verification" || !userEmail) {
      setShowIntentModal(false);
      setIntentHandled(false);
      return;
    }
    const intent = localStorage.getItem("userIntent");
    if (!intent) {
      setShowIntentModal(true);
      setIntentHandled(false);
    } else {
      setShowIntentModal(false);
      setIntentHandled(true);
    }
  }, [step, userEmail]);

  // Defensive: block everything until modal is explicitly handled if modal is open
  if (showIntentModal && !intentHandled) {
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
