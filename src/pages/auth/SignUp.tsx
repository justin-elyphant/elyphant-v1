
import React from "react";
import { useNavigate } from "react-router-dom";
import { useSignUpProcess } from "@/hooks/auth";
import SignUpContentWrapper from "@/components/auth/signup/SignUpContentWrapper";
import Header from "@/components/home/Header";
import { useAuth } from "@/contexts/auth";

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  React.useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);
  
  const {
    step,
    userEmail,
    userName,
    onSignUpSubmit,
    handleBackToSignUp,
    isSubmitting,
    handleResendVerification,
    resendCount,
    bypassVerification = true, // Always enable hybrid verification for better UX
  } = useSignUpProcess();
  
  // Store verification bypass preference in localStorage for consistent experience across sessions
  React.useEffect(() => {
    localStorage.setItem("bypassVerification", "true"); // Always set to true for Phase 5
    
    // For new sign ups, mark as new user for onboarding
    if (step === "verification") {
      localStorage.setItem("newSignUp", "true");
    }
  }, [step]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <SignUpContentWrapper
          step={step as "signup" | "verification"}
          userEmail={userEmail}
          userName={userName}
          onSignUpSubmit={onSignUpSubmit}
          handleBackToSignUp={handleBackToSignUp}
          isSubmitting={isSubmitting}
          onResendVerification={handleResendVerification}
          resendCount={resendCount}
          bypassVerification={bypassVerification}
        />
      </div>
    </div>
  );
};

export default SignUp;
