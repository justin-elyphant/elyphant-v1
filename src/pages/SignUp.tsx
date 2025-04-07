
import React, { useEffect } from "react";
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
  
  // Add logging to check testVerificationCode value
  useEffect(() => {
    console.log("SignUp page testVerificationCode:", testVerificationCode);
  }, [testVerificationCode]);

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
