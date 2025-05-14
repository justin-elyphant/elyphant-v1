
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
  const navigate = useNavigate();

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

    // New branching logic
    if (userIntent === "giftor") {
      // Skip profile setup and go directly to marketplace/gifting experience
      localStorage.setItem("onboardingComplete", "true"); // Mark onboarding as done
      localStorage.removeItem("newSignUp");
      navigate("/marketplace", { replace: true });
    } else if (userIntent === "giftee") {
      // Continue to profile setup flow as usual (handled by existing logic)
      // No action needed, /profile-setup will be routed after verification step
    }
  };

  const handleSkip = () => {
    // Treat skip as giftee (default)
    localStorage.setItem("userIntent", "skipped");
    setShowIntentModal(false);
    // Continue to profile setup as normal
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

