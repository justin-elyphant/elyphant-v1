
import React, { useEffect } from "react";
import { useSignUpProcess } from "@/hooks/auth";
import SignUpContentWrapper from "@/components/auth/signup/SignUpContentWrapper";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SignUp: React.FC = () => {
  const navigate = useNavigate();
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
    bypassVerification,
  } = useSignUpProcess();
  
  // Auto-redirect if rate limited
  useEffect(() => {
    if (localStorage.getItem("signupRateLimited") === "true" && 
        localStorage.getItem("userEmail") && 
        localStorage.getItem("userName")) {
      console.log("Rate limit detected and user info available, redirecting to profile setup");
      navigate('/profile-setup', { replace: true });
    }
  }, [navigate]);
  
  // Enhanced logging to check testVerificationCode value
  useEffect(() => {
    console.log("SignUp page - Full state:", {
      step,
      userEmail,
      userName,
      resendCount,
      testVerificationCode: testVerificationCode || "none",
      isSubmitting,
      bypassVerification
    });
  }, [step, userEmail, userName, resendCount, testVerificationCode, isSubmitting, bypassVerification]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow">
        {(localStorage.getItem("signupRateLimited") === "true" || bypassVerification) && (
          <Alert variant="success" className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              We've simplified your signup experience! You can proceed directly to profile setup.
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
          bypassVerification={bypassVerification}
        />
      </div>
      <Footer />
    </div>
  );
};

export default SignUp;
