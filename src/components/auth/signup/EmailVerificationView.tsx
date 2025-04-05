
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Import our components
import VerificationHeader from "./email-verification/VerificationHeader";
import VerificationAlert from "./email-verification/VerificationAlert";
import VerificationStatus from "./email-verification/VerificationStatus";
import VerificationActions from "./email-verification/VerificationActions";
import TroubleshootingGuide from "./email-verification/TroubleshootingGuide";
import ImportantNoteAlert from "./email-verification/ImportantNoteAlert";

interface EmailVerificationViewProps {
  userEmail: string | null;
  verificationChecking?: boolean;
  onCheckVerification?: () => Promise<{ verified: boolean }>;
  isVerified?: boolean;
}

const EmailVerificationView = ({ 
  userEmail, 
  verificationChecking = false,
  onCheckVerification,
  isVerified = false
}: EmailVerificationViewProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // If verification is confirmed, redirect to dashboard
  if (isVerified) {
    navigate('/dashboard', { replace: true });
    return null;
  }
  
  // Function to check if the user's email has been verified
  const checkVerificationStatus = async () => {
    if (!userEmail) return;
    
    try {
      setIsLoading(true);
      
      if (onCheckVerification) {
        const result = await onCheckVerification();
        if (!result.verified) {
          toast.error("Your email is not yet verified. Please check your inbox and click the verification link.");
        }
      } else {
        // Default implementation if no callback provided
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (data?.session?.user?.email_confirmed_at) {
          toast.success("Your email has been verified!");
          navigate('/dashboard', { replace: true });
        } else {
          toast.error("Your email is not yet verified. Please check your inbox and click the verification link.");
        }
      }
    } catch (err) {
      console.error("Error checking verification status:", err);
      toast.error("Failed to check verification status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast.error("No email address available");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Try our custom email function first
      const currentOrigin = window.location.origin;
      console.log("Resending with origin:", currentOrigin);
      
      const response = await supabase.functions.invoke('send-verification-email', {
        body: {
          email: userEmail,
          name: "",
          verificationUrl: currentOrigin
        }
      });
      
      console.log("Resend email function response:", response);
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to send verification email");
      }
      
      toast.success("Verification email sent! Please check your inbox", {
        description: "If you don't see it, please check your spam folder."
      });
    } catch (err) {
      console.error("Error resending verification:", err);
      
      // Fall back to Supabase's default resend function
      try {
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: userEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          }
        });
        
        if (resendError) throw resendError;
        
        toast.success("Verification email sent using our backup system!", {
          description: "If you don't see it, please check your spam folder."
        });
      } catch (fallbackErr) {
        console.error("Fallback resend failed:", fallbackErr);
        toast.error("Failed to send verification email. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="space-y-1">
        <VerificationHeader userEmail={userEmail} />
      </CardHeader>
      <CardContent className="space-y-4">
        <VerificationAlert />
        
        <VerificationStatus verificationChecking={verificationChecking} />
        
        <VerificationActions 
          isLoading={isLoading}
          verificationChecking={verificationChecking}
          onResendVerification={handleResendVerification}
          onCheckVerification={checkVerificationStatus}
        />

        <Separator className="my-4" />
        
        <TroubleshootingGuide />
        
        <ImportantNoteAlert />
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-4 border-t pt-4">
        <div className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/sign-in" className="text-purple-600 hover:text-purple-800 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EmailVerificationView;
