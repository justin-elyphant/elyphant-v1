
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import VerificationCodeInput from "../verification/components/VerificationCodeInput";

interface VerificationActionsProps {
  isLoading: boolean;
  verificationChecking: boolean;
  onResendVerification: () => Promise<any>;
  onCheckVerification: () => void;
  onVerifyWithCode?: (code: string) => Promise<boolean>;
  resendCount?: number;
}

const VerificationActions: React.FC<VerificationActionsProps> = ({
  isLoading,
  verificationChecking,
  onResendVerification,
  onCheckVerification,
  onVerifyWithCode,
  resendCount = 0
}) => {
  const [verificationCode, setVerificationCode] = React.useState("");

  const handleVerifyWithCode = async () => {
    if (!onVerifyWithCode || !verificationCode || verificationCode.length < 6) {
      return;
    }
    
    await onVerifyWithCode(verificationCode);
  };

  return (
    <div className="space-y-4 w-full">
      {onVerifyWithCode && (
        <div className="space-y-4">
          <VerificationCodeInput 
            value={verificationCode} 
            onChange={setVerificationCode} 
            maxLength={6}
            disabled={isLoading}
          />
          
          <Button 
            onClick={handleVerifyWithCode}
            disabled={isLoading || verificationCode.length < 6}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>
        </div>
      )}

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
              Resend email
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
            "I've confirmed my email"
          )}
        </Button>
      </div>
    </div>
  );
};

export default VerificationActions;
