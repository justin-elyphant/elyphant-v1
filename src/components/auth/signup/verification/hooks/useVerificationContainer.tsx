
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UseVerificationContainerProps {
  userEmail: string;
  testVerificationCode?: string | null;
}

export const useVerificationContainer = ({ 
  userEmail 
}: UseVerificationContainerProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  // IMMEDIATE AUTO-REDIRECT: Skip all verification and go directly to profile setup
  useEffect(() => {
    if (userEmail && !isVerified) {
      console.log("AUTO-BYPASS: Skipping entire verification flow for", userEmail);
      
      // Mark as verified immediately
      setIsVerified(true);
      
      toast.info("Verification bypassed", {
        description: "Taking you to complete your profile",
        duration: 3000
      });
      
      // Redirect to profile setup with minimal delay
      navigate("/profile-setup", { replace: true });
    }
  }, [userEmail, navigate, isVerified]);

  const handleVerificationSuccess = () => {
    setIsVerified(true);
    toast.success("Account created successfully!");
    
    // Redirect to profile setup
    navigate("/profile-setup", { replace: true });
  };

  // Function to manually set the verification code (not needed anymore but kept for API compatibility)
  const setVerificationCode = (code: string) => {
    console.log("Code setting ignored in bypass mode:", code);
  };

  return {
    isLoading,
    setIsLoading,
    verificationChecking: false,
    isVerified,
    effectiveVerificationCode: "123456", // Dummy code, not used
    handleVerificationSuccess,
    setVerificationCode,
    checkEmailVerification: () => Promise.resolve({verified: true})
  };
};
