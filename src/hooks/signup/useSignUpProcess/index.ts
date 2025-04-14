
import { useNavigate } from "react-router-dom";
import { useVerificationRedirect } from "@/hooks/auth/useVerificationRedirect";
import { useSignUpState } from "./useSignUpState";
import { useAutoRedirect } from "./useAutoRedirect";
import { createUserProfile } from "./useProfileCreation";
import { useSignUpSubmit } from "./useSignUpSubmit";
import type { SignUpFormValues, UseSignUpProcessReturn } from "./types";

export function useSignUpProcess(): UseSignUpProcessReturn {
  const navigate = useNavigate();
  const state = useSignUpState();
  
  // Check for URL parameters indicating verified status
  useVerificationRedirect(navigate, state.setUserEmail);
  
  // Setup auto-redirect when email is sent
  useAutoRedirect({
    emailSent: state.emailSent,
    step: state.step,
    userEmail: state.userEmail,
    userName: state.userName,
    bypassVerification: state.bypassVerification
  });
  
  // Handle signup form submission
  const { onSignUpSubmit } = useSignUpSubmit({
    setUserEmail: state.setUserEmail,
    setUserName: state.setUserName,
    setEmailSent: state.setEmailSent,
    setStep: state.setStep,
    setTestVerificationCode: state.setTestVerificationCode,
    setBypassVerification: state.setBypassVerification,
    setIsSubmitting: state.setIsSubmitting
  });

  const handleResendVerification = async () => {
    state.setResendCount((prev) => prev + 1);
    return { success: true };
  };

  const handleBackToSignUp = () => {
    state.setStep("signup");
  };

  return {
    step: state.step,
    userEmail: state.userEmail,
    userName: state.userName,
    emailSent: state.emailSent,
    resendCount: state.resendCount,
    testVerificationCode: state.testVerificationCode,
    onSignUpSubmit,
    handleResendVerification,
    handleBackToSignUp,
    isSubmitting: state.isSubmitting,
    bypassVerification: state.bypassVerification,
  };
}
