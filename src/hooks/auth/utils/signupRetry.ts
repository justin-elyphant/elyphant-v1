
/**
 * Utilities for handling signup retries
 */

import { supabase } from "@/integrations/supabase/client";
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { signUpUser } from "@/hooks/signup/signupService";

interface RetrySignupProps {
  values: SignUpFormValues;
  maxRetries: number;
}

/**
 * Attempts to sign up a user with retry logic for rate limits
 */
export const retrySignup = async ({ 
  values, 
  maxRetries = 1 
}: RetrySignupProps) => {
  let retryCount = 0;
  let error: any = null;
  let result = null;
  
  // Try signup with retry for rate limits
  while (retryCount <= maxRetries && !result) {
    try {
      // Call the signUpUser function
      result = await signUpUser(values, null, null);
      
      if (!result) {
        throw new Error("Unable to create account. Please try again.");
      }
      
      // Break out of loop on success
      break;
    } catch (err: any) {
      error = err;
      console.error(`Signup attempt ${retryCount + 1} failed:`, err);
      
      // Check specifically for rate limit errors
      if (err.message?.toLowerCase().includes("rate limit") || 
          err.message?.toLowerCase().includes("exceeded") || 
          err.status === 429 || 
          err.code === "too_many_requests" || 
          err.code === "over_email_send_rate_limit") {
        
        retryCount++;
        if (retryCount <= maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Rate limit detected, waiting ${delay}ms before retry`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }
      
      // For other errors, rethrow
      throw err;
    }
  }
  
  // If we still have an error and no result after retries
  if (!result && error) {
    throw error;
  }
  
  return { result, error };
};

/**
 * Handles specific result codes from signup attempts
 */
export const handleSignupResultCode = async (
  result: any, 
  values: SignUpFormValues
) => {
  if (result.code === "user_exists" || result.code === "invalid_credentials") {
    console.log("User exists issue detected:", result.code);
    
    if (result.code === "invalid_credentials") {
      throw new Error("Email exists but password is incorrect. Please try signing in instead.");
    }
    
    // Try to sign in with the provided credentials
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password
    });
    
    if (signInError) {
      console.error("Sign in failed for existing user:", signInError);
      throw new Error("Email exists but password is incorrect. Please try signing in instead.");
    }
    
    console.log("Signed in existing user successfully");
  }
  
  return result;
};
