
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseVerificationCodeProps {
  userEmail: string;
  onVerificationSuccess: () => void;
  testVerificationCode?: string | null;
}

export const useVerificationCode = ({
  userEmail,
  onVerificationSuccess,
  testVerificationCode
}: UseVerificationCodeProps) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState<number | null>(null);
  const [autoVerifyTriggered, setAutoVerifyTriggered] = useState(false);

  // Enhanced debugging
  useEffect(() => {
    console.log("useVerificationCode: Initial state", {
      userEmail,
      testVerificationCode: testVerificationCode || "none",
      autoVerifyTriggered,
      currentVerificationCode: verificationCode
    });

    if (testVerificationCode) {
      console.log("useVerificationCode: testVerificationCode detected:", testVerificationCode);
      toast.info("Verification form received test code", {
        description: `Code: ${testVerificationCode}`,
        duration: 10000
      });
    }
  }, []);

  // Effect to automatically enter test code when provided
  useEffect(() => {
    if (testVerificationCode && verificationCode !== testVerificationCode) {
      console.log("Auto-filling test verification code:", testVerificationCode);
      
      // Use a timeout to ensure DOM is ready
      const timer = setTimeout(() => {
        console.log("Setting verification code state to:", testVerificationCode);
        setVerificationCode(testVerificationCode);
        
        // After auto-filling, schedule auto-verification
        const verifyTimer = setTimeout(() => {
          console.log("Auto-triggering verification for test code");
          if (!isSubmitting && !autoVerifyTriggered) {
            setAutoVerifyTriggered(true);
            handleVerifyCode(testVerificationCode);
          }
        }, 1500);
        
        return () => clearTimeout(verifyTimer);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [testVerificationCode]);

  // This useEffect monitors when all 6 digits have been entered
  // and the code matches the test code, then auto-verifies
  useEffect(() => {
    const shouldAutoVerify = 
      testVerificationCode && 
      verificationCode === testVerificationCode &&
      verificationCode.length === 6 && 
      !isSubmitting && 
      !autoVerifyTriggered;
      
    if (shouldAutoVerify) {
      console.log("Test code fully entered and matches:", verificationCode);
      console.log("Auto-verification will trigger shortly");
      
      setAutoVerifyTriggered(true);
      
      // Small delay to show the completed code before verification
      const timer = setTimeout(() => {
        console.log("Auto-verification now triggering after delay");
        handleVerifyCode(verificationCode);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [verificationCode, testVerificationCode, isSubmitting]);

  const handleVerifyCode = async (code = verificationCode) => {
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit code from your email");
      return;
    }

    // Rate limiting - prevent too frequent verification attempts
    if (lastAttemptTime && (Date.now() - lastAttemptTime < 2000)) {
      toast.error("Please wait a moment before trying again");
      return;
    }
    
    console.log("Attempting to verify code:", code, "for email:", userEmail);
    setIsSubmitting(true);
    setVerificationError("");
    setLastAttemptTime(Date.now());
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        body: {
          email: userEmail,
          code: code
        }
      });
      
      console.log("Verification response:", { data, error });
      
      if (error || !data.success) {
        let errorMessage = "Invalid verification code";
        
        if (error?.message?.includes("expired") || data?.reason === "expired") {
          errorMessage = "Verification code has expired";
          toast.error("Verification code expired", {
            description: "Please request a new code"
          });
        } else if (attemptCount >= 3) {
          errorMessage = "Too many invalid attempts";
          toast.error("Too many invalid attempts", {
            description: "Please request a new code"
          });
        } else {
          toast.error("Invalid verification code", {
            description: "Please check and try again"
          });
        }
        
        console.error("Verification failed:", errorMessage, { data, error });
        setVerificationError(errorMessage);
        setAttemptCount(prev => prev + 1);
        setIsSubmitting(false);
        return;
      }
      
      console.log("Email verification successful!");
      toast.success("Email verified!", {
        description: "Your account is now ready to use.",
      });
      onVerificationSuccess();
      
    } catch (error: any) {
      console.error("Verification request failed:", error);
      setVerificationError(error.message || "Verification failed");
      toast.error("Verification failed", {
        description: error.message || "Please try again"
      });
      setAttemptCount(prev => prev + 1);
      setIsSubmitting(false);
    }
  };

  return {
    verificationCode,
    setVerificationCode,
    isSubmitting,
    verificationError,
    attemptCount,
    handleVerifyCode
  };
};
