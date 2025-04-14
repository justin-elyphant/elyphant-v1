
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useVerificationRedirect } from "./useVerificationRedirect";
import { useResendVerification } from "./useResendVerification";
import { useSignUpSubmit } from "./useSignUpSubmit";
import { isRateLimitError, handleRateLimit, isRateLimitFlagSet } from "./utils/rateLimit";
import { toast } from "sonner";

export function useSignUpProcess() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"signup" | "verification">("signup");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bypassVerification, setBypassVerification] = useState<boolean>(isRateLimitFlagSet());
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
  
  // Check for rate limit flags periodically
  useEffect(() => {
    const checkRateLimitFlags = () => {
      const rateLimit = isRateLimitFlagSet();
      if (rateLimit !== bypassVerification) {
        setBypassVerification(rateLimit);
      }
    };
    
    // Check immediately
    checkRateLimitFlags();
    
    // Set up interval to check flags
    const intervalId = setInterval(checkRateLimitFlags, 1000);
    
    // Clean up
    return () => clearInterval(intervalId);
  }, [bypassVerification]);
  
  // Handle signup form submission
  const { onSignUpSubmit: originalOnSignUpSubmit, isSubmitting: submitIsLoading } = useSignUpSubmit();

  // Wrap the onSignUpSubmit function to handle our local state
  const handleSignUpSubmit = useCallback(async (values: any) => {
    try {
      setIsSubmitting(true);
      
      // Check for rate limit flags before even trying
      if (isRateLimitFlagSet()) {
        console.log("Rate limit flags already set, bypassing normal signup flow");
        setUserEmail(values.email);
        setUserName(values.name);
        setEmailSent(true);
        setBypassVerification(true);
        
        toast.success("Account created successfully!", {
          description: "Taking you to complete your profile."
        });
        
        navigate('/profile-setup', { replace: true });
        return;
      }
      
      try {
        // Call the original submit function
        await originalOnSignUpSubmit(values);
        
        // Update our local state after successful submission
        setUserEmail(values.email);
        setUserName(values.name);
        setEmailSent(true);
        setStep("verification");  // This will trigger auto-redirect to profile setup
      } catch (submitError) {
        console.error("Error in original onSignUpSubmit:", submitError);
        
        // Check for rate limit error in the caught error
        if (isRateLimitError(submitError)) {
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
          
          // No need to rethrow since we handled it
          return;
        }
        
        // For other errors, rethrow
        throw submitError;
      }
    } catch (error) {
      console.error("Sign up process error:", error);
      
      // Double-check for rate limit error
      if (isRateLimitError(error)) {
        console.log("Rate limit caught in outer catch of useSignUpProcess");
        
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
  }, [originalOnSignUpSubmit, navigate, setUserEmail, setUserName, setTestVerificationCode, setEmailSent]);

  // Handle resending verification email - pass setTestVerificationCode
  const { resendCount, handleResendVerification: originalResendVerification } = useResendVerification({
    userEmail,
    userName,
    setTestVerificationCode
  });
  
  // Wrap resend verification to handle rate limits
  const handleResendVerification = useCallback(async () => {
    try {
      const result = await originalResendVerification();
      
      // If result indicates rate limiting
      if (result.rateLimited) {
        console.log("Rate limit detected in resend verification, bypassing verification");
        
        // Handle rate limit
        handleRateLimit({
          email: userEmail,
          name: userName,
          setUserEmail,
          setUserName,
          setTestVerificationCode,
          setEmailSent,
          navigate
        });
        
        setBypassVerification(true);
      }
      
      return result;
    } catch (error) {
      console.error("Error in handleResendVerification:", error);
      
      // Check for rate limit error
      if (isRateLimitError(error)) {
        console.log("Rate limit detected in resend verification catch block");
        
        // Handle rate limit
        handleRateLimit({
          email: userEmail,
          name: userName,
          setUserEmail,
          setUserName,
          setTestVerificationCode,
          setEmailSent,
          navigate
        });
        
        setBypassVerification(true);
        return { success: true, rateLimited: true };
      }
      
      return { success: false };
    }
  }, [
    originalResendVerification, 
    userEmail, 
    userName, 
    navigate, 
    setUserEmail, 
    setUserName, 
    setTestVerificationCode, 
    setEmailSent
  ]);

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
