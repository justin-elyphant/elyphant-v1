
import React, { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VerificationActionsProps {
  isLoading: boolean;
  verificationChecking: boolean;
  onResendVerification: () => Promise<{ success: boolean; rateLimited?: boolean }>;
  onCheckVerification: () => void;
  resendCount?: number;
}

const VerificationActions = ({
  isLoading,
  verificationChecking,
  onResendVerification,
  onCheckVerification,
  resendCount = 0
}: VerificationActionsProps) => {
  const [isResending, setIsResending] = useState(false);
  
  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      const result = await onResendVerification();
      
      if (!result.success) {
        if (result.rateLimited) {
          toast.error("Please wait before requesting another code", {
            description: "Too many attempts. Try again in a minute."
          });
        } else {
          toast.error("Failed to resend verification code", {
            description: "Please try again later."
          });
        }
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
      <Button 
        variant="outline" 
        onClick={handleResendVerification}
        className="transition-all hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
        disabled={isLoading || verificationChecking || isResending}
      >
        {isResending ? (
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
        disabled={isLoading || verificationChecking || isResending}
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
  );
};

export default VerificationActions;
