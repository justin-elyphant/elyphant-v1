
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
    // Always show modal if no valid intent is found
    if (!validIntent(intent)) {
      localStorage.setItem("showingIntentModal", "true");
      setShowIntentModal(true);
      setIntentHandled(false);
    } else {
      setShowIntentModal(false);
      setIntentHandled(true);
    }
  }, [step, userEmail]); // Only react to step/email changes

  // -- EARLY BLOCKER: If we should show the intent modal (verification step, no valid intent), render ONLY the modal (avoid UI flash!) --
  if (
    step === "verification" &&
    userEmail &&
    !validIntent(localStorage.getItem("userIntent"))
  ) {
    // Only the modal is visible; rest of UI is NOT rendered, no background flash.
    const handleSelectIntent = (userIntent: "giftor" | "giftee") => {
      localStorage.setItem("userIntent", userIntent);
      localStorage.removeItem("showingIntentModal");
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

    // This will prevent background flash by rendering ONLY the modal:
    return (
      <OnboardingIntentModal
        open={true}
        onSelect={handleSelectIntent}
        onSkip={() => {/* Never called, keeps interface compatible */}}
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

