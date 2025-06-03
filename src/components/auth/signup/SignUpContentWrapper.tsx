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
  const [formData, setFormData] = React.useState<SignUpFormValues | null>(null);
  const navigate = useNavigate();

  // Enhanced form submission that stores data and shows Nicole immediately
  const handleFormSubmit = React.useCallback(async (values: SignUpFormValues) => {
    console.log("Form submission starting for:", values.email);
    
    // Store form data temporarily
    setFormData(values);
    
    // Show Nicole immediately before account creation
    localStorage.setItem("tempUserData", JSON.stringify(values));
    localStorage.setItem("showingIntentModal", "true");
    setShowNicoleOnboarding(true);
    
    console.log("Showing Nicole onboarding before account creation");
  }, []);

  // Handle Nicole onboarding completion - create account after Nicole
  const handleOnboardingComplete = React.useCallback(async () => {
    console.log("Nicole onboarding completed, creating account...");
    
    if (!formData) {
      console.error("No form data available for account creation");
      return;
    }
    
    try {
      setIsNavigating(true);
      localStorage.removeItem("showingIntentModal");
      localStorage.setItem("onboardingComplete", "true");
      setShowNicoleOnboarding(false);

      // Now create the account with collected data
      await onSignUpSubmit(formData);
      
      const finalIntent = localStorage.getItem("userIntent");
      console.log("Account created, final intent:", finalIntent);
      
      setTimeout(() => {
        navigate("/profile-setup", { replace: true });
      }, 100);
    } catch (error) {
      console.error("Error creating account after Nicole:", error);
      setIsNavigating(false);
      // Show error to user but keep Nicole closed
      setShowNicoleOnboarding(false);
    }
  }, [formData, navigate, onSignUpSubmit]);

  // Handle Nicole onboarding close or error
  const handleOnboardingClose = React.useCallback(() => {
    console.log("Nicole onboarding closed, creating account without onboarding...");
    
    if (!formData) {
      console.error("No form data available for account creation");
      return;
    }
    
    setIsNavigating(true);
    localStorage.setItem("userIntent", "explorer");
    localStorage.setItem("onboardingComplete", "true");
    localStorage.removeItem("showingIntentModal");
    setShowNicoleOnboarding(false);
    
    // Create account anyway
    onSignUpSubmit(formData).then(() => {
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 100);
    }).catch((error) => {
      console.error("Error creating account:", error);
      setIsNavigating(false);
    });
  }, [formData, navigate, onSignUpSubmit]);

  // Render base content
  const renderBaseContent = () => {
    if (step === "signup") {
      return (
        <SignUpView 
          onSubmit={handleFormSubmit} 
          isSubmitting={isSubmitting || showNicoleOnboarding} 
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
          <p className="text-gray-600">Creating your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Always show base content first to prevent flash */}
      {renderBaseContent()}

      {/* Nicole onboarding overlay - show when triggered from signup form */}
      <NicoleOnboardingEngine
        isOpen={showNicoleOnboarding && !isNavigating}
        onComplete={handleOnboardingComplete}
        onClose={handleOnboardingClose}
      />

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs rounded opacity-75 pointer-events-none z-40">
          Nicole: {showNicoleOnboarding ? 'showing' : 'hidden'} | 
          Navigating: {isNavigating ? 'yes' : 'no'} |
          Form Data: {formData ? 'stored' : 'none'}
        </div>
      )}
    </div>
  );
};

export default SignUpContentWrapper;
