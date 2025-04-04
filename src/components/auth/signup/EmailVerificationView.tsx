
import React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Mail, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface EmailVerificationViewProps {
  userEmail: string | null;
}

const EmailVerificationView = ({ userEmail }: EmailVerificationViewProps) => {
  const { resendVerificationEmail } = useAuth();

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast.error("No email address available");
      return;
    }
    
    try {
      // Use our custom email function instead
      const verificationUrl = `${window.location.origin}/dashboard?email=${encodeURIComponent(userEmail)}`;
      
      await supabase.functions.invoke('send-verification-email', {
        body: {
          email: userEmail,
          name: "",
          verificationUrl: verificationUrl
        }
      });
      
      toast.success("Verification email resent!");
    } catch (err) {
      console.error("Error resending verification:", err);
      toast.error("Failed to resend verification email");
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">🐘</span>
          <CardTitle className="text-2xl font-bold">Welcome to Elyphant!</CardTitle>
        </div>
        <CardDescription>
          We've sent a verification link to {userEmail}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="bg-purple-50 border-purple-200 mb-4">
          <Mail className="h-4 w-4 text-purple-600" />
          <AlertTitle className="text-purple-800">Verification Required</AlertTitle>
          <AlertDescription className="text-purple-700">
            Please check your inbox and click the verification link to continue.
            If you don't see the email, check your spam folder.
          </AlertDescription>
        </Alert>
        
        <div className="text-center mt-4 mb-2">
          <p className="text-sm text-gray-600 mb-4">
            Didn't receive an email? Click below to resend.
          </p>
          <Button 
            variant="outline" 
            onClick={handleResendVerification}
            className="mx-auto"
          >
            Resend Verification Email
          </Button>
        </div>
        
        <Alert className="bg-amber-50 border-amber-200 mt-6">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Important Note</AlertTitle>
          <AlertDescription className="text-amber-700">
            After verifying your email, please return to this site directly rather than following the redirect link.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/sign-in" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EmailVerificationView;
