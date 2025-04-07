
import React from "react";
import { CardContent } from "@/components/ui/card";
import VerificationStatus from "@/components/auth/signup/email-verification/VerificationStatus";
import VerificationAlert from "@/components/auth/signup/email-verification/VerificationAlert";
import VerificationCodeSection from "./VerificationCodeSection";
import VerificationActions from "../VerificationActions";
import TroubleshootingGuide from "@/components/auth/signup/email-verification/TroubleshootingGuide";
import ImportantNoteAlert from "@/components/auth/signup/email-verification/ImportantNoteAlert";
import CodeDebugSection from "./CodeDebugSection";

interface VerificationContentSectionProps {
  userEmail: string;
  verificationChecking: boolean;
  isVerified: boolean;
  isLoading: boolean;
  effectiveVerificationCode: string | null;
  resendCount: number;
  onVerificationSuccess: () => void;
  onResendVerification: () => Promise<{ success: boolean; rateLimited?: boolean }>;
  onCheckVerification: () => void;
  setVerificationCode: (code: string) => void;
}

const VerificationContentSection: React.FC<VerificationContentSectionProps> = ({
  userEmail,
  verificationChecking,
  isVerified,
  isLoading,
  effectiveVerificationCode,
  resendCount,
  onVerificationSuccess,
  onResendVerification,
  onCheckVerification,
  setVerificationCode
}) => {
  return (
    <CardContent className="space-y-4">
      <VerificationStatus verificationChecking={verificationChecking} />
      
      <VerificationAlert useCode={true} />
      
      <VerificationCodeSection 
        userEmail={userEmail}
        isVerified={isVerified}
        effectiveVerificationCode={effectiveVerificationCode}
        onVerificationSuccess={onVerificationSuccess}
      />
      
      {!isVerified && (
        <>
          <VerificationActions
            isLoading={isLoading}
            verificationChecking={verificationChecking}
            onResendVerification={onResendVerification}
            onCheckVerification={onCheckVerification}
            resendCount={resendCount}
          />
          
          <CodeDebugSection setVerificationCode={setVerificationCode} />
          
          <TroubleshootingGuide />
          <ImportantNoteAlert />
        </>
      )}
    </CardContent>
  );
};

export default VerificationContentSection;
