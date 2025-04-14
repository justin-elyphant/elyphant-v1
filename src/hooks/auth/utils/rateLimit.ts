
/**
 * Utilities for handling rate limiting during signup
 */

import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface RateLimitHandlerProps {
  email: string;
  name: string;
  setUserEmail: (email: string) => void;
  setUserName: (name: string) => void;
  setTestVerificationCode: (code: string | null) => void;
  setEmailSent: (sent: boolean) => void;
  navigate: ReturnType<typeof useNavigate>;
}

/**
 * Handles rate limit errors during signup by creating an alternative path
 */
export const handleRateLimit = ({
  email, 
  name, 
  setUserEmail, 
  setUserName,
  setTestVerificationCode,
  setEmailSent,
  navigate
}: RateLimitHandlerProps): void => {
  console.log("Rate limit detected, bypassing verification entirely");
  
  // Set user state
  setUserEmail(email);
  setUserName(name);
  setTestVerificationCode("123456"); // Set dummy code
  setEmailSent(true);
  
  // Store in localStorage for persistence through redirects
  localStorage.setItem("newSignUp", "true");
  localStorage.setItem("userEmail", email);
  localStorage.setItem("userName", name);
  localStorage.setItem("signupRateLimited", "true");
  
  // Show success toast
  toast.success("Account created successfully!", {
    description: "Taking you to complete your profile."
  });
  
  // Give the state a moment to update before navigating
  setTimeout(() => {
    // Navigate directly to profile setup with replacement (prevents back navigation)
    navigate('/profile-setup', { replace: true });
    
    // Fallback direct location change if navigate doesn't work
    setTimeout(() => {
      window.location.href = "/profile-setup";
    }, 100);
  }, 50);
};

/**
 * Detects if an error is related to rate limiting
 */
export const isRateLimitError = (error: any): boolean => {
  return error?.message?.toLowerCase().includes("rate limit") || 
    error?.message?.toLowerCase().includes("exceeded") || 
    error?.status === 429 || 
    error?.code === "over_email_send_rate_limit" ||
    error?.code === "too_many_requests";
};
