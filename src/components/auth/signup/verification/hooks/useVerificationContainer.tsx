
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
      toast.info("Verification bypassed", {
        description: "Taking you to complete your profile",
        duration: 3000
      });
      
      // Mark as verified immediately
      setIsVerified(true);
      
      // Redirect to profile setup with minimal delay
      const timer = setTimeout(() => {
        console.log("Directly redirecting to profile setup");
        navigate("/profile-setup", { replace: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [userEmail, navigate, isVerified]);

  const handleVerificationSuccess = () => {
    setIsVerified(true);
    toast.success("Account created successfully!");
    
    // Redirect to profile setup
    setTimeout(() => {
      navigate("/profile-setup", { replace: true });
    }, 100);
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
