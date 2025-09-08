
import React, { useState } from "react";
import { Link } from "react-router-dom";
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
  const [resendAttempts, setResendAttempts] = useState(0);
  
  // If verification is confirmed, don't show this view
  if (isVerified) {
    return null;
  }
  
  // Function to check if the user's email has been verified
  const checkVerificationStatus = async () => {
    if (!userEmail) return;
    
    try {
      setIsLoading(true);
      
      if (onCheckVerification) {
        console.log("Manually checking verification status");
        const result = await onCheckVerification();
        
        if (result.verified) {
          console.log("Verification check successful");
          // The parent component will handle state updates and redirects
          toast.success("Your email has been verified! Continuing to profile setup...");
        } else {
          console.log("Verification check failed - not verified yet");
          toast.error("Your email is not yet verified. Please check your email and click the verification link.");
        }
      } else {
        // Default implementation if no callback provided
        console.log("Using default verification check");
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (data?.session?.user?.email_confirmed_at) {
          console.log("Default check found verification");
          toast.success("Your email has been verified!");
          
          // Force reload with verification parameters  
          window.location.href = `${window.location.origin}/auth?verified=true&email=${encodeURIComponent(userEmail)}`;
        } else {
          console.log("Default check - not verified yet");
          toast.error("Your email is not yet verified. Please check your email and click the verification link.");
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
      setResendAttempts(prev => prev + 1);
      
      // Use Supabase's built-in resend functionality
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error("Resend verification email error:", error);
        throw new Error(error.message || "Failed to send verification email");
      }
      
      toast.success("Verification email sent! Please check your inbox", {
        description: "Click the link in the email to verify your account."
      });
    } catch (err) {
      console.error("Error resending verification:", err);
      
      toast.error("Failed to send verification email. Please try again later.");
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
          resendCount={resendAttempts}
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
