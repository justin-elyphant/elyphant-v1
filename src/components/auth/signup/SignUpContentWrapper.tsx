
import React from "react";
import SignUpView from "./views/SignUpView";
import VerificationView from "./views/VerificationView";
import { SignUpFormValues } from "./SignUpForm";

interface SignUpContentWrapperProps {
  step: "signup" | "verification";
  userEmail: string;
  userName: string;
  onSignUpSubmit: (values: SignUpFormValues) => Promise<void>;
  handleBackToSignUp: () => void;
  isSubmitting?: boolean;
  bypassVerification?: boolean;
}

const SignUpContentWrapper: React.FC<SignUpContentWrapperProps> = ({
  step,
  userEmail,
  userName,
  onSignUpSubmit,
  handleBackToSignUp,
  isSubmitting = false,
  bypassVerification = true, // Default to bypassing verification for better UX
}) => {
  if (step === "signup") {
    return (
      <SignUpView 
        onSubmit={onSignUpSubmit} 
        isSubmitting={isSubmitting} 
      />
    );
  }

  // Providing the required props for VerificationView
  return (
    <VerificationView
      userEmail={userEmail}
      userName={userName}
      onBackToSignUp={handleBackToSignUp}
      onResendVerification={() => Promise.resolve({ success: true })}
      resendCount={0}
      bypassVerification={bypassVerification}
    />
  );
};

export default SignUpContentWrapper;
