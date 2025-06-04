
import React from "react";
import { toast } from "sonner";
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
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();

  // Handle verification step logic
  React.useEffect(() => {
    console.log("[SignUpContentWrapper] Effect triggered:", { step, userEmail, showIntentModal });
    
    // Clear any existing flags during signup step
    if (step === "signup") {
      localStorage.removeItem("showingIntentModal");
      localStorage.removeItem("userIntent");
      setShowIntentModal(false);
      setIsLoading(false);
      return;
    }
    
    // Handle verification step
    if (step === "verification" && userEmail) {
      console.log("[SignUpContentWrapper] Verification step detected - checking intent");
      setIsLoading(true);
      
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

      // Show the intent modal and stop loading
      console.log("[SignUpContentWrapper] Showing intent modal");
      localStorage.setItem("showingIntentModal", "true");
      setShowIntentModal(true);
      setIsLoading(false);
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

  // Render signup step
  if (step === "signup") {
    return (
      <SignUpView 
        onSubmit={onSignUpSubmit} 
        isSubmitting={isSubmitting} 
      />
    );
  }

  // Render verification step loading
  if (step === "verification" && isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // Render intent modal - this takes priority over everything else in verification step
  if (step === "verification" && showIntentModal) {
    console.log("[SignUpContentWrapper] RENDERING intent modal");
    return (
      <OnboardingIntentModal
        open={true}
        onSelect={handleSelectIntent}
        onSkip={() => {/* Not used */}}
        suggestedIntent={suggestedIntent}
      />
    );
  }

  // Fallback to verification view (this should rarely be reached now)
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
