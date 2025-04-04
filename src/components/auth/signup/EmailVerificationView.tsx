
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, AlertCircle, RefreshCw } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

interface EmailVerificationViewProps {
  userEmail: string | null;
}

const EmailVerificationView = ({ userEmail }: EmailVerificationViewProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Function to check if the user's email has been verified
  const checkVerificationStatus = async () => {
    if (!userEmail) return;
    
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (data?.session?.user?.email_confirmed_at) {
        toast.success("Your email has been verified!");
        navigate('/dashboard');
      } else {
        toast.error("Your email is not yet verified. Please check your inbox and click the verification link.");
      }
    } catch (err) {
      console.error("Error checking verification status:", err);
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast.error("No email address available");
      return;
    }
    
    try {
      setIsLoading(true);
      // Get the current origin for proper URL construction
      const currentOrigin = window.location.origin;
      const verificationUrl = `${currentOrigin}/dashboard?email=${encodeURIComponent(userEmail)}`;
      
      console.log("Resending verification email with URL:", verificationUrl);
      
      // Try our custom email function first
      const response = await supabase.functions.invoke('send-verification-email', {
        body: {
          email: userEmail,
          name: "",
          verificationUrl: verificationUrl
        }
      });
      
      console.log("Email function response:", response);
      
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
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleResendVerification}
              className="transition-all hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
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
            
            <Button
              variant="secondary"
              onClick={checkVerificationStatus}
              className="mt-2 sm:mt-0"
            >
              I've Verified My Email
            </Button>
          </div>
        </div>

        <Separator className="my-4" />
        
        <div className="text-sm text-center text-gray-600">
          <p className="mb-2">Having trouble?</p>
          <ul className="list-disc text-left ml-6 space-y-1">
            <li>Check your spam or junk folder</li>
            <li>Make sure your email address was entered correctly</li>
            <li>Try using a different browser if the verification link doesn't work</li>
          </ul>
        </div>
        
        <Alert className="bg-amber-50 border-amber-200 mt-6">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Important Note</AlertTitle>
          <AlertDescription className="text-amber-700">
            After verifying your email, you'll be automatically redirected to your Elyphant dashboard.
            If not, click the "I've Verified My Email" button above.
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
