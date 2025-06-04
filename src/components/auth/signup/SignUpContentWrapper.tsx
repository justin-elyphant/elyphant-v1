
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
  bypassVerification = true
}) => {
  const [showIntentModal, setShowIntentModal] = React.useState(false);
  const [suggestedIntent, setSuggestedIntent] = React.useState<"giftor" | "giftee" | undefined>(undefined);
  const navigate = useNavigate();

  // CRITICAL: Show intent modal IMMEDIATELY when entering verification step
  React.useEffect(() => {
    console.log("[SignUpContentWrapper] Effect triggered:", { step, userEmail, showIntentModal });
    
    // Clear any existing flags during signup step
    if (step === "signup") {
      localStorage.removeItem("showingIntentModal");
      localStorage.removeItem("userIntent");
      setShowIntentModal(false);
      return;
    }
    
    // IMMEDIATELY show modal when verification step loads with email
    if (step === "verification" && userEmail) {
      console.log("[SignUpContentWrapper] Verification step detected - checking intent");
      
      // Check if user already has valid intent
      const userIntent = localStorage.getItem("userIntent");
      const validIntent = userIntent === "giftor" || userIntent === "giftee";
      
      console.log("[SignUpContentWrapper] Current intent:", userIntent, "Valid:", validIntent);

      if (validIntent) {
        console.log("[SignUpContentWrapper] Valid intent found, navigating immediately");
        // Navigate immediately if intent is already selected
        setTimeout(() => {
          if (userIntent === "giftor") {
            console.log("[SignUpContentWrapper] Navigating to marketplace");
            navigate("/marketplace", { replace: true });
          } else {
            console.log("[SignUpContentWrapper] Navigating to profile-setup");
            navigate("/profile-setup", { replace: true });
          }
        }, 100);
        return;
      }

      // Get suggested intent from CTA (only once)
      const ctaIntent = localStorage.getItem("ctaIntent");
      if (ctaIntent === "giftor" || ctaIntent === "giftee") {
        console.log("[SignUpContentWrapper] Setting suggested intent:", ctaIntent);
        setSuggestedIntent(ctaIntent);
        localStorage.removeItem("ctaIntent"); // Clear after using
      }

      // IMMEDIATELY show the intent modal and block everything else
      console.log("[SignUpContentWrapper] IMMEDIATELY showing intent modal - BLOCKING all navigation");
      localStorage.setItem("showingIntentModal", "true");
      setShowIntentModal(true);
    }
  }, [step, userEmail, navigate]);

  const handleSelectIntent = (userIntent: "giftor" | "giftee") => {
    console.log("[SignUpContentWrapper] Intent selected:", userIntent);
    
    // Set the intent and clear modal flags
    localStorage.setItem("userIntent", userIntent);
    localStorage.removeItem("showingIntentModal");
    localStorage.removeItem("ctaIntent");
    
    // Show success toast
    toast.success("Account created successfully!", {
      description: "Welcome to Elyphant!"
    });
    
    // Update local state
    setShowIntentModal(false);

    // Navigate based on intent with small delay
    setTimeout(() => {
      if (userIntent === "giftor") {
        console.log("[SignUpContentWrapper] Navigating to marketplace");
        navigate("/marketplace", { replace: true });
      } else {
        console.log("[SignUpContentWrapper] Navigating to profile-setup");
        navigate("/profile-setup", { replace: true });
      }
    }, 100);
  };

  // FORCE the modal to show if we're in verification step with email - this overrides everything
  if (step === "verification" && userEmail && showIntentModal) {
    console.log("[SignUpContentWrapper] FORCE RENDERING intent modal - BLOCKING all other content");
    return (
      <OnboardingIntentModal
        open={true}
        onSelect={handleSelectIntent}
        onSkip={() => {/* Not used */}}
        suggestedIntent={suggestedIntent}
      />
    );
  }

  // Regular signup/verification flow only if modal is not showing
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
