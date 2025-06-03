
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
  const [isNavigating, setIsNavigating] = React.useState(false);
  const navigate = useNavigate();

  // Determine if Nicole should show with more stable conditions
  const shouldShowNicole = React.useMemo(() => {
    if (step !== "verification" || !userEmail || isNavigating) return false;
    
    const newSignUp = localStorage.getItem("newSignUp") === "true";
    const onboardingComplete = localStorage.getItem("onboardingComplete") === "true";
    
    console.log("Nicole trigger check:", { step, userEmail, newSignUp, onboardingComplete, isNavigating });
    
    return newSignUp && !onboardingComplete;
  }, [step, userEmail, isNavigating]);

  // Show Nicole with delay to prevent flashing
  React.useEffect(() => {
    if (shouldShowNicole && !showNicoleOnboarding) {
      console.log("Triggering Nicole onboarding...");
      
      // Add small delay to prevent flash
      const timer = setTimeout(() => {
        localStorage.removeItem("userIntent");
        localStorage.setItem("showingIntentModal", "true");
        setShowNicoleOnboarding(true);
        console.log("Nicole onboarding triggered");
      }, 500);

      return () => clearTimeout(timer);
    } else if (!shouldShowNicole && showNicoleOnboarding) {
      setShowNicoleOnboarding(false);
    }
  }, [shouldShowNicole, showNicoleOnboarding]);

  // Handle Nicole onboarding completion
  const handleOnboardingComplete = React.useCallback(() => {
    console.log("Nicole onboarding completed");
    setIsNavigating(true);
    localStorage.removeItem("showingIntentModal");
    localStorage.setItem("onboardingComplete", "true");
    setShowNicoleOnboarding(false);

    const finalIntent = localStorage.getItem("userIntent");
    console.log("Final intent:", finalIntent);
    
    setTimeout(() => {
      // Always navigate to profile-setup after onboarding completion
      // regardless of intent - users can customize their profile first
      navigate("/profile-setup", { replace: true });
    }, 100);
  }, [navigate]);

  // Handle Nicole onboarding close or error
  const handleOnboardingClose = React.useCallback(() => {
    console.log("Nicole onboarding closed or failed");
    setIsNavigating(true);
    localStorage.setItem("userIntent", "explorer");
    localStorage.setItem("onboardingComplete", "true");
    localStorage.setItem("showingIntentModal", "false");
    setShowNicoleOnboarding(false);
    
    setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 100);
  }, [navigate]);

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

  // Don't render anything if navigating to prevent flash
  if (isNavigating) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing signup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Always show base content first to prevent flash */}
      {renderBaseContent()}

      {/* Nicole onboarding overlay - only show when ready and not navigating */}
      <NicoleOnboardingEngine
        isOpen={showNicoleOnboarding && !isNavigating}
        onComplete={handleOnboardingComplete}
        onClose={handleOnboardingClose}
      />

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && step === "verification" && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs rounded opacity-75 pointer-events-none z-40">
          Nicole: {showNicoleOnboarding ? 'showing' : 'hidden'} | 
          Should show: {shouldShowNicole ? 'yes' : 'no'} |
          Navigating: {isNavigating ? 'yes' : 'no'}
        </div>
      )}
    </div>
  );
};

export default SignUpContentWrapper;
