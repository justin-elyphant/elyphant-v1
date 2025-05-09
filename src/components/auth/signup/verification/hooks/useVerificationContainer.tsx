
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
  bypassVerification = false
}: UseVerificationContainerProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [effectiveVerificationCode, setEffectiveVerificationCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verificationChecking, setVerificationChecking] = useState(false);

  // Auto-bypass if requested by parent component - this enables the hybrid approach
  useEffect(() => {
    if (bypassVerification && !isVerified) {
      console.log("Hybrid verification mode active, auto-verifying...");
      handleVerificationSuccess();
      
      // Set a timeout to auto-redirect to profile setup
      const redirectTimer = setTimeout(() => {
        console.log("Auto-redirecting to profile setup");
        
        // Store verification state and data for reliability
        localStorage.setItem("emailVerified", "true");
        localStorage.setItem("verifiedEmail", userEmail);
        localStorage.setItem("userName", userName);
        
        // Navigate to profile setup
        navigate("/profile-setup", { replace: true });
      }, 2000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [bypassVerification, isVerified, navigate, userEmail, userName]);
  
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
  
  // Check if email is verified in Supabase
  const handleCheckVerification = async (): Promise<{ verified: boolean }> => {
    // If bypass is enabled, always return verified
    if (bypassVerification) {
      console.log("Hybrid verification mode active, returning verified=true");
      
      // Store bypass data for reliability
      localStorage.setItem("bypassVerification", "true");
      localStorage.setItem("emailVerified", "true");
      localStorage.setItem("verifiedEmail", userEmail);
      
      return { verified: true };
    }
    
    try {
      setIsLoading(true);
      
      // Check user session
      const { data: sessionData } = await supabase.auth.getSession();
      
      // If we have a session and a user, check if email is confirmed
      if (sessionData?.session?.user) {
        const user = sessionData.session.user;
        const emailConfirmed = user.email_confirmed_at != null;
        
        console.log("Email confirmation status:", emailConfirmed);
        
        if (emailConfirmed) {
          handleVerificationSuccess();
          return { verified: true };
        }
        
        // If not confirmed, refresh user data in case it was just confirmed
        const { data: refreshedUser, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error("Error refreshing session:", refreshError);
          return { verified: false };
        }
        
        if (refreshedUser?.user?.email_confirmed_at) {
          handleVerificationSuccess();
          return { verified: true };
        }
      }
      
      // If hybrid verification is enabled, auto-verify even if not confirmed in Supabase
      if (localStorage.getItem("bypassVerification") === "true") {
        console.log("Hybrid verification enabled, auto-verifying user");
        handleVerificationSuccess();
        return { verified: true };
      }
      
      return { verified: false };
    } catch (error) {
      console.error("Error checking verification:", error);
      return { verified: false };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle resending the verification
  const handleResendVerification = async (): Promise<{ success: boolean }> => {
    try {
      setIsLoading(true);
      
      console.log("Resending verification email to:", userEmail);
      
      // Use native Supabase method to resend verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });
      
      if (error) {
        console.error("Error resending verification:", error);
        
        // If we got a rate limit error, we'll bypass verification
        if (error.message?.includes("rate limit") || error.status === 429) {
          console.log("Rate limit detected in resend, continuing with hybrid flow");
          localStorage.setItem("signupRateLimited", "true");
          handleVerificationSuccess();
          
          toast.success("Verification email will be sent!", {
            description: "You can continue without waiting for verification."
          });
          
          return { success: true };
        }
        
        toast.error("Failed to resend verification email", {
          description: error.message || "Please try again later"
        });
        
        return { success: false };
      }
      
      toast.success("Verification email resent!", {
        description: "You can check it later - continue setting up your profile now."
      });
      
      // For hybrid flow - just mark as successful anyway
      if (bypassVerification) {
        handleVerificationSuccess();
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error in handleResendVerification:", error);
      toast.error("Failed to resend verification email", {
        description: "An unexpected error occurred"
      });
      return { success: false };
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
