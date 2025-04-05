
import React from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VerificationActionsProps {
  isLoading: boolean;
  verificationChecking: boolean;
  onResendVerification: () => void;
  onCheckVerification: () => void;
}

const VerificationActions = ({
  isLoading,
  verificationChecking,
  onResendVerification,
  onCheckVerification
}: VerificationActionsProps) => {
  return (
    <div className="text-center mt-6 mb-2">
      <p className="text-sm text-gray-600 mb-4">
        Didn't receive an email? Click below to resend.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Button 
          variant="outline" 
          onClick={onResendVerification}
          className="transition-all hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
          disabled={isLoading || verificationChecking}
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Resend Verification Email"
          )}
        </Button>
        
        <Button
          variant="secondary"
          onClick={onCheckVerification}
          className="mt-2 sm:mt-0"
          disabled={isLoading || verificationChecking}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "I've Verified My Email"
          )}
        </Button>
      </div>
    </div>
  );
};

export default VerificationActions;
