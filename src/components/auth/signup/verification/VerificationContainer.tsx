
import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import VerificationHeader from "@/components/auth/signup/email-verification/VerificationHeader";
import VerificationContentSection from "./components/VerificationContentSection";
import { useVerificationContainer } from "./hooks/useVerificationContainer";
import { useResendVerification } from "./hooks/useResendVerification";

interface VerificationContainerProps {
  userEmail: string;
  userName: string;
  onBackToSignUp: () => void;
  onResendVerification: () => Promise<{ success: boolean; rateLimited?: boolean }>;
  resendCount: number;
  bypassVerification?: boolean;
}

const VerificationContainer: React.FC<VerificationContainerProps> = ({ 
  userEmail, 
  userName, 
  onBackToSignUp,
  onResendVerification,
  resendCount,
  bypassVerification = false
}: VerificationContainerProps) => {
  const {
    isLoading,
    verificationChecking,
    isVerified,
    effectiveVerificationCode,
    handleVerificationSuccess,
    setVerificationCode,
    handleCheckVerification
  } = useVerificationContainer({ 
    userEmail, 
    userName,
    bypassVerification 
  });
  
  const {
    isResending,
    handleResendVerification
  } = useResendVerification({ onResendVerification });

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
        
        <p className="text-base text-muted-foreground">
          We've sent a verification link to your email. Please check your inbox and enter the code below.
        </p>
      </CardHeader>
      
      <VerificationContentSection
        userEmail={userEmail}
        verificationChecking={verificationChecking}
        isVerified={isVerified}
        isLoading={isLoading || isResending}
        effectiveVerificationCode={effectiveVerificationCode}
        resendCount={resendCount}
        onVerificationSuccess={handleVerificationSuccess}
        onResendVerification={handleResendVerification}
        onCheckVerification={handleCheckVerification}
        setVerificationCode={setVerificationCode}
        bypassVerification={bypassVerification}
      />
    </Card>
  );
};

export default VerificationContainer;
