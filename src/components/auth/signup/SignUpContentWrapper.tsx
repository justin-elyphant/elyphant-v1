
import React from "react";
import SignUpView from "./views/SignUpView";
import VerificationView from "./views/VerificationView";
import { SignUpFormValues } from "./SignUpForm";
import OnboardingIntentModal from "./OnboardingIntentModal";

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
  // This modal should show after registration and verification for new users,
  // but not show up again in their subsequent sessions.
  const [showIntentModal, setShowIntentModal] = React.useState(false);

  React.useEffect(() => {
    // Only fire on verification step (user successfully signed up)
    // Don't show if userIntent already selected
    if (
      step === "verification" &&
      localStorage.getItem("newSignUp") === "true" &&
      !localStorage.getItem("userIntent")
    ) {
      setShowIntentModal(true);
    }
  }, [step]);

  const handleSelectIntent = (userIntent: "giftor" | "giftee") => {
    // Save chosen intent
    localStorage.setItem("userIntent", userIntent);
    setShowIntentModal(false);
    // No navigation/branching here; follow-up flows will use this value
  };

  const handleSkip = () => {
    localStorage.setItem("userIntent", "skipped");
    setShowIntentModal(false);
  };

  if (step === "signup") {
    return (
      <SignUpView 
        onSubmit={onSignUpSubmit} 
        isSubmitting={isSubmitting} 
      />
    );
  }

  // Show verification view and intent modal if needed
  return (
    <>
      <VerificationView
        userEmail={userEmail}
        userName={userName}
        onBackToSignUp={handleBackToSignUp}
        onResendVerification={onResendVerification}
        resendCount={resendCount}
        bypassVerification={bypassVerification}
      />
      <OnboardingIntentModal
        open={showIntentModal}
        onSelect={handleSelectIntent}
        onSkip={handleSkip}
      />
    </>
  );
};

export default SignUpContentWrapper;
