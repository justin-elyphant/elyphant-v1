
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface UseVerificationStatusProps {
  userEmail: string;
}

export const useVerificationStatus = ({ userEmail }: UseVerificationStatusProps) => {
  const navigate = useNavigate();
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const checkEmailVerification = async () => {
    try {
      setVerificationChecking(true);
      
      const { data, error } = await supabase.auth.getSession();
      console.log("Email verification check result:", { data, error });
      
      if (error) {
        toast.error("Failed to check verification status");
        return;
      }
      
      if (data?.session?.user?.email_confirmed_at) {
        setIsVerified(true);
        toast.success("Email verified!");
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
        return;
      }
      
      toast.error("Email not verified yet", {
        description: "Please enter the verification code sent to your email."
      });
    } catch (err) {
      console.error("Error during verification check:", err);
      toast.error("Failed to check verification status");
    } finally {
      setVerificationChecking(false);
    }
  };

  return {
    verificationChecking,
    isVerified,
    setIsVerified,
    checkEmailVerification
  };
};
