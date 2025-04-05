
import React, { useState, useEffect } from "react";
import { RefreshCw, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot,
  InputOTPSeparator
} from "@/components/ui/input-otp";
import { toast } from "sonner";

interface VerificationActionsProps {
  isLoading: boolean;
  verificationChecking: boolean;
  onResendVerification: () => void;
  onCheckVerification: () => void;
  onVerifyWithCode: (code: string) => Promise<boolean>;
  resendCount?: number;
}

const VerificationActions = ({
  isLoading,
  verificationChecking,
  onResendVerification,
  onCheckVerification,
  onVerifyWithCode,
  resendCount = 0
}: VerificationActionsProps) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  
  // For debugging
  useEffect(() => {
    console.log("Verification code state:", verificationCode);
  }, [verificationCode]);

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter the 6-digit code from your email");
      return;
    }

    console.log("Attempting to verify code:", verificationCode);
    setIsVerifyingCode(true);
    
    try {
      const success = await onVerifyWithCode(verificationCode);
      console.log("Verification result:", success);
      
      if (!success) {
        toast.error("Invalid verification code. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      toast.error("Failed to verify code. Please try again.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  return (
    <div className="text-center mt-6 mb-2">
      <p className="text-sm text-gray-600 mb-4">
        Enter the 6-digit verification code sent to your email:
      </p>
      
      <div className="flex flex-col items-center justify-center">
        <div className="mb-4">
          <InputOTP 
            maxLength={6} 
            value={verificationCode} 
            onChange={setVerificationCode}
            disabled={isVerifyingCode}
            render={({ slots }) => (
              <InputOTPGroup className="gap-2">
                {slots.map((slot, index) => (
                  <React.Fragment key={index}>
                    <InputOTPSlot className="rounded-md border-gray-300 focus:border-purple-400 focus:ring focus:ring-purple-200 focus:ring-opacity-50" index={index}>
                      {slot.char}
                    </InputOTPSlot>
                  </React.Fragment>
                ))}
              </InputOTPGroup>
            )}
          />
        </div>
        
        <Button 
          onClick={handleVerifyCode}
          disabled={verificationCode.length !== 6 || isVerifyingCode}
          className="bg-purple-600 hover:bg-purple-700 text-white mb-4"
        >
          {isVerifyingCode ? (
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
        
        <p className="text-sm text-gray-600 mb-4">
          Didn't receive a code? Click below to resend.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button 
            variant="outline" 
            onClick={onResendVerification}
            className="transition-all hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
            disabled={isLoading || verificationChecking || isVerifyingCode}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Resend Verification Code
                {resendCount > 0 && <span className="ml-1">({resendCount})</span>}
              </>
            )}
          </Button>
          
          <Button
            variant="secondary"
            onClick={onCheckVerification}
            className="mt-2 sm:mt-0"
            disabled={isLoading || verificationChecking || isVerifyingCode}
          >
            {verificationChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "I've Verified My Email Already"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerificationActions;
