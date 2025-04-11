
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
  // Execute this effect immediately on render with highest priority
  useEffect(() => {
    if (userEmail && !isVerified) {
      console.log("COMPLETE BYPASS: Immediately skipping entire verification for", userEmail);
      
      // Mark as verified immediately
      setIsVerified(true);
      
      // Show toast notification before redirecting
      toast.success("Account created successfully!", {
        description: "Taking you to complete your profile",
        duration: 3000
      });
      
      // Direct immediate navigation without delay
      navigate("/profile-setup", { replace: true });

      // Fallback redirect in case the first one doesn't work
      setTimeout(() => {
        console.log("Executing fallback redirect to profile setup");
        window.location.href = "/profile-setup";
      }, 100);
    }
  }, [userEmail, navigate, isVerified]);

  const handleVerificationSuccess = () => {
    setIsVerified(true);
    toast.success("Account created successfully!");
    
    // Attempt both navigation methods for maximum reliability
    navigate("/profile-setup", { replace: true });
    setTimeout(() => {
      window.location.href = "/profile-setup";
    }, 50);
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
