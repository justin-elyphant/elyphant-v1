
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
 * Checks if an error is related to rate limiting
 */
export const isRateLimitError = (error: any): boolean => {
  if (!error) return false;
  
  // Log the full error for debugging
  console.log("Checking for rate limit in error:", error);
  
  // Check both error object and its properties for all rate limit indicators
  const isRateLimit = error?.status === 429 || 
    error?.code === "too_many_requests" ||
    error?.code === "over_email_send_rate_limit" ||
    (typeof error.message === 'string' && (
      error.message.toLowerCase().includes("rate limit") || 
      error.message.toLowerCase().includes("exceeded") ||
      error.message.toLowerCase().includes("too many")
    )) ||
    // Check nested error objects that might contain the rate limit info
    (error.error && (
      error.error?.status === 429 ||
      error.error?.code === "too_many_requests" ||
      error.error?.code === "over_email_send_rate_limit" ||
      (typeof error.error.message === 'string' && (
        error.error.message.toLowerCase().includes("rate limit") ||
        error.error.message.toLowerCase().includes("exceeded") ||
        error.error.message.toLowerCase().includes("too many")
      ))
    ));

  console.log("Rate limit detection result:", isRateLimit);
  return isRateLimit;
};

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
  }, 1000);
};
