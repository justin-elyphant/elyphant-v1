
import React from "react";
import { useVerificationCode } from "./hooks/useVerificationCode";
import VerificationCodeInput from "./components/VerificationCodeInput";
import VerificationButton from "./components/VerificationButton";

interface VerificationFormProps {
  userEmail: string;
  onVerificationSuccess: () => void;
  testVerificationCode?: string | null;
}

const VerificationForm: React.FC<VerificationFormProps> = ({ 
  userEmail, 
  onVerificationSuccess, 
  testVerificationCode 
}) => {
  const {
    verificationCode,
    setVerificationCode,
    isSubmitting,
    verificationError,
    attemptCount,
    handleVerifyCode
  } = useVerificationCode({
    userEmail,
    onVerificationSuccess,
    testVerificationCode
  });

  return (
    <div className="flex flex-col items-center justify-center">
      <p className="text-sm text-gray-600 mb-4">
        Enter the 6-digit verification code sent to your email:
      </p>
      
      <VerificationCodeInput
        value={verificationCode}
        onChange={setVerificationCode}
        error={verificationError}
        disabled={isSubmitting}
      />
      
      {verificationError && (
        <p className="text-sm font-medium text-destructive mb-4">{verificationError}</p>
      )}
      
      {attemptCount >= 3 && !isSubmitting && (
        <p className="text-sm text-amber-600 mb-4">
          Too many attempts. Consider requesting a new code.
        </p>
      )}
      
      <VerificationButton
        onClick={() => handleVerifyCode()}
        disabled={verificationCode.length !== 6 || isSubmitting}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default VerificationForm;
