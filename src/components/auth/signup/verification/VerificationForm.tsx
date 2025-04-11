
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

  // AUTO-SKIP: Immediately trigger verification success
  useEffect(() => {
    console.log("AUTO-SKIP: Completely bypassing email verification");
    // Use a small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      console.log("Immediately triggering verification success");
      onVerificationSuccess();
    }, 500);
    return () => clearTimeout(timer);
  }, [onVerificationSuccess]);

  return (
    <div className="flex flex-col items-center justify-center">
      <Alert className="bg-amber-50 border-amber-200 mb-4">
        <Info className="h-4 w-4 text-amber-500 mr-2" />
        <AlertDescription className="text-amber-700">
          <span className="font-semibold">Testing mode active:</span> Verification is being bypassed. You will be redirected to profile setup automatically.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default VerificationForm;
