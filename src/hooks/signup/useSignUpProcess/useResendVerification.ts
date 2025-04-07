
import { useState } from "react";
import { toast } from "sonner";
import { sendVerificationEmail } from "@/hooks/signup/signupService";
import { extractVerificationCode } from "@/hooks/signup/services/email/utils/responseParser";

interface UseResendVerificationProps {
  userEmail: string;
  userName: string;
  setTestVerificationCode: (code: string | null) => void;
}

export const useResendVerification = ({
  userEmail,
  userName,
  setTestVerificationCode
}: UseResendVerificationProps) => {
  const [resendCount, setResendCount] = useState<number>(0);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);

  const handleResendVerification = async () => {
    try {
      // Rate limiting check (client-side enforcement)
      if (lastResendTime && Date.now() - lastResendTime < 60000) {
        toast.error("Please wait before requesting another code", {
          description: "You can request a new code once per minute."
        });
        return { success: false, rateLimited: true };
      }
      
      const currentOrigin = window.location.origin;
      console.log("Resending verification using origin:", currentOrigin);
      
      const result = await sendVerificationEmail(userEmail, userName, currentOrigin);
      
      console.log("Resend verification result:", result);
      
      if (!result.success) {
        if (result.rateLimited) {
          toast.error("Too many verification attempts", {
            description: "Please wait a few minutes before trying again."
          });
          return { success: false, rateLimited: true };
        }
        
        toast.error("Failed to resend verification code", {
          description: "Please try again later."
        });
        return { success: false };
      }
      
      // Extract and handle the verification code
      const code = extractVerificationCode(result);
      if (code) {
        console.log(`Test email resend detected, new code: ${code}`);
        setTestVerificationCode(code);
        
        // Show an immediate toast for the test email code
        toast.info("Test account detected", {
          description: `Your new verification code is: ${code}`,
          duration: 10000 // Show for 10 seconds
        });
      }
      
      setResendCount(prev => prev + 1);
      setLastResendTime(Date.now());
      toast.success("Verification code resent", {
        description: "Please check your email for the new code."
      });
      return { success: true };
    } catch (error) {
      console.error("Error resending verification:", error);
      toast.error("Failed to resend code");
      return { success: false };
    }
  };

  return {
    resendCount,
    lastResendTime,
    handleResendVerification
  };
};
