
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface VerificationFormProps {
  userEmail: string;
  onVerificationSuccess: () => void;
  testVerificationCode?: string | null;
}

const VerificationForm = ({ userEmail, onVerificationSuccess, testVerificationCode }: VerificationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState<number | null>(null);

  // Effect to automatically enter test code in development or when provided
  useEffect(() => {
    if (testVerificationCode) {
      console.log("Auto-filling test verification code:", testVerificationCode);
      // Allow a moment for the component to mount
      const timer = setTimeout(() => {
        setVerificationCode(testVerificationCode);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      // Check if we're in development and using a test email
      const isTestEmail = userEmail.includes('justncmeeks') || 
                          userEmail.includes('test@example');
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                          window.location.hostname === 'localhost';
      
      if (isDevelopment && isTestEmail) {
        console.log("Auto-filling default test verification code in development environment");
        // Allow a moment for the component to mount
        const timer = setTimeout(() => {
          setVerificationCode("123456");
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [userEmail, testVerificationCode]);

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter the 6-digit code from your email");
      return;
    }

    // Rate limiting - prevent too frequent verification attempts
    if (lastAttemptTime && (Date.now() - lastAttemptTime < 2000)) {
      toast.error("Please wait a moment before trying again");
      return;
    }
    
    console.log("Attempting to verify code:", verificationCode, "for email:", userEmail);
    setIsSubmitting(true);
    setVerificationError("");
    setLastAttemptTime(Date.now());
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        body: {
          email: userEmail,
          code: verificationCode
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-verify when test code is entered
  useEffect(() => {
    const isCompleteCode = verificationCode.length === 6;
    const isTestCode = verificationCode === testVerificationCode;
    
    if (isCompleteCode && isTestCode && testVerificationCode) {
      console.log("Test code detected, auto-verifying");
      handleVerifyCode();
    }
  }, [verificationCode]);

  return (
    <div className="flex flex-col items-center justify-center">
      <p className="text-sm text-gray-600 mb-4">
        Enter the 6-digit verification code sent to your email:
      </p>
      
      <div className="mb-4">
        <InputOTP 
          maxLength={6} 
          value={verificationCode} 
          onChange={setVerificationCode}
          disabled={isSubmitting}
          render={({ slots }) => (
            <InputOTPGroup className="gap-2">
              {slots.map((slot, index) => (
                <React.Fragment key={index}>
                  <InputOTPSlot
                    className={`rounded-md border-gray-300 focus:border-purple-400 focus:ring focus:ring-purple-200 focus:ring-opacity-50 ${
                      verificationError ? "border-red-300" : ""
                    }`}
                    index={index}
                  >
                    {slot.char}
                  </InputOTPSlot>
                </React.Fragment>
              ))}
            </InputOTPGroup>
          )}
        />
      </div>
      
      {verificationError && (
        <p className="text-sm font-medium text-destructive mb-4">{verificationError}</p>
      )}
      
      {attemptCount >= 3 && !isSubmitting && (
        <p className="text-sm text-amber-600 mb-4">
          Too many attempts. Consider requesting a new code.
        </p>
      )}
      
      <Button 
        onClick={handleVerifyCode}
        disabled={verificationCode.length !== 6 || isSubmitting}
        className="bg-purple-600 hover:bg-purple-700 text-white mb-4"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Verify Code
          </>
        )}
      </Button>
    </div>
  );
};

export default VerificationForm;
