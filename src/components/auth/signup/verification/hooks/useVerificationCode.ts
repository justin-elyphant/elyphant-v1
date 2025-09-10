
import { useState } from "react";

export const useVerificationCode = () => {
  const [verificationCode, setVerificationCode] = useState("");
  const [effectiveVerificationCode, setEffectiveVerificationCode] = useState("");
  
  const handleVerificationCodeChange = (code: string) => {
    setVerificationCode(code);
  };
  
  const setTestVerificationCode = (code: string | null) => {
    if (code) {
      setEffectiveVerificationCode(code);
    }
  };
  
  return {
    verificationCode,
    setVerificationCode: handleVerificationCodeChange,
    effectiveVerificationCode,
    setTestVerificationCode
  };
};
