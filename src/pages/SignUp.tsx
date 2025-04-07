
import React, { useEffect } from "react";
import { useSignUpProcess } from "@/hooks/auth";
import SignUpContentWrapper from "@/components/auth/signup/SignUpContentWrapper";

const SignUp: React.FC = () => {
  const {
    step,
    userEmail,
    userName,
    resendCount,
    testVerificationCode,
    onSignUpSubmit,
    handleResendVerification,
    handleBackToSignUp,
  } = useSignUpProcess();
  
  // Enhanced logging to check testVerificationCode value
  useEffect(() => {
    console.log("SignUp page - Full state:", {
      step,
      userEmail,
      userName,
      resendCount,
      testVerificationCode: testVerificationCode || "none"
    });
    console.log("SignUp page testVerificationCode:", testVerificationCode);
  }, [step, userEmail, userName, resendCount, testVerificationCode]);

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      <SignUpContentWrapper
        step={step as "signup" | "verification"}
        userEmail={userEmail}
        userName={userName || ""}
        resendCount={resendCount || 0}
        testVerificationCode={testVerificationCode}
        onSignUpSubmit={onSignUpSubmit}
        handleResendVerification={handleResendVerification}
        handleBackToSignUp={handleBackToSignUp}
      />
    </div>
  );
};

export default SignUp;
