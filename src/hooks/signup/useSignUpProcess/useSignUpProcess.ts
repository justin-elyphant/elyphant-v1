
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { useVerificationRedirect } from "./useVerificationRedirect";
import { useSignUpSubmit } from "./useSignUpSubmit";
import { useResendVerification } from "./useResendVerification";

export function useSignUpProcess() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"signup" | "verification">("signup");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [testVerificationCode, setTestVerificationCode] = useState<string | null>(null);

  // Check for URL parameters indicating verified status
  useVerificationRedirect(navigate, setUserEmail);
  
  // Debug logging for the verification code
  useEffect(() => {
    console.log("SignUp hook: testVerificationCode state updated to:", testVerificationCode);
  }, [testVerificationCode]);

  // Handle signup form submission
  const { onSignUpSubmit } = useSignUpSubmit({
    setUserEmail,
    setUserName,
    setEmailSent,
    setStep,
    setTestVerificationCode
  });

  // Handle resending verification email
  const { resendCount, lastResendTime, handleResendVerification } = useResendVerification({
    userEmail,
    userName,
    setTestVerificationCode
  });

  const handleBackToSignUp = () => {
    setStep("signup");
  };

  return {
    step,
    userEmail,
    userName,
    emailSent,
    resendCount,
    testVerificationCode,
    onSignUpSubmit,
    handleResendVerification,
    handleBackToSignUp,
  };
}
