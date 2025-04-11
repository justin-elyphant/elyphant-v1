
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
  
  const effectiveVerificationCode = testVerificationCode || localCode || "123456"; // Default code for testing
  
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

  // AUTO-SKIP: Immediately auto-verify and redirect to profile setup
  useEffect(() => {
    if (userEmail && !isVerified) {
      console.log("AUTO-SKIP: Completely bypassing verification flow");
      toast.info("Verification bypassed for testing", {
        description: "You will be redirected to profile setup automatically.",
        duration: 3000
      });
      
      // Auto-verify immediately
      setIsVerified(true);
      
      // Redirect to profile setup after a very short delay
      const timer = setTimeout(() => {
        console.log("AUTO-SKIP: Directly redirecting to profile setup");
        navigate("/profile-setup", { replace: true });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [userEmail, navigate, setIsVerified, isVerified]);

  const handleVerificationSuccess = () => {
    setIsVerified(true);
    toast.success("Account created successfully! Setting up your profile...");
    
    // Redirect to profile setup instead of dashboard for new users
    setTimeout(() => {
      navigate("/profile-setup", { replace: true });
    }, 500);
  };

  // Function to manually set the verification code (for testing)
  const setVerificationCode = (code: string) => {
    console.log("Manually setting verification code:", code);
    setLocalCode(code);
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
