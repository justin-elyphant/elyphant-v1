
/**
 * Utilities for handling successful signup
 */

import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SuccessHandlerProps {
  email: string;
  name: string;
  setUserEmail: (email: string) => void;
  setUserName: (name: string) => void;
  setTestVerificationCode: (code: string | null) => void;
  setEmailSent: (sent: boolean) => void;
  navigate: ReturnType<typeof useNavigate>;
}

/**
 * Handles successful signup by setting state and redirecting
 */
export const handleSignupSuccess = ({
  email,
  name,
  setUserEmail,
  setUserName,
  setTestVerificationCode,
  setEmailSent,
  navigate
}: SuccessHandlerProps): void => {
  setUserEmail(email);
  setUserName(name);
  
  // ULTRA BYPASS MODE: Always skip email verification
  console.log("🔄 COMPLETING BYPASS: Skipping all verification and going directly to profile setup");
  
  // Set a dummy verification code
  setTestVerificationCode("123456");
  
  // Set localStorage flags for new user journey
  localStorage.setItem("newSignUp", "true");
  localStorage.setItem("userEmail", email);
  localStorage.setItem("userName", name);
  
  // Show success toast for better user feedback
  toast.success("Account created successfully!", {
    description: "Taking you to complete your profile."
  });
  
  setEmailSent(true);
  
  // Navigate directly to profile setup
  navigate('/profile-setup', { replace: true });
};
