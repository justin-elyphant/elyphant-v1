
import React, { useEffect } from "react";
import { useSignUpProcess } from "@/hooks/auth";
import SignUpContentWrapper from "@/components/auth/signup/SignUpContentWrapper";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
    isSubmitting,
  } = useSignUpProcess();
  
  // Enhanced logging to check testVerificationCode value
  useEffect(() => {
    console.log("SignUp page - Full state:", {
      step,
      userEmail,
      userName,
      resendCount,
      testVerificationCode: testVerificationCode || "none",
      isSubmitting
    });
  }, [step, userEmail, userName, resendCount, testVerificationCode, isSubmitting]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow">
        {localStorage.getItem("signupRateLimited") === "true" && (
          <Alert variant="warning" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Rate limit detected. We've bypassed email verification to let you continue.
            </AlertDescription>
          </Alert>
        )}
        
        <SignUpContentWrapper
          step={step as "signup" | "verification"}
          userEmail={userEmail}
          userName={userName || ""}
          resendCount={resendCount || 0}
          testVerificationCode={testVerificationCode}
          onSignUpSubmit={onSignUpSubmit}
          handleResendVerification={handleResendVerification}
          handleBackToSignUp={handleBackToSignUp}
          isSubmitting={isSubmitting}
        />
      </div>
      <Footer />
    </div>
  );
};

export default SignUp;
