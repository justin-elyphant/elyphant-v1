
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
  const { onSignUpSubmit, isSubmitting: submitIsLoading } = useSignUpSubmit();

  // Wrap the onSignUpSubmit function to handle our local state
  const handleSignUpSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      
      // Call the original submit function
      await onSignUpSubmit(values);
      
      // Update our local state after successful submission
      setUserEmail(values.email);
      setUserName(values.name);
      setEmailSent(true);
      setStep("verification");  // This will trigger auto-redirect to profile setup
    } catch (error) {
      console.error("Sign up process error:", error);
      
      // Check for rate limit error in the caught error
      const err = error as any;
      if (err?.message?.includes("rate limit") || 
          err?.message?.includes("too many requests") || 
          err?.status === 429 ||
          err?.code === "over_email_send_rate_limit") {
        
        console.log("Rate limit caught in error handler, bypassing verification");
        setBypassVerification(true);
        localStorage.setItem("signupRateLimited", "true");
        
        // Store user data and proceed
        localStorage.setItem("userEmail", values.email);
        localStorage.setItem("userName", values.name);
        localStorage.setItem("newSignUp", "true");
        
        setUserEmail(values.email);
        setUserName(values.name);
        setEmailSent(true);
        setTestVerificationCode("123456");
        
        // Auto-redirect to profile setup
        navigate('/profile-setup', { replace: true });
        return;
      }
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

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
    onSignUpSubmit: handleSignUpSubmit,
    handleResendVerification,
    handleBackToSignUp,
    isSubmitting: isSubmitting || submitIsLoading,
    bypassVerification,
  };
}
