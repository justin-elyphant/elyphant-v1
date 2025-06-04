
import React, { useEffect } from "react";
import { CardContent } from "@/components/ui/card";
import VerificationForm from "@/components/auth/signup/verification/VerificationForm";
import VerificationCodeSection from "./VerificationCodeSection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, CheckCircle } from "lucide-react";
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
  bypassVerification = true
}: VerificationContentSectionProps) => {
  const [progress, setProgress] = React.useState(0);
  const [shouldShowProgress, setShouldShowProgress] = React.useState(false);

  // Show progress only after verification success
  useEffect(() => {
    if (isVerified) {
      console.log("[VerificationContentSection] Verification successful, showing progress");
      setShouldShowProgress(true);
      
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += 10;
        setProgress(Math.min(currentProgress, 100));
        
        if (currentProgress >= 100) {
          clearInterval(progressInterval);
        }
      }, 100);
      
      return () => clearInterval(progressInterval);
    }
  }, [isVerified]);

  return (
    <CardContent>
      {isVerified ? (
        <>
          <Alert variant="success" className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <span className="font-semibold">Account created successfully!</span> Please choose how you'd like to use Elyphant.
            </AlertDescription>
          </Alert>
          
          {shouldShowProgress && (
            <div className="my-6">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center mt-2 text-muted-foreground">
                Waiting for your selection...
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              <span className="font-semibold">Almost there!</span> We're setting up your account.
              You'll be able to choose your preferences in just a moment.
            </AlertDescription>
          </Alert>
          
          {/* Hide verification form during bypass mode */}
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
        </>
      )}
    </CardContent>
  );
};

export default VerificationContentSection;
