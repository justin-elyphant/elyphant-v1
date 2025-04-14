
import React from "react";
import SignUpView from "./views/SignUpView";
import VerificationView from "./views/VerificationView";

export interface SignUpFormValues {
  name: string;
  email: string;
  password: string;
  captcha: string;
}

interface SignUpContentWrapperProps {
  step: "signup" | "verification";
  userEmail: string;
  userName: string;
  resendCount: number;
  testVerificationCode: string | null;
  onSignUpSubmit: (values: SignUpFormValues) => Promise<void>;
  handleResendVerification: () => Promise<{ success: boolean; rateLimited?: boolean }>;
  handleBackToSignUp: () => void;
  isSubmitting?: boolean;
  bypassVerification?: boolean;
}

const SignUpContentWrapper: React.FC<SignUpContentWrapperProps> = ({
  step,
  userEmail,
  userName,
  resendCount,
  testVerificationCode,
  onSignUpSubmit,
  handleResendVerification,
  handleBackToSignUp,
  isSubmitting = false,
  bypassVerification = false,
}) => {
  if (step === "signup") {
    return (
      <SignUpView 
        onSubmit={onSignUpSubmit} 
        isSubmitting={isSubmitting} 
      />
    );
  }

  return (
    <VerificationView
      userEmail={userEmail}
      userName={userName}
      onBackToSignUp={handleBackToSignUp}
      onResendVerification={handleResendVerification}
      resendCount={resendCount}
      testVerificationCode={testVerificationCode}
    />
  );
};

export default SignUpContentWrapper;
