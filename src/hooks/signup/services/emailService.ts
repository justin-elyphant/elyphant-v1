
import { supabase } from "@/integrations/supabase/client";

// Helper function to check if an error is related to rate limiting
function isRateLimitError(response: any): boolean {
  // Check status code
  if (response.error?.status === 429 || response.status === 429) {
    console.log("Rate limit detected by status code 429");
    return true;
  }
  
  // Check error message
  const errorMessage = response.error?.message || response.data?.error || '';
  if (
    errorMessage.toLowerCase().includes('rate') || 
    errorMessage.toLowerCase().includes('limit') ||
    errorMessage.toLowerCase().includes('too many')
  ) {
    console.log(`Rate limit detected by message text: "${errorMessage}"`);
    return true;
  }
  
  // Check explicit rate limited flag
  if (response.data?.rateLimited) {
    console.log("Rate limit detected by explicit rateLimited flag");
    return true;
  }
  
  return false;
}

export const sendVerificationEmail = async (email: string, name: string, verificationUrl: string) => {
  try {
    console.log("Sending verification email with base URL:", verificationUrl);
    
    // Make sure verification URL doesn't end with a slash
    const baseUrl = verificationUrl.endsWith('/') ? verificationUrl.slice(0, -1) : verificationUrl;
    
    // Handle potential rate-limiting with retries
    let retries = 0;
    const maxRetries = 2;
    let success = false;
    let emailResponse;
    
    while (retries <= maxRetries && !success) {
      if (retries > 0) {
        console.log(`Retrying email send (attempt ${retries + 1}/${maxRetries + 1})...`);
        // Add delay between retries
        await new Promise(resolve => setTimeout(resolve, retries * 1000));
      }
      
      // Check for test emails
      const isTestEmail = email.includes("justncmeeks") || 
                          email.includes("test@example");
                          
      if (isTestEmail) {
        console.log(`Using test email: ${email} - this should bypass the actual send`);
      }
      
      const requestBody = {
        email: email,
        name: name,
        verificationUrl: baseUrl,
        useVerificationCode: true
      };
      
      console.log(`Calling send-verification-email function with params:`, requestBody);
      
      try {
        // Call the Supabase edge function
        emailResponse = await supabase.functions.invoke('send-verification-email', {
          body: requestBody
        });
        
        // Log the raw response for debugging
        console.log(`Email function raw response:`, emailResponse);
        
        if (emailResponse.error) {
          console.error("Edge function error details:", {
            status: emailResponse.error.status,
            message: emailResponse.error.message,
            context: emailResponse.error.context,
            name: emailResponse.error.name,
            stack: emailResponse.error.stack
          });
        }
        
        if (!emailResponse.error) {
          success = true;
          break;
        }
      } catch (invocationError) {
        console.error("Function invocation error:", invocationError);
        emailResponse = { 
          error: {
            message: invocationError?.toString() || "Unknown error during function invocation",
            status: 500,
          }
        };
      }
      
      // If it's not a rate limit error, don't retry
      if (!isRateLimitError(emailResponse)) {
        console.log("Non-rate limit error detected, not retrying");
        break;
      }
      
      retries++;
    }
    
    if (emailResponse.error) {
      console.error("Email function error:", emailResponse.error);
      
      // Check for rate limiting from the error or data
      if (isRateLimitError(emailResponse)) {
        console.warn("Rate limit detected in response");
        return { success: false, error: emailResponse.error, rateLimited: true };
      }
      
      throw new Error(emailResponse.error.message || "Failed to send verification email");
    }
    
    // Check for test email and verification code in the response data
    console.log("Checking for test email verification code in response:", emailResponse.data);
    
    // For test emails, extract the verification code if it was returned
    const verificationCode = emailResponse.data?.code;
    const testBypass = emailResponse.data?.testBypass;
    
    if (testBypass && verificationCode) {
      console.log(`🧪 TEST BYPASS MODE ACTIVE: Verification code is ${verificationCode}`);
      return { 
        success: true, 
        isTestEmail: true, 
        verificationCode,
        testBypass: true
      };
    } else if (verificationCode) {
      console.log(`🧪 TEST MODE: Verification code is ${verificationCode}`);
      return { success: true, isTestEmail: true, verificationCode };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Failed to send custom verification email:", error);
    return { success: false, error };
  }
};

export const resendDefaultVerification = async (email: string) => {
  // We're going to use our custom verification email instead
  try {
    const currentOrigin = window.location.origin;
    console.log("Resending custom verification for:", email);
    
    const result = await sendVerificationEmail(email, "", currentOrigin);
    return result;
  } catch (error) {
    console.error("Error in resendVerification:", error);
    return { success: false, error };
  }
};
