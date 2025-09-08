
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface VerificationActionsProps {
  isLoading: boolean;
  verificationChecking: boolean;
  onResendVerification: () => Promise<any>;
  onCheckVerification: () => void;
  resendCount?: number;
}

const VerificationActions: React.FC<VerificationActionsProps> = ({
  isLoading,
  verificationChecking,
  onResendVerification,
  onCheckVerification,
  resendCount = 0
}) => {
  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <Button
          variant="outline"
          onClick={onResendVerification}
          disabled={isLoading || resendCount >= 3}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend verification email
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={onCheckVerification}
          disabled={isLoading || verificationChecking}
          className="flex-1"
        >
          {verificationChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "I've verified my email"
          )}
        </Button>
      </div>
    </div>
  );
};

export default VerificationActions;
