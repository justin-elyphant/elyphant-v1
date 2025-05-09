
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
  bypassVerification = true // Phase 5: Default to true
}: UseVerificationContainerProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [effectiveVerificationCode, setEffectiveVerificationCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verificationChecking, setVerificationChecking] = useState(false);

  // Phase 5: Enhanced auto-bypass - will always automatically verify and redirect
  useEffect(() => {
    console.log("Phase 5 - Auto verification mode active");
    
    // Set a short delay for UX so users see the success screen briefly
    const verifyTimer = setTimeout(() => {
      if (!isVerified) {
        handleVerificationSuccess();
      }
    }, 800);
    
    // Set redirect timer slightly longer than verification timer
    const redirectTimer = setTimeout(() => {
      console.log("Auto-redirecting to profile setup");
      
      // Store verification state and data for reliability
      localStorage.setItem("emailVerified", "true");
      localStorage.setItem("verifiedEmail", userEmail);
      localStorage.setItem("userName", userName);
      
      // Navigate to profile setup
      navigate("/profile-setup", { replace: true });
    }, 1500);
    
    return () => {
      clearTimeout(verifyTimer);
      clearTimeout(redirectTimer);
    };
  }, [navigate, userEmail, userName]);
  
  // Handle successful verification
  const handleVerificationSuccess = () => {
    setIsVerified(true);
    
    // Store the verification state in localStorage
    localStorage.setItem("emailVerified", "true");
    localStorage.setItem("verifiedEmail", userEmail);
    localStorage.setItem("userName", userName);
    localStorage.removeItem("pendingVerificationEmail");
    localStorage.removeItem("pendingVerificationName");
    
    // Show success toast
    toast.success("Account created successfully!", {
      description: "Taking you to complete your profile."
    });
    
    console.log("Verification successful, proceeding with profile setup");
  };
  
  // Check if email is verified in Supabase - for Phase 5, always returns verified
  const handleCheckVerification = async (): Promise<{ verified: boolean }> => {
    // Phase 5: Always return verified=true
    console.log("Phase 5 verification mode active, returning verified=true");
    
    // Store bypass data for reliability
    localStorage.setItem("bypassVerification", "true");
    localStorage.setItem("emailVerified", "true");
    localStorage.setItem("verifiedEmail", userEmail);
    
    // Still send actual verification email in background for email collection
    try {
      // Call verify in background but don't wait for result
      supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      }).then(({ error }) => {
        if (error) console.error("Background verification email error:", error);
      });
    } catch (error) {
      console.error("Error in background verification:", error);
    }
    
    // Mark as verified and return true regardless of actual verification status
    handleVerificationSuccess();
    return { verified: true };
  };
  
  // Handle resending the verification - Phase 5: always succeeds
  const handleResendVerification = async (): Promise<{ success: boolean }> => {
    try {
      setIsLoading(true);
      
      console.log("Phase 5 - Resending verification email to:", userEmail);
      
      // Use native Supabase method to resend verification email in background
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });
      
      if (error) {
        console.error("Error in background verification:", error);
        // Continue with verification bypass regardless of error
      }
      
      toast.success("Account created successfully!", {
        description: "Taking you to complete your profile."
      });
      
      // Always mark as successful for Phase 5
      handleVerificationSuccess();
      
      return { success: true };
    } catch (error) {
      console.error("Error in handleResendVerification:", error);
      
      // Still return success and bypass verification for Phase 5
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
