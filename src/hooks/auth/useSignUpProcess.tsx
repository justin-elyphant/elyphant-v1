
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVerificationRedirect } from "./useVerificationRedirect";
import { useResendVerification } from "./useResendVerification";
import { useSignUpSubmit } from "./useSignUpSubmit";
import { isRateLimitError } from "./utils/rateLimit";

export function useSignUpProcess() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"signup" | "verification">("signup");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bypassVerification, setBypassVerification] = useState<boolean>(false);
  const [testVerificationCode, setTestVerificationCode] = useState<string | null>(null);

  // Check for URL parameters indicating verified status
  useVerificationRedirect(navigate, setUserEmail);
  
  // AUTO-REDIRECT TO PROFILE SETUP WHEN EMAIL IS SENT
  useEffect(() => {
    if (emailSent && (step === "verification" || bypassVerification)) {
      console.log("Auto-redirecting to profile setup from useSignUpProcess, bypass:", bypassVerification);
      
      // Store in localStorage for persistence
      localStorage.setItem("newSignUp", "true");
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("userName", userName);
      
      // Use navigate with replace to prevent back-button issues
      navigate('/profile-setup', { replace: true });
    }
  }, [emailSent, step, navigate, userEmail, userName, bypassVerification]);
  
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
      if (isRateLimitError(error)) {
        console.log("Rate limit caught in useSignUpProcess, bypassing verification");
        
        // Handle the rate limit error by bypassing verification
        handleRateLimit({
          email: values.email,
          name: values.name,
          setUserEmail,
          setUserName,
          setTestVerificationCode,
          setEmailSent,
          navigate
        });
        setBypassVerification(true);
        return;
      }
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resending verification email - pass setTestVerificationCode
  const { resendCount, handleResendVerification } = useResendVerification({
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

// Rate limit handler function
const handleRateLimit = ({
  email, 
  name, 
  setUserEmail, 
  setUserName,
  setTestVerificationCode,
  setEmailSent,
  navigate
}: {
  email: string;
  name: string;
  setUserEmail: (email: string) => void;
  setUserName: (name: string) => void;
  setTestVerificationCode: (code: string | null) => void;
  setEmailSent: (sent: boolean) => void;
  navigate: ReturnType<typeof useNavigate>;
}): void => {
  console.log("Rate limit detected, bypassing verification entirely");
  
  // Set user state
  setUserEmail(email);
  setUserName(name);
  setTestVerificationCode("123456"); // Set dummy code
  setEmailSent(true);
  
  // Store in localStorage for persistence through redirects
  localStorage.setItem("newSignUp", "true");
  localStorage.setItem("userEmail", email);
  localStorage.setItem("userName", name);
  localStorage.setItem("signupRateLimited", "true");
};
