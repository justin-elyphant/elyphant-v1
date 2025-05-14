
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
  const [showIntentModal, setShowIntentModal] = React.useState(false);
  const [intentHandled, setIntentHandled] = React.useState(false);
  const navigate = useNavigate();

  // --- STRICT: Only consider modal when on verification step and userEmail; never show on signup form! ---
  React.useEffect(() => {
    // Only check modal logic at verification phase with userEmail
    if (step !== "verification" || !userEmail) {
      if (showIntentModal) setShowIntentModal(false);
      if (intentHandled) setIntentHandled(false);
      return;
    }
    const intent = localStorage.getItem("userIntent");
    console.log("[SignUpContentWrapper] Effect: (step/email/intent):", { step, userEmail, intent });

    if (!validIntent(intent)) {
      setShowIntentModal(true);
      setIntentHandled(false);
    } else {
      setShowIntentModal(false);
      setIntentHandled(true);
    }
  }, [step, userEmail]); // Only react to step/email changes

  // --- STRONG BLOCK: Modal overrides *everything* at verification if not handled. ---
  if (step === "verification" && showIntentModal && !intentHandled && userEmail) {
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
      // Don't allow skipping; force modal to remain until user selects
      localStorage.setItem("userIntent", "skipped");
      setShowIntentModal(true);
      setIntentHandled(false);
    };

    console.log("[SignUpContentWrapper] Modal is rendered, blocking UI. (ONLY ON VERIFICATION PAGE)");

    return (
      <OnboardingIntentModal
        open={showIntentModal}
        onSelect={handleSelectIntent}
        onSkip={handleSkip}
      />
    );
  }

  // Only show signup view if actively at signup phase (no modal possible here)
  if (step === "signup") {
    return (
      <SignUpView 
        onSubmit={onSignUpSubmit} 
        isSubmitting={isSubmitting} 
      />
    );
  }

  // Only show verification *if* modal handled or valid intent
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
