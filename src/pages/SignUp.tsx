
import React from "react";
import { useSignUpProcess } from "@/hooks/auth";
import SignUpContentWrapper from "@/components/auth/signup/SignUpContentWrapper";
import MainLayout from "@/components/layout/MainLayout";

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
    bypassVerification = true,
  } = useSignUpProcess();

  React.useEffect(() => {
    localStorage.setItem("bypassVerification", "true");
    if (step === "verification") {
      localStorage.setItem("newSignUp", "true");
    }
  }, [step]);
  
  return (
    <MainLayout>
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
    </MainLayout>
  );
};

export default SignUp;
