
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  
  // AUTO-REDIRECT TO PROFILE SETUP WHEN EMAIL IS SENT
  useEffect(() => {
    if (emailSent && step === "verification") {
      console.log("Auto-redirecting to profile setup from useSignUpProcess");
      
      // Store in localStorage for persistence
      localStorage.setItem("newSignUp", "true");
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("userName", userName || "");
      
      // Use navigate with replace to prevent back-button issues
      navigate('/profile-setup', { replace: true });
    }
  }, [emailSent, step, navigate, userEmail, userName]);
  
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
