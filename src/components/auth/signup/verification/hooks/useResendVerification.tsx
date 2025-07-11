
import { useState } from "react";
import { toast } from "sonner";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

interface UseResendVerificationProps {
  onResendVerification: () => Promise<{ success: boolean; rateLimited?: boolean }>;
}

export const useResendVerification = ({ onResendVerification }: UseResendVerificationProps) => {
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  
  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      
      // Track resend attempts for rate limiting UX
      setResendCount(prev => prev + 1);
      
      const result = await onResendVerification();
      
      if (result.success) {
        if (result.rateLimited) {
          toast.info("You'll receive an email soon", {
            description: "We're processing your verification request"
          });
        } else {
          toast.success("Verification email sent!", {
            description: "Please check your inbox and spam folder"
          });
        }
      } else {
        toast.error("Failed to send verification email", {
          description: "Please try again in a few minutes"
        });
      }
      
      // Track resend attempts in context
      LocalStorageService.setNicoleContext({ 
        source: 'verification_resend',
        timestamp: new Date().toISOString(),
        previousActions: [`resend_attempt_${resendCount + 1}`]
      });
      
      return result;
    } catch (error) {
      console.error("Error in handleResendVerification:", error);
      toast.error("Failed to resend verification email");
      return { success: false };
    } finally {
      setIsResending(false);
    }
  };
  
  return {
    isResending,
    resendCount,
    handleResendVerification
  };
};
