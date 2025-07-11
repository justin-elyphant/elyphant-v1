
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import VerificationCodeInput from "./components/VerificationCodeInput";

interface VerificationFormProps {
  userEmail?: string;
  onVerificationSuccess: () => void;
}

const VerificationForm: React.FC<VerificationFormProps> = ({
  userEmail,
  onVerificationSuccess
}) => {
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userEmail) {
      toast.error("No email address available");
      return;
    }
    
    if (!verificationCode || verificationCode.length < 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`Verifying code ${verificationCode} for ${userEmail}`);
      
      // Call the Supabase function to verify the code
      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        body: { 
          email: userEmail,
          code: verificationCode
        }
      });
      
      console.log("Verification response:", data);
      
      if (error) {
        console.error("Verification error:", error);
        toast.error("Verification failed", {
          description: error.message || "Please try again or request a new code"
        });
        return;
      }
      
      if (data?.verified) {
        toast.success("Email verified successfully!", {
          description: "Continuing to the next step..."
        });
        
        // Mark verification as successful and trigger the callback
        onVerificationSuccess();
        
        // Update profile completion state with verified email
        LocalStorageService.setProfileCompletionState({
          email: userEmail,
          step: 'profile'
        });
      } else {
        toast.error("Invalid verification code", {
          description: "Please check the code and try again"
        });
      }
    } catch (err) {
      console.error("Error during verification:", err);
      toast.error("Verification failed", {
        description: "An unexpected error occurred. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        <VerificationCodeInput
          value={verificationCode}
          onChange={setVerificationCode}
          disabled={isLoading}
        />
      </CardContent>
      
      <CardFooter>
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || verificationCode.length < 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Email"
          )}
        </Button>
      </CardFooter>
    </form>
  );
};

export default VerificationForm;
