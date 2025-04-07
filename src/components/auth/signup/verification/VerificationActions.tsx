
import React from "react";
import { useResendVerification } from "./hooks/useResendVerification";
import VerificationActionButtons from "./components/VerificationActionButtons";

interface VerificationActionsProps {
  isLoading: boolean;
  verificationChecking: boolean;
  onResendVerification: () => Promise<{ success: boolean; rateLimited?: boolean }>;
  onCheckVerification: () => void;
  resendCount?: number;
}

const VerificationActions = ({
  isLoading,
  verificationChecking,
  onResendVerification,
  onCheckVerification,
  resendCount = 0
}: VerificationActionsProps) => {
  const {
    isResending,
    handleResendVerification
  } = useResendVerification({ onResendVerification });

  return (
    <VerificationActionButtons
      isLoading={isLoading}
      verificationChecking={verificationChecking}
      isResending={isResending}
      onResendVerification={handleResendVerification}
      onCheckVerification={onCheckVerification}
      resendCount={resendCount}
    />
  );
};

export default VerificationActions;
