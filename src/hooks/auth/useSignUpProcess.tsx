
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignUpSubmit } from "./useSignUpSubmit";

export function useSignUpProcess() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"signup" | "verification">("signup");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const { onSignUpSubmit: originalOnSignUpSubmit, isSubmitting } = useSignUpSubmit();

  const handleSignUpSubmit = async (values: any) => {
    try {
      await originalOnSignUpSubmit(values);
      setUserEmail(values.email);
      setUserName(values.name);
      setStep("verification");
    } catch (error) {
      console.error("Sign up process error:", error);
      throw error;
    }
  };

  const handleBackToSignUp = () => {
    setStep("signup");
  };

  return {
    step,
    userEmail,
    userName,
    onSignUpSubmit: handleSignUpSubmit,
    handleBackToSignUp,
    isSubmitting,
  };
}
