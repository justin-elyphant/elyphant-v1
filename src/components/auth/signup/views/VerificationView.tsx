
import React from "react";
import VerificationContainer from "@/components/auth/signup/verification/VerificationContainer";

interface VerificationViewProps {
  userEmail: string;
  userName: string;
  onBackToSignUp: () => void;
  onResendVerification: () => Promise<{ success: boolean; rateLimited?: boolean }>;
  resendCount: number;
  testVerificationCode?: string | null;
}

const VerificationView: React.FC<VerificationViewProps> = ({
  userEmail,
  userName,
  onBackToSignUp,
  onResendVerification,
  resendCount,
  testVerificationCode
}) => {
  return (
    <VerificationContainer
      userEmail={userEmail}
      userName={userName}
      onBackToSignUp={onBackToSignUp}
      onResendVerification={onResendVerification}
      resendCount={resendCount}
      testVerificationCode={testVerificationCode}
    />
  );
};

export default VerificationView;
