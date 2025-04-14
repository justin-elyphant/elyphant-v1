
import React, { useEffect } from "react";
import { CardContent } from "@/components/ui/card";
import VerificationForm from "@/components/auth/signup/verification/VerificationForm";
import VerificationCodeSection from "./VerificationCodeSection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VerificationContentSectionProps {
  userEmail: string;
  verificationChecking: boolean;
  isVerified: boolean;
  isLoading: boolean;
  effectiveVerificationCode: string;
  resendCount: number;
  onVerificationSuccess: () => void;
  onResendVerification: () => Promise<{ success: boolean; rateLimited?: boolean }>;
  onCheckVerification: () => Promise<{ verified: boolean }>;
  setVerificationCode: (code: string) => void;
  bypassVerification?: boolean;
}

const VerificationContentSection = ({
  userEmail,
  verificationChecking,
  isVerified,
  isLoading,
  effectiveVerificationCode,
  resendCount,
  onVerificationSuccess,
  onResendVerification,
  onCheckVerification,
  setVerificationCode,
  bypassVerification = false
}: VerificationContentSectionProps) => {
  const navigate = useNavigate();

  // Auto-redirect when bypass is enabled
  useEffect(() => {
    if (bypassVerification) {
      console.log("Verification content section: bypassing verification");
      // Trigger success callback
      onVerificationSuccess();
      
      // Navigate to profile setup with small delay
      const timer = setTimeout(() => {
        navigate('/profile-setup', { replace: true });
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [bypassVerification, onVerificationSuccess, navigate]);

  return (
    <CardContent>
      {bypassVerification && (
        <Alert variant="success" className="mb-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <span className="font-semibold">Simplified signup process activated!</span> Redirecting you to profile setup...
          </AlertDescription>
        </Alert>
      )}
      
      {isVerified ? (
        <VerificationForm 
          userEmail={userEmail} 
          onVerificationSuccess={onVerificationSuccess}
          testVerificationCode={effectiveVerificationCode}
        />
      ) : (
        <VerificationCodeSection
          userEmail={userEmail}
          isVerified={isVerified}
          isLoading={isLoading}
          verificationChecking={verificationChecking}
          effectiveVerificationCode={effectiveVerificationCode}
          resendCount={resendCount}
          onVerificationSuccess={onVerificationSuccess}
          onResendVerification={onResendVerification}
          onCheckVerification={onCheckVerification}
          setVerificationCode={setVerificationCode}
          bypassVerification={bypassVerification}
        />
      )}
    </CardContent>
  );
};

export default VerificationContentSection;
