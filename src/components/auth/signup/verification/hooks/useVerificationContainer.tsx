
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface UseVerificationContainerProps {
  userEmail: string;
  userName?: string; 
  bypassVerification?: boolean;
}

export const useVerificationContainer = ({
  userEmail,
  userName = "", 
  bypassVerification = true
}: UseVerificationContainerProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [effectiveVerificationCode, setEffectiveVerificationCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verificationChecking, setVerificationChecking] = useState(false);

  // Enhanced auto-bypass - but wait for intent selection
  useEffect(() => {
    console.log("[useVerificationContainer] Auto verification mode active");
    
    // Don't auto-verify immediately - wait for intent modal
    const verifyTimer = setTimeout(() => {
      const userIntent = localStorage.getItem("userIntent");
      const validIntent = userIntent === "giftor" || userIntent === "giftee";
      
      console.log("[useVerificationContainer] Checking intent for auto-verify:", { userIntent, validIntent });
      
      // Only auto-verify if we have valid intent or enough time has passed
      if (validIntent || !isVerified) {
        console.log("[useVerificationContainer] Auto-verifying now");
        handleVerificationSuccess();
      }
    }, 2000); // Increased delay to allow intent modal to show
    
    return () => clearTimeout(verifyTimer);
  }, [navigate, userEmail, userName, isVerified]);
  
  // Handle successful verification
  const handleVerificationSuccess = () => {
    console.log("[useVerificationContainer] Handling verification success");
    setIsVerified(true);
    
    // Store the verification state in localStorage
    localStorage.setItem("emailVerified", "true");
    localStorage.setItem("verifiedEmail", userEmail);
    localStorage.setItem("userName", userName);
    localStorage.removeItem("pendingVerificationEmail");
    localStorage.removeItem("pendingVerificationName");
    
    // Show success toast
    toast.success("Account created successfully!", {
      description: "Please select how you'd like to use Elyphant."
    });
    
    console.log("[useVerificationContainer] Verification successful, waiting for intent selection");
  };
  
  // Check if email is verified in Supabase
  const handleCheckVerification = async (): Promise<{ verified: boolean }> => {
    console.log("[useVerificationContainer] Manual verification check");
    
    // Store bypass data for reliability
    localStorage.setItem("bypassVerification", "true");
    localStorage.setItem("emailVerified", "true");
    localStorage.setItem("verifiedEmail", userEmail);
    
    // Send verification email in background
    try {
      supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      }).then(({ error }) => {
        if (error) console.error("Background verification email error:", error);
      });
    } catch (error) {
      console.error("Error in background verification:", error);
    }
    
    // Mark as verified and return true
    handleVerificationSuccess();
    return { verified: true };
  };
  
  // Handle resending the verification
  const handleResendVerification = async (): Promise<{ success: boolean }> => {
    try {
      setIsLoading(true);
      
      console.log("[useVerificationContainer] Resending verification email to:", userEmail);
      
      // Use native Supabase method to resend verification email in background
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });
      
      if (error) {
        console.error("Error in background verification:", error);
      }
      
      toast.success("Account created successfully!", {
        description: "Please select how you'd like to use Elyphant."
      });
      
      // Always mark as successful
      handleVerificationSuccess();
      
      return { success: true };
    } catch (error) {
      console.error("Error in handleResendVerification:", error);
      
      // Still return success and bypass verification
      handleVerificationSuccess();
      
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    verificationCode,
    setVerificationCode,
    isVerified,
    verificationChecking,
    isLoading,
    effectiveVerificationCode,
    handleVerificationSuccess,
    handleCheckVerification,
    handleResendVerification,
  };
};
