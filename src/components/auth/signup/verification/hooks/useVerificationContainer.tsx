
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface UseVerificationContainerProps {
  userEmail: string;
  testVerificationCode?: string | null;
  bypassVerification?: boolean;
}

export const useVerificationContainer = ({ 
  userEmail, 
  testVerificationCode,
  bypassVerification = false
}: UseVerificationContainerProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [verificationChecking, setVerificationChecking] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [effectiveVerificationCode, setEffectiveVerificationCode] = useState<string>("");

  // When testVerificationCode changes, update our local state
  useEffect(() => {
    if (testVerificationCode) {
      console.log("Setting effective verification code:", testVerificationCode);
      setEffectiveVerificationCode(testVerificationCode);
    }
  }, [testVerificationCode]);

  // Auto-verification if bypass is enabled
  useEffect(() => {
    if (bypassVerification) {
      console.log("Bypass verification enabled, auto-verifying");
      handleVerificationSuccess();
    }
  }, [bypassVerification]);

  // Handle successful verification
  const handleVerificationSuccess = () => {
    setIsVerified(true);
    
    console.log("Verification successful, redirecting to profile setup");
    
    // Store user info in localStorage for profile setup
    localStorage.setItem("newSignUp", "true");
    localStorage.setItem("userEmail", userEmail);
    
    // Redirect to profile setup
    setTimeout(() => {
      navigate("/profile-setup", { replace: true });
    }, 100);
  };

  // Check if email is verified via Supabase
  const checkEmailVerification = async () => {
    try {
      setVerificationChecking(true);
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking session:", error);
        toast.error("Error checking verification status");
        setVerificationChecking(false);
        return { verified: false };
      }
      
      if (data?.session?.user?.email_confirmed_at) {
        console.log("Email confirmed at:", data.session.user.email_confirmed_at);
        setIsVerified(true);
        toast.success("Email verified successfully!");
        
        // Redirect to profile setup
        setTimeout(() => {
          navigate("/profile-setup", { replace: true });
        }, 500);
        
        return { verified: true };
      } else {
        console.log("Email not yet confirmed");
        toast.error("Email not yet verified. Please check your inbox or enter the verification code.");
        return { verified: false };
      }
    } catch (error) {
      console.error("Error in verification check:", error);
      return { verified: false };
    } finally {
      setVerificationChecking(false);
    }
  };

  return {
    isLoading,
    verificationChecking,
    isVerified,
    verificationCode,
    effectiveVerificationCode,
    handleVerificationSuccess,
    setVerificationCode,
    checkEmailVerification
  };
};
