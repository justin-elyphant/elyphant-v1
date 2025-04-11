
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [redirectAttempted, setRedirectAttempted] = useState<boolean>(false);

  // Check for URL parameters indicating verified status
  useVerificationRedirect(navigate, setUserEmail);
  
  // DETECT DIRECT NAVIGATION TO PROFILE SETUP
  useEffect(() => {
    if (emailSent && step === "verification" && !redirectAttempted) {
      console.log("Auto-redirecting to profile setup from useSignUpProcess");
      
      // Store in localStorage for persistence across redirects
      localStorage.setItem("newSignUp", "true");
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("userName", userName || "");
      
      // Mark that we've attempted redirect
      setRedirectAttempted(true);
      
      // Use a progressive multi-stage redirect strategy
      navigate('/profile-setup', { replace: true });
      
      // Fallback redirects with increasing delays
      setTimeout(() => {
        window.location.replace('/profile-setup');
        
        setTimeout(() => {
          window.location.href = '/profile-setup';
        }, 300);
      }, 150);
    }
  }, [emailSent, step, navigate, userEmail, userName, redirectAttempted]);
  
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
    setRedirectAttempted(false);
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
