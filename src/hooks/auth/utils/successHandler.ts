
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
  console.log("🔄 COMPLETING BYPASS: Skipping all verification and going directly to profile setup");
  
  // Set application state
  setUserEmail(email);
  setUserName(name);
  setTestVerificationCode("123456"); // Set dummy verification code
  setEmailSent(true);
  
  // Set localStorage flags for new user journey
  localStorage.setItem("newSignUp", "true");
  localStorage.setItem("userEmail", email);
  localStorage.setItem("userName", name);
  
  // Show success toast for better user feedback
  toast.success("Account created successfully!", {
    description: "Taking you to complete your profile."
  });
  
  // Give state time to update before navigation
  setTimeout(() => {
    // Navigate to streamlined signup flow for profile completion
    navigate('/signup?intent=complete-profile', { replace: true });
    
    // Fallback direct location change if navigate doesn't work
    setTimeout(() => {
      window.location.href = "/signup?intent=complete-profile";
    }, 100);
  }, 50);
};
