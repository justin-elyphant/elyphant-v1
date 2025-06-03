
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
  const [showNicoleOnboarding, setShowNicoleOnboarding] = React.useState(false);
  const [isReadyForModal, setIsReadyForModal] = React.useState(false);
  const [nicoleLoadingTimeout, setNicoleLoadingTimeout] = React.useState(false);
  const [showFallbackContent, setShowFallbackContent] = React.useState(false);
  const navigate = useNavigate();

  // Stable intent check with proper debouncing
  const shouldShowNicole = React.useMemo(() => {
    if (step !== "verification" || !userEmail || !isReadyForModal) return false;
    
    const intent = localStorage.getItem("userIntent");
    const showingModal = localStorage.getItem("showingIntentModal");
    
    console.log("Intent check:", { intent, showingModal, step, userEmail, isReadyForModal });
    
    return !validIntent(intent) && showingModal !== "false";
  }, [step, userEmail, isReadyForModal]);

  // Delayed initialization to prevent race conditions
  React.useEffect(() => {
    if (step === "verification" && userEmail) {
      const readyTimer = setTimeout(() => {
        setIsReadyForModal(true);
      }, 500); // Wait for auth state to stabilize

      // Safety timeout to show fallback content if Nicole doesn't load
      const fallbackTimer = setTimeout(() => {
        console.log("Nicole loading timeout - showing fallback content");
        setNicoleLoadingTimeout(true);
        setShowFallbackContent(true);
      }, 3000); // 3 second timeout

      return () => {
        clearTimeout(readyTimer);
        clearTimeout(fallbackTimer);
      };
    } else {
      setIsReadyForModal(false);
      setNicoleLoadingTimeout(false);
      setShowFallbackContent(false);
    }
  }, [step, userEmail]);

  // Initialize Nicole onboarding state with proper timing and error handling
  React.useEffect(() => {
    console.log("SignUpContentWrapper effect:", { step, userEmail, shouldShowNicole, isReadyForModal });
    
    if (shouldShowNicole && !nicoleLoadingTimeout) {
      const showTimer = setTimeout(() => {
        try {
          localStorage.setItem("showingIntentModal", "true");
          setShowNicoleOnboarding(true);
          console.log("Nicole onboarding initialized successfully");
        } catch (error) {
          console.error("Error initializing Nicole onboarding:", error);
          setShowFallbackContent(true);
        }
      }, 200); // Small delay to ensure stable state

      return () => clearTimeout(showTimer);
    } else if (shouldShowNicole && nicoleLoadingTimeout) {
      // Nicole should show but timed out, show fallback
      console.log("Nicole timed out, showing fallback content");
      setShowFallbackContent(true);
      setShowNicoleOnboarding(false);
    } else {
      setShowNicoleOnboarding(false);
    }
  }, [shouldShowNicole, nicoleLoadingTimeout]);

  // Handle Nicole onboarding completion
  const handleOnboardingComplete = React.useCallback(() => {
    console.log("Nicole onboarding completed");
    localStorage.removeItem("showingIntentModal");
    setShowNicoleOnboarding(false);
    setShowFallbackContent(false);

    // Navigate based on user intent (which Nicole will have set)
    const finalIntent = localStorage.getItem("userIntent");
    console.log("Final intent:", finalIntent);
    
    const navigationTimer = setTimeout(() => {
      if (finalIntent === "giftor") {
        navigate("/onboarding-gift", { replace: true });
      } else {
        navigate("/profile-setup", { replace: true });
      }
    }, 100); // Small delay for smooth transition

    return () => clearTimeout(navigationTimer);
  }, [navigate]);

  // Handle Nicole onboarding close or error
  const handleOnboardingClose = React.useCallback(() => {
    console.log("Nicole onboarding closed or failed");
    localStorage.setItem("userIntent", "explorer");
    localStorage.setItem("showingIntentModal", "false");
    setShowNicoleOnboarding(false);
    setShowFallbackContent(false);
    handleOnboardingComplete();
  }, [handleOnboardingComplete]);

  // Always render the base content first
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
      {/* Always show base content to prevent white page */}
      {renderBaseContent()}

      {/* Nicole onboarding as overlay when ready and not timed out */}
      {showNicoleOnboarding && isReadyForModal && !nicoleLoadingTimeout && (
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
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs rounded opacity-50 pointer-events-none">
          Nicole: {showNicoleOnboarding ? 'showing' : 'hidden'} | 
          Ready: {isReadyForModal ? 'yes' : 'no'} | 
          Timeout: {nicoleLoadingTimeout ? 'yes' : 'no'} |
          Fallback: {showFallbackContent ? 'yes' : 'no'}
        </div>
      )}
    </div>
  );
};

export default SignUpContentWrapper;
