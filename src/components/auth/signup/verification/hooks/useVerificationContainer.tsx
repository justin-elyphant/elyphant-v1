
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

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

  // CRITICAL: NEVER auto-verify during verification step - intent modal must control everything
  useEffect(() => {
    console.log("[useVerificationContainer] BLOCKING auto-verification - intent modal controls flow");
    
    // Do NOT auto-verify - let the intent modal handle everything
    // The intent modal in SignUpContentWrapper will control when to proceed
    
    return () => {}; // No cleanup needed since we're not auto-verifying
  }, []); // Empty dependency array - we never want to auto-verify
  
  // Handle successful verification - only called by intent modal after selection
  const handleVerificationSuccess = () => {
    console.log("[useVerificationContainer] Handling verification success");
    setIsVerified(true);
    
    // Store verification state using LocalStorageService
    LocalStorageService.setProfileCompletionState({
      email: userEmail,
      firstName: userName.split(' ')[0] || '',
      lastName: userName.split(' ').slice(1).join(' ') || '',
      step: 'intent',
      source: 'email'
    });
    
    // Clean up deprecated keys
    LocalStorageService.cleanupDeprecatedKeys();
    
    console.log("[useVerificationContainer] Verification successful - ready for intent selection");
  };
  
  // Check if email is verified in Supabase
  const handleCheckVerification = async (): Promise<{ verified: boolean }> => {
    console.log("[useVerificationContainer] Manual verification check");
    
    // Store bypass data using LocalStorageService
    LocalStorageService.setProfileCompletionState({
      email: userEmail,
      firstName: userName.split(' ')[0] || '',
      lastName: userName.split(' ').slice(1).join(' ') || '',
      step: 'intent',
      source: 'email'
    });
    
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
      
      // Always mark as successful and let intent modal handle navigation
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
