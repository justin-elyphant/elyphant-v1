
import React, { useEffect } from "react";
import { CardContent } from "@/components/ui/card";
import VerificationForm from "@/components/auth/signup/verification/VerificationForm";
import VerificationCodeSection from "./VerificationCodeSection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

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
  bypassVerification = true // Default to true
}: VerificationContentSectionProps) => {
  const navigate = useNavigate();
  const [progress, setProgress] = React.useState(0);

  // Enhanced auto-redirect with clear messaging about verification bypass
  useEffect(() => {
    console.log("Auto-verification and redirection initiated");
    let currentProgress = 0;
    
    // Show progress bar to indicate auto-verification
    const progressInterval = setInterval(() => {
      currentProgress += 8; // Faster progress increment
      setProgress(Math.min(currentProgress, 100));
      
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        
        // Trigger success callback
        onVerificationSuccess();
        
        // Navigate to profile setup with small delay
        setTimeout(() => {
          navigate('/profile-setup', { replace: true });
        }, 300);
      }
    }, 80);
    
    return () => clearInterval(progressInterval);
  }, [onVerificationSuccess, navigate]);

  return (
    <CardContent>
      <>
        <Alert variant="success" className="mb-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <span className="font-semibold">Account created successfully!</span> Setting up your profile...
          </AlertDescription>
        </Alert>
        
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <span className="font-semibold">Testing Mode:</span> Email verification is optional during testing.
            You'll be automatically redirected to complete your profile setup.
          </AlertDescription>
        </Alert>
        
        <div className="my-6">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-center mt-2 text-muted-foreground">
            Redirecting to profile setup...
          </p>
        </div>
      </>
      
      {/* Hide verification form in testing mode */}
      {isVerified ? null : (
        <div className="hidden">
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
        </div>
      )}
    </CardContent>
  );
};

export default VerificationContentSection;
