
import { useState, useEffect } from "react";

export const useVerificationCode = (testVerificationCode: string | null | undefined) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [effectiveVerificationCode, setEffectiveVerificationCode] = useState(testVerificationCode || "");
  
  // Update effective code when test code changes
  useEffect(() => {
    if (testVerificationCode) {
      setEffectiveVerificationCode(testVerificationCode);
    }
  }, [testVerificationCode]);
  
  return {
    verificationCode,
    setVerificationCode,
    effectiveVerificationCode
  };
};
