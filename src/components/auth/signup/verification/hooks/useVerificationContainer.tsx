
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useVerificationStatus } from "./useVerificationStatus";

interface UseVerificationContainerProps {
  userEmail: string;
  testVerificationCode?: string | null;
}

export const useVerificationContainer = ({ 
  userEmail, 
  testVerificationCode 
}: UseVerificationContainerProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [localCode, setLocalCode] = useState<string | null>(null);
  
  const {
    verificationChecking,
    isVerified,
    setIsVerified,
    checkEmailVerification
  } = useVerificationStatus({ userEmail });
  
  // Use either the prop code or the locally stored code
  const effectiveVerificationCode = testVerificationCode || localCode;

  // Enhanced logging for debugging with full state details
  useEffect(() => {
    console.log("VerificationContainer: Full state details", {
      userEmail,
      testVerificationCode,
      localCode,
      effectiveVerificationCode,
      isLoading,
      verificationChecking,
      isVerified
    });
  }, [userEmail, testVerificationCode, localCode, effectiveVerificationCode, isLoading, verificationChecking, isVerified]);

  // If we receive a testVerificationCode prop, update our local state
  useEffect(() => {
    if (testVerificationCode && testVerificationCode !== localCode) {
      console.log("VerificationContainer: Updating local code from props:", testVerificationCode);
      setLocalCode(testVerificationCode);
      
      // Show toast when new code is received
      toast.info("Test verification code received", {
        description: `Code: ${testVerificationCode}`,
        duration: 10000
      });
    }
  }, [testVerificationCode, localCode]);

  const handleVerificationSuccess = () => {
    setIsVerified(true);
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  // Function to manually set the verification code (for testing)
  const setVerificationCode = (code: string) => {
    console.log("Manually setting verification code:", code);
    setLocalCode(code);
    toast.info("Verification code set manually", {
      description: `Code: ${code}`,
      duration: 5000
    });
  };

  return {
    isLoading,
    setIsLoading,
    verificationChecking,
    isVerified,
    effectiveVerificationCode,
    handleVerificationSuccess,
    setVerificationCode,
    checkEmailVerification
  };
};
