
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Mail, AlertCircle, RefreshCw } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const { resendVerificationEmail } = useAuth();

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast.error("No email address available");
      return;
    }
    
    try {
      setIsLoading(true);
      // Use our custom email function
      const verificationUrl = `${window.location.origin}/dashboard?email=${encodeURIComponent(userEmail)}`;
      
      await supabase.functions.invoke('send-verification-email', {
        body: {
          email: userEmail,
          name: "",
          verificationUrl: verificationUrl
        }
      });
      
      toast.success("Verification email sent! Please check your inbox", {
        description: "If you don't see it, please check your spam folder."
      });
    } catch (err) {
      console.error("Error resending verification:", err);
      toast.error("Failed to send verification email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🐘</span>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome to Elyphant!</CardTitle>
            <CardDescription className="text-base">
              We've sent a verification link to {userEmail}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-purple-50 border-purple-200">
          <Mail className="h-4 w-4 text-purple-600" />
          <AlertTitle className="text-purple-800 font-medium">Verification Required</AlertTitle>
          <AlertDescription className="text-purple-700">
            Please check your inbox and click the verification link to continue.
            If you don't see the email, check your spam folder.
          </AlertDescription>
        </Alert>
        
        <div className="text-center mt-6 mb-2">
          <p className="text-sm text-gray-600 mb-4">
            Didn't receive an email? Click below to resend.
          </p>
          <Button 
            variant="outline" 
            onClick={handleResendVerification}
            className="mx-auto transition-all hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Resend Verification Email"
            )}
          </Button>
        </div>
        
        <Alert className="bg-amber-50 border-amber-200 mt-6">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Important Note</AlertTitle>
          <AlertDescription className="text-amber-700">
            After verifying your email, you'll be automatically redirected to your Elyphant dashboard.
          </AlertDescription>
        </Alert>
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
