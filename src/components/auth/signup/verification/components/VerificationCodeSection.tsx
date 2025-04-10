
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import VerificationForm from "../VerificationForm";

interface VerificationCodeSectionProps {
  userEmail: string;
  isVerified: boolean;
  effectiveVerificationCode: string | null;
  onVerificationSuccess: () => void;
}

const VerificationCodeSection: React.FC<VerificationCodeSectionProps> = ({
  userEmail,
  isVerified,
  effectiveVerificationCode,
  onVerificationSuccess
}) => {
  if (isVerified) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <AlertDescription className="text-green-700">
          Your email has been verified successfully! Redirecting to profile setup...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Alert className="bg-amber-50 border-amber-200 mb-4">
        <Info className="h-4 w-4 text-amber-500 mr-2" />
        <AlertDescription className="text-amber-700">
          <span className="font-semibold">Testing mode active:</span> Email verification will be bypassed automatically.
        </AlertDescription>
      </Alert>
      
      {effectiveVerificationCode && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-500 mr-2" />
          <AlertDescription className="text-blue-700">
            <span className="font-semibold">Test account detected!</span> Your verification code is:{' '}
            <code className="bg-blue-100 px-2 py-0.5 rounded font-mono">
              {effectiveVerificationCode}
            </code>
          </AlertDescription>
        </Alert>
      )}
      
      <VerificationForm 
        userEmail={userEmail}
        onVerificationSuccess={onVerificationSuccess}
        testVerificationCode={effectiveVerificationCode}
      />
    </>
  );
};

export default VerificationCodeSection;
