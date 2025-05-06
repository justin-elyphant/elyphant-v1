
import React from "react";
import { useSignUpProcess } from "@/hooks/auth";
import SignUpContentWrapper from "@/components/auth/signup/SignUpContentWrapper";
import Header from "@/components/home/Header";
// Import AuthProvider directly from its source to avoid circular dependencies
import { AuthProvider } from "@/contexts/auth/AuthProvider";

const SignUp: React.FC = () => {
  const {
    step,
    userEmail,
    userName,
    onSignUpSubmit,
    handleBackToSignUp,
    isSubmitting,
    bypassVerification = true, // Enable hybrid verification by default
  } = useSignUpProcess();
  
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
          bypassVerification={bypassVerification}
        />
      </div>
    </div>
  );
};

export default SignUp;
