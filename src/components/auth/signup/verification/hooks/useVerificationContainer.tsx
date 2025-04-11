
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
  
  // Simple, direct auto-redirect
  useEffect(() => {
    if (userEmail && !isVerified) {
      console.log("useVerificationContainer: Auto-verifying user", userEmail);
      
      // Set flags in localStorage
      localStorage.setItem("newSignUp", "true");
      localStorage.setItem("userEmail", userEmail);
      
      // Mark as verified
      setIsVerified(true);
      
      // Show success notification
      toast.success("Account created successfully!", {
        description: "Taking you to complete your profile",
        duration: 3000
      });
      
      // Direct navigation to profile setup
      navigate("/profile-setup", { replace: true });
    }
  }, [userEmail, navigate, isVerified]);

  const handleVerificationSuccess = () => {
    setIsVerified(true);
    toast.success("Account created successfully!");
    
    // Set localStorage flags
    localStorage.setItem("newSignUp", "true");
    localStorage.setItem("userEmail", userEmail);
    
    // Navigate to profile setup
    navigate("/profile-setup", { replace: true });
  };

  // Function for API compatibility
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
