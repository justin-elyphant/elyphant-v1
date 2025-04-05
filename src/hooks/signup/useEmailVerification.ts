
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useEmailVerification = (
  emailSent: boolean, 
  userEmail: string | null,
  externalIsVerified: boolean = false,
  setExternalIsVerified?: (value: boolean) => void
) => {
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(externalIsVerified);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Update internal state when external state changes
  useEffect(() => {
    setIsVerified(externalIsVerified);
  }, [externalIsVerified]);

  // Memoized check verification function to avoid recreating it on each render
  const checkEmailVerification = useCallback(async () => {
    if (!userEmail) return { verified: false };
    
    setIsLoading(true);
    setVerificationChecking(true);
    
    try {
      console.log("Checking email verification status for:", userEmail);
      
      // Get the current session to check if the user is verified
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking verification status:", error);
        setVerificationChecking(false);
        setIsLoading(false);
        return { verified: false };
      }
      
      // Check if the user's email is confirmed
      if (data?.session?.user?.email_confirmed_at) {
        console.log("Email is confirmed! Timestamp:", data.session.user.email_confirmed_at);
        
        // User is verified, update state
        setVerificationChecking(false);
        setIsVerified(true);
        
        // Also update external state if provided
        if (setExternalIsVerified) {
          setExternalIsVerified(true);
        }
        
        setIsLoading(false);
        
        // Show success notification
        toast.success("Email verified successfully!");
        
        // Return success
        return { verified: true };
      } else {
        console.log("Email is not confirmed yet");
      }
      
      setVerificationChecking(false);
      setIsLoading(false);
      return { verified: false };
    } catch (err) {
      console.error("Error checking verification status:", err);
      setVerificationChecking(false);
      setIsLoading(false);
      return { verified: false };
    }
  }, [userEmail, setExternalIsVerified]);

  // Verify with code function
  const verifyWithCode = useCallback(async (code: string) => {
    if (!userEmail || !code) return false;
    
    setIsLoading(true);
    
    try {
      console.log("Verifying email with code for:", userEmail);
      
      // Call the edge function to verify the code
      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        body: {
          email: userEmail,
          code: code
        }
      });
      
      if (error) {
        console.error("Error verifying code:", error);
        setIsLoading(false);
        return false;
      }
      
      if (data?.success) {
        console.log("Email verification successful!");
        
        // Update user session after verification
        await supabase.auth.refreshSession();
        
        // User is verified, update state
        setIsVerified(true);
        
        // Also update external state if provided
        if (setExternalIsVerified) {
          setExternalIsVerified(true);
        }
        
        setIsLoading(false);
        
        // Show success notification
        toast.success("Email verified successfully!");
        
        return true;
      } else {
        console.log("Code verification failed");
        toast.error("Invalid verification code");
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error("Error verifying code:", err);
      setIsLoading(false);
      return false;
    }
  }, [userEmail, setExternalIsVerified]);

  // Effect to check verification status automatically
  useEffect(() => {
    let interval: number | undefined;
    
    if (emailSent && userEmail && !isVerified) {
      console.log("Starting verification check interval for email:", userEmail);
      setVerificationChecking(true);
      
      // Check immediately
      checkEmailVerification();
      
      // Then check every 5 seconds
      interval = window.setInterval(() => {
        checkEmailVerification();
      }, 5000);
    }
    
    return () => {
      if (interval) {
        console.log("Clearing verification check interval");
        clearInterval(interval);
        setVerificationChecking(false);
      }
    };
  }, [emailSent, userEmail, isVerified, checkEmailVerification]);
  
  // Handle manual verification check with loading state
  const handleManualCheck = async (): Promise<{ verified: boolean }> => {
    setIsLoading(true);
    setVerificationChecking(true);
    const result = await checkEmailVerification();
    setVerificationChecking(false);
    setIsLoading(false);
    return result;
  };

  return {
    verificationChecking,
    isVerified,
    isLoading,
    checkEmailVerification: handleManualCheck,
    verifyWithCode
  };
};
