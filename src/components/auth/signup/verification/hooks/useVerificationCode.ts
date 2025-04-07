
import { useState, useEffect, useCallback } from "react";
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

  // Enhanced debugging with full props logging
  useEffect(() => {
    console.log("useVerificationCode: Full initialization state", {
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
  }, [userEmail, testVerificationCode, verificationCode, autoVerifyTriggered]);

  // Improved code for handling auto-filling and verification
  useEffect(() => {
    if (testVerificationCode && testVerificationCode.length === 6 && verificationCode !== testVerificationCode) {
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
        }, 1000);
        
        return () => clearTimeout(verifyTimer);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [testVerificationCode, isSubmitting, autoVerifyTriggered]);

  // Memoized handleVerifyCode function to prevent recreating it on renders
  const handleVerifyCode = useCallback(async (code = verificationCode) => {
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
      // Improved response handling with detailed logging
      const response = await supabase.functions.invoke('verify-email-code', {
        body: {
          email: userEmail,
          code: code
        }
      });
      
      // Enhanced logging for the full response
      console.log("Full verification response:", response);
      
      const { data, error } = response;
      
      if (error || !data?.success) {
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
  }, [verificationCode, userEmail, lastAttemptTime, attemptCount, onVerificationSuccess]);

  return {
    verificationCode,
    setVerificationCode,
    isSubmitting,
    verificationError,
    attemptCount,
    handleVerifyCode
  };
};
