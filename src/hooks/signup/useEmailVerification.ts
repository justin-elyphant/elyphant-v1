
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useEmailVerification = (emailSent: boolean, userEmail: string | null) => {
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  // Add effect to check verification status automatically every few seconds
  useEffect(() => {
    let interval: number | undefined;
    
    if (emailSent && userEmail && !isVerified) {
      setVerificationChecking(true);
      
      // Check immediately
      checkEmailVerification();
      
      // Then check every 5 seconds
      interval = window.setInterval(checkEmailVerification, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emailSent, userEmail, isVerified]);
  
  // Function to check email verification status
  const checkEmailVerification = async () => {
    if (!userEmail) return { verified: false };
    
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error checking verification status:", error);
        return { verified: false };
      }
      
      if (data?.session?.user?.email_confirmed_at) {
        // Clear interval if user is verified
        setVerificationChecking(false);
        setIsVerified(true);
        
        // Show success notification
        toast.success("Email verified successfully!");
        
        // Navigate to dashboard
        navigate('/dashboard', { replace: true });
        
        // Return success
        return { verified: true };
      }
      
      return { verified: false };
    } catch (err) {
      console.error("Error checking verification status:", err);
      return { verified: false };
    }
  };

  return {
    verificationChecking,
    isVerified,
    checkEmailVerification
  };
};
