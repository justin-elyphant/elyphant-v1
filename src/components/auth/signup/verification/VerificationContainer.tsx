
import React, { useState } from "react";
import { ArrowLeft, InfoCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import VerificationForm from "./VerificationForm";
import VerificationActions from "./VerificationActions";
import TroubleshootingGuide from "@/components/auth/signup/email-verification/TroubleshootingGuide";
import VerificationHeader from "@/components/auth/signup/email-verification/VerificationHeader";
import VerificationAlert from "@/components/auth/signup/email-verification/VerificationAlert";
import ImportantNoteAlert from "@/components/auth/signup/email-verification/ImportantNoteAlert";
import VerificationStatus from "@/components/auth/signup/email-verification/VerificationStatus";

interface VerificationContainerProps {
  userEmail: string;
  userName: string;
  onBackToSignUp: () => void;
  onResendVerification: () => Promise<{ success: boolean; rateLimited?: boolean }>;
  resendCount: number;
  testVerificationCode?: string | null;
}

const VerificationContainer = ({ 
  userEmail, 
  userName, 
  onBackToSignUp,
  onResendVerification,
  resendCount,
  testVerificationCode
}: VerificationContainerProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const checkEmailVerification = async () => {
    try {
      setVerificationChecking(true);
      
      const { data, error } = await supabase.auth.getSession();
      
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
      toast.error("Failed to check verification status");
    } finally {
      setVerificationChecking(false);
    }
  };

  const handleVerificationSuccess = () => {
    setIsVerified(true);
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <Button 
          variant="ghost" 
          className="mb-2 p-0 h-8 flex items-center hover:bg-transparent hover:text-purple-800" 
          onClick={onBackToSignUp}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to sign up
        </Button>
        
        <VerificationHeader userEmail={userEmail} />
        
        <CardDescription className="text-base">
          We've sent a verification code to your email. Please check your inbox and enter the code below.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <VerificationStatus verificationChecking={verificationChecking} />
        
        <VerificationAlert useCode={true} />
        
        {testVerificationCode && (
          <Alert className="bg-blue-50 border-blue-200">
            <InfoCircle className="h-4 w-4 text-blue-500 mr-2" />
            <AlertDescription className="text-blue-700">
              <span className="font-semibold">Test email detected!</span> Your verification code is:{' '}
              <code className="bg-blue-100 px-2 py-0.5 rounded font-mono">{testVerificationCode}</code>
            </AlertDescription>
          </Alert>
        )}
        
        {isVerified ? (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-700">
              Your email has been verified successfully! Redirecting to dashboard...
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <VerificationForm 
              userEmail={userEmail}
              onVerificationSuccess={handleVerificationSuccess}
              testVerificationCode={testVerificationCode}
            />
            
            <VerificationActions
              isLoading={isLoading}
              verificationChecking={verificationChecking}
              onResendVerification={onResendVerification}
              onCheckVerification={checkEmailVerification}
              resendCount={resendCount}
            />
            
            <TroubleshootingGuide />
            <ImportantNoteAlert />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VerificationContainer;
