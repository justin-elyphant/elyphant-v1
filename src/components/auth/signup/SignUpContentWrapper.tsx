
import React from "react";
import SignUpView from "./views/SignUpView";
import VerificationView from "./views/VerificationView";
import { SignUpFormValues } from "./SignUpForm";
import NicoleOnboardingEngine from "@/components/onboarding/nicole/NicoleOnboardingEngine";
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
  const [showNicoleOnboarding, setShowNicoleOnboarding] = React.useState(false);
  const [nicoleInitialized, setNicoleInitialized] = React.useState(false);
  const navigate = useNavigate();

  // Simplified logic: Show Nicole for new signups in verification step
  const shouldShowNicole = React.useMemo(() => {
    if (step !== "verification" || !userEmail) return false;
    
    const newSignUp = localStorage.getItem("newSignUp") === "true";
    const onboardingComplete = localStorage.getItem("onboardingComplete") === "true";
    
    console.log("Nicole trigger check:", { step, userEmail, newSignUp, onboardingComplete });
    
    // Show Nicole for new signups that haven't completed onboarding
    return newSignUp && !onboardingComplete;
  }, [step, userEmail]);

  // Initialize Nicole when conditions are met
  React.useEffect(() => {
    if (shouldShowNicole && !nicoleInitialized) {
      console.log("Initializing Nicole onboarding...");
      
      // Clear any existing intent to let Nicole set it
      localStorage.removeItem("userIntent");
      localStorage.setItem("showingIntentModal", "true");
      
      const initTimer = setTimeout(() => {
        setNicoleInitialized(true);
        setShowNicoleOnboarding(true);
        console.log("Nicole onboarding initialized successfully");
      }, 500);

      return () => clearTimeout(initTimer);
    }
  }, [shouldShowNicole, nicoleInitialized]);

  // Cleanup when modal closes
  React.useEffect(() => {
    if (!shouldShowNicole) {
      setNicoleInitialized(false);
      setShowNicoleOnboarding(false);
    }
  }, [shouldShowNicole]);

  // Handle Nicole onboarding completion
  const handleOnboardingComplete = React.useCallback(() => {
    console.log("Nicole onboarding completed");
    localStorage.removeItem("showingIntentModal");
    localStorage.setItem("onboardingComplete", "true");
    setShowNicoleOnboarding(false);

    // Navigate based on user intent (which Nicole will have set)
    const finalIntent = localStorage.getItem("userIntent");
    console.log("Final intent:", finalIntent);
    
    setTimeout(() => {
      if (finalIntent === "giftor") {
        navigate("/onboarding-gift", { replace: true });
      } else {
        navigate("/profile-setup", { replace: true });
      }
    }, 100);
  }, [navigate]);

  // Handle Nicole onboarding close or error
  const handleOnboardingClose = React.useCallback(() => {
    console.log("Nicole onboarding closed or failed");
    localStorage.setItem("userIntent", "explorer");
    localStorage.setItem("onboardingComplete", "true");
    localStorage.setItem("showingIntentModal", "false");
    setShowNicoleOnboarding(false);
    handleOnboardingComplete();
  }, [handleOnboardingComplete]);

  // Render base content
  const renderBaseContent = () => {
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

  return (
    <div className="relative">
      {/* Always show base content */}
      {renderBaseContent()}

      {/* Nicole onboarding overlay */}
      {showNicoleOnboarding && (
        <div className="fixed inset-0 z-50">
          <NicoleOnboardingEngine
            isOpen={true}
            onComplete={handleOnboardingComplete}
            onClose={handleOnboardingClose}
          />
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && step === "verification" && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs rounded opacity-75 pointer-events-none">
          Nicole: {showNicoleOnboarding ? 'showing' : 'hidden'} | 
          Should show: {shouldShowNicole ? 'yes' : 'no'} |
          Init: {nicoleInitialized ? 'yes' : 'no'}
        </div>
      )}
    </div>
  );
};

export default SignUpContentWrapper;
