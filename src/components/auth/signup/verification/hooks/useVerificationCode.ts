
import { useState } from "react";

export const useVerificationCode = () => {
  const [verificationCode, setVerificationCode] = useState("");
  
  return {
    verificationCode,
    setVerificationCode,
    effectiveVerificationCode: ""
  };
};
