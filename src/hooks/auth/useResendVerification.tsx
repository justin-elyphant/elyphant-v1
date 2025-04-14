
import { useState, useRef } from "react";
import { toast } from "sonner";
import { sendVerificationEmail } from "@/hooks/signup/signupService";
import { extractVerificationCode } from "@/hooks/signup/services/email/utils/responseParser";

interface UseResendVerificationProps {
  userEmail: string;
  userName: string;
  setTestVerificationCode?: (code: string | null) => void;
}

export const useResendVerification = ({
  userEmail,
  userName,
  setTestVerificationCode = () => {}  // Provide default empty function
}: UseResendVerificationProps) => {
  const [resendCount, setResendCount] = useState<number>(0);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);
  const cooldownTimeRef = useRef<number>(30000); // 30 seconds cooldown

  const handleResendVerification = async () => {
    // Check for rate limiting
    if (lastResendTime && (Date.now() - lastResendTime < cooldownTimeRef.current)) {
      const remainingCooldown = Math.ceil((cooldownTimeRef.current - (Date.now() - lastResendTime)) / 1000);
      
      toast.error(`Please wait before requesting another code`, {
        description: `You can request a new code in ${remainingCooldown} seconds.`,
      });
      
      return { success: false, rateLimited: true };
    }
    
    // Increase cooldown time with each request
    if (resendCount > 0) {
      cooldownTimeRef.current = Math.min(cooldownTimeRef.current * 2, 300000); // Max 5 minutes
    }
    
    try {
      console.log(`Resending verification to ${userEmail}`);
      const currentOrigin = window.location.origin;
      
      const result = await sendVerificationEmail(userEmail, userName, currentOrigin);
      
      console.log("Resend verification result:", result);
      
      if (!result.success) {
        if (result.rateLimited) {
          toast.error("Too many verification attempts", {
            description: "Please wait a few minutes before trying again."
          });
          return { success: false, rateLimited: true };
        }
        
        toast.error("Failed to resend verification email", {
          description: "Please try again later."
        });
        return { success: false };
      }
      
      // Extract and handle the verification code
      const verificationCode = extractVerificationCode(result);
      if (verificationCode && setTestVerificationCode) {
        console.log("Test code in resend:", verificationCode);
        setTestVerificationCode(verificationCode);
        
        toast.info("Test verification code", {
          description: `Your verification code is: ${verificationCode}`,
          duration: 10000
        });
      }
      
      setResendCount(prev => prev + 1);
      setLastResendTime(Date.now());
      
      toast.success("Verification email resent", {
        description: "Please check your inbox and spam folder.",
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error resending verification:", error);
      
      toast.error("Failed to resend verification email", {
        description: "An unexpected error occurred. Please try again.",
      });
      
      return { success: false };
    }
  };

  return {
    resendCount,
    lastResendTime,
    handleResendVerification,
  };
};
