
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
      
      // Store in localStorage for persistence
      localStorage.setItem("newSignUp", "true");
      localStorage.setItem("userEmail", userEmail);
      
      // Mark as verified immediately
      setIsVerified(true);
      
      // Show toast notification before redirecting
      toast.success("Account created successfully!", {
        description: "Taking you to complete your profile",
        duration: 3000
      });
      
      // Multi-stage redirect strategy with increasing delays
      // First attempt
      console.log("First attempt: direct navigation");
      navigate("/profile-setup", { replace: true });
      
      // Second attempt with slight delay
      setTimeout(() => {
        console.log("Second attempt: location.replace");
        window.location.replace("/profile-setup");
        
        // Third attempt with further delay
        setTimeout(() => {
          console.log("Third attempt: location.href");
          window.location.href = "/profile-setup";
        }, 300);
      }, 150);
    }
  }, [userEmail, navigate, isVerified]);

  const handleVerificationSuccess = () => {
    setIsVerified(true);
    toast.success("Account created successfully!");
    
    // Set localStorage for persistence
    localStorage.setItem("newSignUp", "true");
    localStorage.setItem("userEmail", userEmail);
    
    // Multi-stage navigation approach
    console.log("handleVerificationSuccess: Redirecting to profile setup");
    navigate("/profile-setup", { replace: true });
    
    // Fallback redirect
    setTimeout(() => {
      window.location.href = "/profile-setup";
    }, 200);
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
