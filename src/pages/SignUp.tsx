
import React from "react";
import { useSignUpProcess } from "@/hooks/useSignUpProcess";
import SignUpContentWrapper from "@/components/auth/signup/SignUpContentWrapper";

const SignUp: React.FC = () => {
  const {
    step,
    userEmail,
    userName,
    resendCount,
    testVerificationCode,
    handleSignUpSubmit,
    handleResendVerification,
    handleBackToSignUp,
  } = useSignUpProcess();

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      <SignUpContentWrapper
        step={step as "signup" | "verification"}
        userEmail={userEmail}
        userName={userName || ""}
        resendCount={resendCount || 0}
        testVerificationCode={testVerificationCode}
        onSignUpSubmit={handleSignUpSubmit}
        handleResendVerification={handleResendVerification}
        handleBackToSignUp={handleBackToSignUp}
      />
    </div>
  );
};

export default SignUp;
