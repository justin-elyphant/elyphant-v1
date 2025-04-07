
import { useState } from "react";
import { toast } from "sonner";

interface UseResendVerificationProps {
  onResendVerification: () => Promise<{ success: boolean; rateLimited?: boolean }>;
}

export const useResendVerification = ({ onResendVerification }: UseResendVerificationProps) => {
  const [isResending, setIsResending] = useState(false);
  
  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      const result = await onResendVerification();
      
      if (!result.success) {
        if (result.rateLimited) {
          toast.error("Please wait before requesting another code", {
            description: "Too many attempts. Try again in a minute."
          });
        } else {
          toast.error("Failed to resend verification code", {
            description: "Please try again later."
          });
        }
      }
    } finally {
      setIsResending(false);
    }
  };
  
  return {
    isResending,
    handleResendVerification
  };
};
