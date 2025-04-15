
import React from "react";
import { useSignUpProcess } from "@/hooks/auth";
import SignUpContentWrapper from "@/components/auth/signup/SignUpContentWrapper";

const SignUp: React.FC = () => {
  const {
    step,
    userEmail,
    userName,
    onSignUpSubmit,
    handleBackToSignUp,
    isSubmitting,
  } = useSignUpProcess();
  
  return (
    <div className="container max-w-md mx-auto py-10 px-4 flex-grow">
      <SignUpContentWrapper
        step={step as "signup" | "verification"}
        userEmail={userEmail}
        userName={userName}
        onSignUpSubmit={onSignUpSubmit}
        handleBackToSignUp={handleBackToSignUp}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default SignUp;
