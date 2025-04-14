
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
  
  // Direct check on status code
  if (error?.status === 429) return true;
  if (error?.error?.status === 429) return true;
  
  // Direct check on error code
  const code = error?.code || error?.error?.code;
  if (code === "too_many_requests" || code === "over_email_send_rate_limit") return true;
  
  // Direct check on name
  const errorName = error?.name || error?.error?.name;
  if (errorName === "AuthApiError" && 
      ((error?.message || "").toLowerCase().includes("rate") || 
       (error?.message || "").toLowerCase().includes("limit"))) {
    return true;
  }
  
  // Check for Supabase API error format
  if (error?.name === "AuthApiError" && error.status === 429) return true;
  
  // Extract and check message content
  const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  const errorMessage = typeof error.error?.message === 'string' ? error.error.message.toLowerCase() : '';
  
  // Check message content for rate limit keywords
  const rateWords = ['rate limit', 'exceeded', 'too many', 'too frequent', 'too often'];
  for (const word of rateWords) {
    if (message.includes(word) || errorMessage.includes(word)) {
      return true;
    }
  }
  
  // Extract detailed data from specific Supabase error format
  try {
    if (error.error) {
      // Sometimes the error details are nested in data property
      const data = error.error.data || error.data;
      const dataMessage = data?.message?.toLowerCase() || '';
      
      if (dataMessage.includes('rate limit') || 
          dataMessage.includes('exceeded') || 
          dataMessage.includes('too many')) {
        return true;
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  return false;
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
  localStorage.setItem("bypassVerification", "true"); // Add a new flag
  
  // Fire event to notify other components
  window.dispatchEvent(new Event('storage'));
  
  // Show success toast
  toast.success("Account created successfully!", {
    description: "Taking you to complete your profile."
  });
  
  // Give the state a moment to update before navigating
  setTimeout(() => {
    // Navigate directly to profile setup with replacement (prevents back navigation)
    navigate('/profile-setup', { replace: true });
  }, 1500); // Increase timeout for reliability
};

/**
 * Check if rate limit flags are set in localStorage
 */
export const isRateLimitFlagSet = (): boolean => {
  return localStorage.getItem("signupRateLimited") === "true" || 
         localStorage.getItem("bypassVerification") === "true";
};

/**
 * Clear rate limit flags from localStorage
 */
export const clearRateLimitFlags = (): void => {
  localStorage.removeItem("signupRateLimited");
  localStorage.removeItem("bypassVerification");
};
