
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useEmailVerification = (emailSent: boolean, userEmail: string | null) => {
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Memoized check verification function to avoid recreating it on each render
  const checkEmailVerification = useCallback(async () => {
    if (!userEmail) return { verified: false };
    
    setIsLoading(true);
    try {
      // Get the current session to check if the user is verified
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking verification status:", error);
        setIsLoading(false);
        return { verified: false };
      }
      
      // Check if the user's email is confirmed
      if (data?.session?.user?.email_confirmed_at) {
        // User is verified, update state
        setVerificationChecking(false);
        setIsVerified(true);
        setIsLoading(false);
        
        // Show success notification
        toast.success("Email verified successfully!");
        
        // Don't navigate here - we'll handle navigation in the parent component
        // This ensures we follow the correct flow
        
        return { verified: true };
      }
      
      setIsLoading(false);
      return { verified: false };
    } catch (err) {
      console.error("Error checking verification status:", err);
      setIsLoading(false);
      return { verified: false };
    }
  }, [userEmail]);

  // Effect to check verification status automatically
  useEffect(() => {
    let interval: number | undefined;
    
    if (emailSent && userEmail && !isVerified) {
      setVerificationChecking(true);
      
      // Check immediately
      checkEmailVerification();
      
      // Then check every 5 seconds
      interval = window.setInterval(() => {
        checkEmailVerification();
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emailSent, userEmail, isVerified, checkEmailVerification]);
  
  // Handle manual verification check with loading state
  const handleManualCheck = async () => {
    setIsLoading(true);
    const result = await checkEmailVerification();
    setIsLoading(false);
    return result;
  };

  return {
    verificationChecking,
    isVerified,
    isLoading,
    checkEmailVerification: handleManualCheck
  };
};
