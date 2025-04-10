
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVerificationCode } from "./hooks/useVerificationCode";
import VerificationCodeInput from "./components/VerificationCodeInput";
import VerificationButton from "./components/VerificationButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

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
  const navigate = useNavigate();
  
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
    }
  }, [testVerificationCode, setVerificationCode]);

  // AUTO-VERIFICATION: Automatically trigger verification success for testing
  useEffect(() => {
    console.log("AUTO-VERIFICATION: Bypassing email verification for testing");
    const timer = setTimeout(() => {
      onVerificationSuccess();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onVerificationSuccess]);

  return (
    <div className="flex flex-col items-center justify-center">
      <Alert className="bg-amber-50 border-amber-200 mb-4">
        <Info className="h-4 w-4 text-amber-500 mr-2" />
        <AlertDescription className="text-amber-700">
          <span className="font-semibold">Testing mode active:</span> You will be automatically redirected to profile setup in a moment.
        </AlertDescription>
      </Alert>
      
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
