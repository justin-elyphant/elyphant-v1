
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

interface VerificationViewProps {
  userEmail: string;
  userName: string;
  onBackToSignUp: () => void;
  onResendVerification: () => Promise<{ success: boolean; rateLimited?: boolean }>;
  resendCount: number;
  bypassVerification?: boolean;
}

const VerificationView: React.FC<VerificationViewProps> = ({
  userEmail,
  userName,
  onBackToSignUp,
  onResendVerification,
  resendCount,
  bypassVerification = false,
}) => {
  const [isResending, setIsResending] = React.useState(false);

  const handleResend = async () => {
    if (isResending) return;

    setIsResending(true);
    try {
      await onResendVerification();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-2">
          {bypassVerification ? (
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          ) : (
            <Mail className="w-12 h-12 text-primary" />
          )}
        </div>
        <CardTitle className="text-2xl text-center font-bold">
          {bypassVerification ? "Account Created!" : "Check Your Email"}
        </CardTitle>
        <CardDescription className="text-center">
          {bypassVerification 
            ? `Welcome, ${userName || "new user"}! Your account has been created.`
            : `We've sent a verification link to ${userEmail}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bypassVerification ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              You can continue to setup your profile now, or you can verify your email later.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription>
                Please check your inbox (including spam folder) for an email from us and click the 
                verification link.
              </AlertDescription>
            </Alert>
            
            {resendCount > 0 && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  We've sent {resendCount} verification email{resendCount > 1 ? "s" : ""}. 
                  If you still don't see it, try checking your spam folder.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        {bypassVerification ? (
          <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
            <Link to="/profile-setup">Continue to Profile Setup</Link>
          </Button>
        ) : (
          <Button 
            onClick={handleResend}
            disabled={isResending || resendCount >= 3}
            variant="outline" 
            className="w-full"
          >
            {isResending ? "Sending..." : "Resend Verification Email"}
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          className="w-full flex items-center justify-center"
          onClick={onBackToSignUp}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sign Up
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VerificationView;
