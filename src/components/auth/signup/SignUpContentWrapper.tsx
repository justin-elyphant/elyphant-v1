
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

  // Handle displaying the intent modal for new signups before any automatic redirects
  React.useEffect(() => {
    const isNewSignUp = localStorage.getItem("newSignUp") === "true";
    const intentAlreadySelected = !!localStorage.getItem("userIntent");
    // Show modal if it's a new sign up and userIntent is not set
    if (isNewSignUp && !intentAlreadySelected) {
      setShowIntentModal(true);
    }
  }, [step]);

  // If the modal is open, block further progression until a choice is made
  if (showIntentModal) {
    const handleSelectIntent = (userIntent: "giftor" | "giftee") => {
      localStorage.setItem("userIntent", userIntent);
      setShowIntentModal(false);

      // New: branch immediately based on role
      if (userIntent === "giftor") {
        localStorage.setItem("onboardingComplete", "true");
        localStorage.removeItem("newSignUp");
        navigate("/marketplace", { replace: true });
      } else {
        // giftee
        // Continue to profile setup as normal, let auto-redirect proceed (or VerificationView logic)
        navigate("/profile-setup", { replace: true });
      }
    };

    const handleSkip = () => {
      // Treat skip as giftee
      localStorage.setItem("userIntent", "skipped");
      setShowIntentModal(false);
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

  // Standard sign up flow
  if (step === "signup") {
    return (
      <SignUpView 
        onSubmit={onSignUpSubmit} 
        isSubmitting={isSubmitting} 
      />
    );
  }

  // Show verification view for "verification" step. In the new flow, this only briefly flashes before intent modal appears for new users.
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
