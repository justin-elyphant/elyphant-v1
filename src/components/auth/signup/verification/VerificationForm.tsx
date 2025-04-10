
import React, { useEffect } from "react";
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
  // Enhanced logging to track testVerificationCode
  useEffect(() => {
    console.log("VerificationForm - Full props:", {
      userEmail,
      testVerificationCode: testVerificationCode || "none",
    });
  }, [userEmail, testVerificationCode]);
  
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

  // Auto-fill the code if we have a test verification code
  useEffect(() => {
    if (testVerificationCode && testVerificationCode.length === 6) {
      console.log("Auto-filling verification code:", testVerificationCode);
      setVerificationCode(testVerificationCode);
      
      // Auto-submit after a short delay
      const timer = setTimeout(() => {
        console.log("Auto-submitting verification after delay");
        handleVerifyCode();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [testVerificationCode, setVerificationCode, handleVerifyCode]);

  // TEMPORARY: Auto-verification for testing user journeys
  useEffect(() => {
    // Automatically trigger verification success to redirect to profile setup
    console.log("AUTO-VERIFICATION: Bypassing email verification for testing");
    const timer = setTimeout(() => {
      onVerificationSuccess();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onVerificationSuccess]);

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
