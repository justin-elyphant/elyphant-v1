
import { useState } from "react";
import { toast } from "sonner";

interface UseVerificationContainerProps {
  userEmail: string;
  testVerificationCode?: string | null;
}

export const useVerificationContainer = ({ 
  userEmail 
}: UseVerificationContainerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  // Simpler success handler - no navigation here to prevent conflicts
  const handleVerificationSuccess = () => {
    console.log("useVerificationContainer: Verification success for", userEmail);
    setIsVerified(true);
    
    // Just set the localStorage flags but don't navigate
    localStorage.setItem("newSignUp", "true");
    localStorage.setItem("userEmail", userEmail);
    
    toast.success("Account created successfully!");
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
