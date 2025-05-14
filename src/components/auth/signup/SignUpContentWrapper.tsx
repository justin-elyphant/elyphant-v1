
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
  const [intentHandled, setIntentHandled] = React.useState(false); // add this
  const navigate = useNavigate();

  // Show modal ONLY AFTER signup is successful (step === 'verification' and we have the user's email)
  React.useEffect(() => {
    // If we're still at the initial "signup" step, don't show the modal.
    if (step !== "verification" || !userEmail) {
      setShowIntentModal(false);
      setIntentHandled(false);
      return;
    }
    // Only show if userIntent is not yet set (hasn't proceeded past modal yet)
    const intentAlreadySelected = !!localStorage.getItem("userIntent");
    if (!intentAlreadySelected) {
      setShowIntentModal(true);
      setIntentHandled(false);
    } else {
      setShowIntentModal(false);
      setIntentHandled(true); // ensure we won't block rendering below
    }
  }, [step, userEmail]);

  // Only navigate on explicit user/manual modal action
  const handleSelectIntent = (userIntent: "giftor" | "giftee") => {
    localStorage.setItem("userIntent", userIntent);
    setShowIntentModal(false);
    setIntentHandled(true);

    // Branch immediately based on role
    if (userIntent === "giftor") {
      localStorage.setItem("onboardingComplete", "true");
      localStorage.removeItem("newSignUp");
      navigate("/marketplace", { replace: true });
    } else {
      // giftee
      navigate("/profile-setup", { replace: true });
    }
  };

  const handleSkip = () => {
    // Treat skip as giftee for now
    localStorage.setItem("userIntent", "skipped");
    setShowIntentModal(false);
    setIntentHandled(true);
    navigate("/profile-setup", { replace: true });
  };

  // INTENTIONAL: Block further UI (including verification view) until modal is dismissed
  if (showIntentModal && !intentHandled) {
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

  // Show verification screen (e.g., "Account Created!" or similar) after signup,
  // but only if onboarding has been completed or intent handled.
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
