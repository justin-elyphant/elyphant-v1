
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UseVerificationContainerProps {
  userEmail: string;
  userName: string;
  testVerificationCode?: string | null;
  bypassVerification?: boolean;
}

export const useVerificationContainer = ({
  userEmail,
  userName,
  testVerificationCode,
  bypassVerification = false
}: UseVerificationContainerProps) => {
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verificationChecking, setVerificationChecking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [effectiveVerificationCode, setEffectiveVerificationCode] = useState<string>(testVerificationCode || "123456");

  // Auto-verify when bypassVerification is true
  useEffect(() => {
    if (bypassVerification) {
      console.log("Bypassing verification process and redirecting to profile setup");
      setIsVerified(true);
      
      // Store user info in localStorage
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("userName", userName);
      localStorage.setItem("newSignUp", "true");
      
      // Redirect to profile setup
      const timer = setTimeout(() => {
        navigate('/profile-setup', { replace: true });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [bypassVerification, userEmail, userName, navigate]);

  // Update effective verification code when testVerificationCode changes
  useEffect(() => {
    if (testVerificationCode) {
      setEffectiveVerificationCode(testVerificationCode);
    }
  }, [testVerificationCode]);

  // Handle verification success
  const handleVerificationSuccess = useCallback(() => {
    // Set state for UI feedback
    setIsVerified(true);
    
    // Store in localStorage for persistence
    localStorage.setItem("verificationComplete", "true");
    localStorage.setItem("userEmail", userEmail);
    localStorage.setItem("userName", userName);
    
    // Add small delay before navigating to give time for user to see success message
    setTimeout(() => {
      navigate('/profile-setup', { replace: true });
    }, 1500);
  }, [userEmail, userName, navigate]);

  // Handle checking verification
  const handleCheckVerification = useCallback(async () => {
    try {
      setVerificationChecking(true);
      console.log("Checking verification for:", userEmail);
      
      // In development/test environment, always accept the test code
      if (verificationCode === effectiveVerificationCode) {
        console.log("Verification successful with test code");
        setIsVerified(true);
        
        toast.success("Email verified successfully!", {
          description: "Taking you to complete your profile."
        });
        
        // Allow UI to update before navigation
        setTimeout(() => {
          handleVerificationSuccess();
        }, 1000);
        
        return { verified: true };
      }
      
      // For real verification attempt
      const { data, error } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: verificationCode,
        type: 'email',
      });
      
      if (error) {
        console.error("Verification error:", error);
        
        // Special case for rate limit errors
        if (error.message.includes("rate limit") || error.status === 429) {
          toast.error("Too many verification attempts", {
            description: "Please try again in a few minutes."
          });
        } else {
          toast.error("Verification failed", {
            description: error.message
          });
        }
        
        return { verified: false };
      }
      
      if (data?.user) {
        console.log("Verification successful:", data.user.id);
        setIsVerified(true);
        
        toast.success("Email verified successfully!", {
          description: "Taking you to complete your profile."
        });
        
        // Allow UI to update before navigation
        setTimeout(() => {
          handleVerificationSuccess();
        }, 1000);
        
        return { verified: true };
      }
      
      return { verified: false };
    } catch (err) {
      console.error("Verification check error:", err);
      
      toast.error("Verification check failed", {
        description: "Please try again or contact support."
      });
      
      return { verified: false };
    } finally {
      setVerificationChecking(false);
    }
  }, [userEmail, verificationCode, effectiveVerificationCode, handleVerificationSuccess]);

  // Handle resending verification
  const handleResendVerification = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Test environment always succeeds
      if (process.env.NODE_ENV !== 'production') {
        console.log("Resending verification (simulated in dev mode)");
        
        // Set a new test code for dev mode
        const newTestCode = Math.floor(100000 + Math.random() * 900000).toString();
        setEffectiveVerificationCode(newTestCode);
        
        toast.success("Verification code resent", {
          description: `New code: ${newTestCode}`,
        });
        
        return { success: true };
      }
      
      // Send real OTP (one-time password) email
      const { error } = await supabase.auth.resend({
        email: userEmail,
        type: 'signup',
      });
      
      if (error) {
        console.error("Error resending verification:", error);
        
        if (error.message.includes("rate limit") || error.status === 429) {
          toast.error("Resend limit reached", {
            description: "Please try again later."
          });
          return { success: false, rateLimited: true };
        }
        
        toast.error("Failed to resend verification", {
          description: error.message
        });
        
        return { success: false };
      }
      
      toast.success("Verification code resent", {
        description: "Please check your email for the new code."
      });
      
      return { success: true };
    } catch (err) {
      console.error("Error in resendVerification:", err);
      
      toast.error("Failed to resend verification", {
        description: "An unexpected error occurred."
      });
      
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [userEmail]);

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
