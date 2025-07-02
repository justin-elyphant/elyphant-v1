
import React from "react";
import { useSearchParams } from "react-router-dom";
import { useSignUpProcess } from "@/hooks/auth";
import SignUpContentWrapper from "@/components/auth/signup/SignUpContentWrapper";
import MainLayout from "@/components/layout/MainLayout";

const SignUp: React.FC = () => {
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  
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
      // Store redirect path for after signup completion
      localStorage.setItem("signupRedirectPath", redirectPath);
    }
  }, [step, redirectPath]);
  
  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Show redirect context if coming from protected route */}
          {searchParams.get('redirect') && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                Create an account to access this feature
              </p>
            </div>
          )}
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
    </MainLayout>
  );
};

export default SignUp;
