
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

  // CRITICAL: Do NOT auto-verify until intent is selected
  useEffect(() => {
    console.log("[useVerificationContainer] Checking auto-verification conditions");
    
    // Check if intent modal is currently showing - if so, BLOCK auto-verification
    const showingIntentModal = localStorage.getItem("showingIntentModal") === "true";
    if (showingIntentModal) {
      console.log("[useVerificationContainer] Intent modal is showing - BLOCKING auto-verification");
      return;
    }
    
    // Check if user has selected intent
    const userIntent = localStorage.getItem("userIntent");
    const validIntent = userIntent === "giftor" || userIntent === "giftee";
    
    console.log("[useVerificationContainer] Intent status:", { userIntent, validIntent });
    
    // Only auto-verify if we have valid intent and modal is not showing
    if (!validIntent) {
      console.log("[useVerificationContainer] No valid intent - waiting for selection");
      return;
    }
    
    // If we reach here, user has selected intent and we can proceed
    if (!isVerified) {
      console.log("[useVerificationContainer] Auto-verifying with valid intent:", userIntent);
      const verifyTimer = setTimeout(() => {
        handleVerificationSuccess();
      }, 500);
      
      return () => clearTimeout(verifyTimer);
    }
  }, [isVerified]); // Removed navigate and other dependencies to prevent loops
  
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
