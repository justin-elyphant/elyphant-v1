
import React from "react";
import { useSignUpProcess } from "@/hooks/auth";
import SignUpContentWrapper from "@/components/auth/signup/SignUpContentWrapper";
import Header from "@/components/home/Header";

const SignUp: React.FC = () => {
  const {
    step,
    userEmail,
    userName,
    onSignUpSubmit,
    handleBackToSignUp,
    isSubmitting,
    handleResendVerification,
    resendCount,
    bypassVerification = true, // Enable hybrid verification by default
  } = useSignUpProcess();
  
  // Store verification bypass preference in localStorage for consistent experience
  React.useEffect(() => {
    localStorage.setItem("bypassVerification", bypassVerification ? "true" : "false");
  }, [bypassVerification]);
  
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
