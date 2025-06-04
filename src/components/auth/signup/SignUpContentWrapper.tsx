
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

  // Pickup intended CTA intent (set on homepage) and clear after referencing
  const [suggestedIntent, setSuggestedIntent] = React.useState<"giftor" | "giftee" | undefined>(undefined);

  React.useEffect(() => {
    if (step !== "verification" || !userEmail) {
      if (showIntentModal) setShowIntentModal(false);
      if (intentHandled) setIntentHandled(false);
      return;
    }

    // Retrieve suggested intent only ONCE on modal show, then clear the value for next visits
    if (!intentHandled && !showIntentModal) {
      const ctaIntent = localStorage.getItem("ctaIntent");
      if (ctaIntent === "giftor" || ctaIntent === "giftee") {
        setSuggestedIntent(ctaIntent);
        // Clear so it only applies on first modal show after signup
        localStorage.removeItem("ctaIntent");
      }
    }

    const intent = localStorage.getItem("userIntent");
    // Always show modal if no valid intent is found
    if (!validIntent(intent)) {
      console.log("[SignUpContentWrapper] No valid intent found, showing modal");
      localStorage.setItem("showingIntentModal", "true");
      setShowIntentModal(true);
      setIntentHandled(false);
    } else {
      console.log("[SignUpContentWrapper] Valid intent found:", intent);
      setShowIntentModal(false);
      setIntentHandled(true);
    }
  }, [step, userEmail, intentHandled, showIntentModal]);

  // -- EARLY BLOCKER: If we should show the intent modal, render ONLY the modal --
  if (
    step === "verification" &&
    userEmail &&
    !validIntent(localStorage.getItem("userIntent"))
  ) {
    const handleSelectIntent = (userIntent: "giftor" | "giftee") => {
      console.log("[SignUpContentWrapper] Intent selected:", userIntent);
      
      // Set the intent and clear modal flags immediately
      localStorage.setItem("userIntent", userIntent);
      localStorage.removeItem("showingIntentModal");
      
      // Update local state
      setShowIntentModal(false);
      setIntentHandled(true);

      // Small delay to ensure localStorage is updated before navigation
      setTimeout(() => {
        if (userIntent === "giftor") {
          console.log("[SignUpContentWrapper] Navigating to onboarding-gift");
          navigate("/onboarding-gift", { replace: true });
        } else {
          console.log("[SignUpContentWrapper] Navigating to profile-setup");
          navigate("/profile-setup", { replace: true });
        }
      }, 100);
    };

    return (
      <OnboardingIntentModal
        open={true}
        onSelect={handleSelectIntent}
        onSkip={() => {/* Not used */}
        }
        suggestedIntent={suggestedIntent}
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
