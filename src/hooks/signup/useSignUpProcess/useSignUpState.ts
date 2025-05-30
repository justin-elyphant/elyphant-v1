
import { useState } from "react";

export const useSignUpState = () => {
  const [step, setStep] = useState<"signup" | "verification">("signup");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [resendCount, setResendCount] = useState<number>(0);
  const [testVerificationCode, setTestVerificationCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bypassVerification, setBypassVerification] = useState<boolean>(false);

  return {
    step,
    setStep,
    userEmail,
    setUserEmail,
    userName,
    setUserName,
    emailSent,
    setEmailSent,
    resendCount,
    setResendCount,
    testVerificationCode,
    setTestVerificationCode,
    isSubmitting,
    setIsSubmitting,
    bypassVerification,
    setBypassVerification
  };
};
