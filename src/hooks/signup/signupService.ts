
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { supabase } from "@/integrations/supabase/client";

// Improved helper to check for rate limit errors with more patterns
const isRateLimitError = (error: any): boolean => {
  if (!error) return false;
  
  return (
    error.status === 429 || 
    error.code === "too_many_requests" ||
    error.code === "over_email_send_rate_limit" ||
    (typeof error.message === 'string' && (
      error.message.toLowerCase().includes("rate limit") || 
      error.message.toLowerCase().includes("exceeded") ||
      error.message.toLowerCase().includes("too many")
    ))
  );
};

// Exponential backoff utility
const calculateBackoff = (attempt: number, baseMs: number = 1000, maxMs: number = 30000): number => {
  const backoff = Math.min(baseMs * Math.pow(2, attempt), maxMs);
  // Add some jitter to prevent thundering herd
  return backoff + (Math.random() * 500);
};

// Modified to use Supabase auth directly with email_confirm=true and rate limit handling
export const signUpUser = async (
  values: SignUpFormValues,
  invitedBy: string | null = null,
  senderUserId: string | null = null
) => {
  try {
    console.log(`Attempting signup for ${values.email}`);
    
    // Set a retry count for rate limit handling
    let retryCount = 0;
    const maxRetries = 2; // We'll try a couple times if we hit a rate limit
    
    while (retryCount <= maxRetries) {
      try {
        // If this is a retry, wait with exponential backoff
        if (retryCount > 0) {
          const delay = calculateBackoff(retryCount);
          console.log(`Rate limit encountered, waiting ${delay}ms before retry #${retryCount}`);
          await new Promise(r => setTimeout(r, delay));
        }
        
        // Try direct signup
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              name: values.name,
              invited_by: invitedBy,
              sender_user_id: senderUserId
            }
          }
        });
        
        if (signUpError) {
          // Check specifically for rate limit errors
          if (isRateLimitError(signUpError)) {
            console.log(`Rate limit encountered during sign-up attempt ${retryCount + 1}:`, signUpError);
            
            if (retryCount < maxRetries) {
              retryCount++;
              continue; // Try again after the delay
            } else {
              // We've tried enough, propagate the rate limit error
              console.error("Rate limit persisted after multiple retries, giving up");
              throw signUpError;
            }
          }
          
          // If signup failed with "already registered" error, try to get user details
          if (signUpError.message.includes("already registered")) {
            console.log("User already exists, trying direct sign-in");
            
            // Try signing in to check if credentials are valid
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: values.email,
              password: values.password
            });
            
            if (signInError) {
              if (signInError.message.includes("Invalid login credentials")) {
                console.log("Invalid credentials for existing user");
                return {
                  success: false, 
                  code: "invalid_credentials",
                  error: "Email exists but password is incorrect"
                };
              }
              throw signInError;
            }
            
            console.log("Signed in existing user successfully");
            return {
              success: true,
              user: signInData.user,
              session: signInData.session
            };
          }
          
          // For other errors, throw them to be handled by the caller
          throw signUpError;
        }
        
        console.log("User signed up successfully:", signUpData);
        
        // Auto sign-in the user after creation
        if (signUpData.user) {
          console.log("Auto signing in the user");
          
          // Use a separate retry for sign-in
          let signInRetries = 0;
          const maxSignInRetries = 2;
          
          while (signInRetries <= maxSignInRetries) {
            try {
              const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password
              });
              
              if (signInError) {
                // Only retry rate limit errors
                if (isRateLimitError(signInError) && signInRetries < maxSignInRetries) {
                  const delay = calculateBackoff(signInRetries);
                  console.log(`Rate limit on sign-in, waiting ${delay}ms before retry`);
                  await new Promise(r => setTimeout(r, delay));
                  signInRetries++;
                  continue;
                }
                
                console.error("Error signing in:", signInError);
                throw signInError;
              }
              
              console.log("User signed in successfully after creation:", data);
              
              // Force a session refresh to make sure auth state is updated
              const { error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) {
                console.error("Error refreshing session:", refreshError);
              } else {
                console.log("Session refreshed successfully");
              }
              
              break; // Break out of sign-in retry loop
            } catch (signInAttemptError) {
              if (isRateLimitError(signInAttemptError) && signInRetries < maxSignInRetries) {
                signInRetries++;
                continue;
              }
              throw signInAttemptError;
            }
          }
        }
        
        return {
          success: true,
          user: signUpData.user
        };
        
      } catch (attemptError: any) {
        // Special handling for rate limits only
        if (isRateLimitError(attemptError)) {
          if (retryCount < maxRetries) {
            retryCount++;
            continue; // Try again after the delay in the next loop iteration
          }
        }
        
        // For non-rate limit errors or if we've exhausted retries
        throw attemptError;
      }
    }
    
    // If we somehow got here without returning or throwing
    throw new Error("Failed to sign up user after retries");
    
  } catch (error) {
    console.error("Error in signUpUser:", error);
    throw error;
  }
};

// Export the other services
export { 
  sendVerificationEmail,
  updateUserProfile,
  createConnection,
  resendDefaultVerification
} from './services';
