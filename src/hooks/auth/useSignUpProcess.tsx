
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVerificationRedirect } from "./useVerificationRedirect";
import { useResendVerification } from "./useResendVerification";
import { useSignUpSubmit } from "./useSignUpSubmit";

export function useSignUpProcess() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"signup" | "verification">("signup");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [testVerificationCode, setTestVerificationCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bypassVerification, setBypassVerification] = useState<boolean>(false);

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
  const { onSignUpSubmit } = useSignUpSubmit();

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
    isSubmitting,
    bypassVerification,
  };
}
