
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const verificationSchema = z.object({
  code: z.string().length(6, { message: "Verification code must be 6 digits" }),
});

type VerificationValues = z.infer<typeof verificationSchema>;

interface VerificationFormProps {
  userEmail: string;
  onVerificationSuccess: () => void;
}

const VerificationForm = ({ userEmail, onVerificationSuccess }: VerificationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter the 6-digit code from your email");
      return;
    }

    console.log("Attempting to verify code:", verificationCode);
    setIsSubmitting(true);
    setVerificationError("");
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        body: {
          email: userEmail,
          code: verificationCode
        }
      });
      
      if (error || !data.success) {
        setVerificationError(error?.message || "Invalid verification code");
        toast.error("Invalid verification code", {
          description: "Please check and try again"
        });
        return;
      }
      
      toast.success("Email verified!", {
        description: "Your account is now ready to use.",
      });
      onVerificationSuccess();
      
    } catch (error: any) {
      setVerificationError(error.message || "Verification failed");
      toast.error("Verification failed", {
        description: error.message || "Please try again"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <p className="text-sm text-gray-600 mb-4">
        Enter the 6-digit verification code sent to your email:
      </p>
      
      <div className="mb-4">
        <InputOTP 
          maxLength={6} 
          value={verificationCode} 
          onChange={setVerificationCode}
          disabled={isSubmitting}
          render={({ slots }) => (
            <InputOTPGroup className="gap-2">
              {slots.map((slot, index) => (
                <React.Fragment key={index}>
                  <InputOTPSlot
                    className="rounded-md border-gray-300 focus:border-purple-400 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                    index={index}
                  >
                    {slot.char}
                  </InputOTPSlot>
                </React.Fragment>
              ))}
            </InputOTPGroup>
          )}
        />
      </div>
      
      {verificationError && (
        <p className="text-sm font-medium text-destructive mb-4">{verificationError}</p>
      )}
      
      <Button 
        onClick={handleVerifyCode}
        disabled={verificationCode.length !== 6 || isSubmitting}
        className="bg-purple-600 hover:bg-purple-700 text-white mb-4"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Verify Code
          </>
        )}
      </Button>
    </div>
  );
};

export default VerificationForm;
