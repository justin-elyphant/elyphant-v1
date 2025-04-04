
import React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Mail, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
      if (resendVerificationEmail) {
        await resendVerificationEmail();
        toast.success("Verification email resent!");
      }
    } catch (err) {
      console.error("Error resending verification:", err);
      toast.error("Failed to resend verification email");
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
        <CardDescription>
          We've sent a verification link to {userEmail}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="bg-blue-50 border-blue-200 mb-4">
          <Mail className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Verification Required</AlertTitle>
          <AlertDescription className="text-blue-700">
            Please check your inbox and click the verification link to continue.
          </AlertDescription>
        </Alert>
        
        <div className="text-center mt-4 mb-2">
          <p className="text-sm text-gray-600 mb-4">
            Didn't receive an email? Check your spam folder or click below to resend.
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
