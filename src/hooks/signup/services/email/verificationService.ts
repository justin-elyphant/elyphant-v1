
import { supabase } from "@/integrations/supabase/client";
import { isRateLimitError } from "./utils/errorUtils";
import { extractVerificationCode, isTestBypass, isTestEmail } from "./utils/responseParser";
import { EMAIL_RETRY_CONFIG } from "./config/retryConfig";

/**
 * Send a verification email to the user
 */
export const sendVerificationEmail = async (email: string, name: string, verificationUrl: string) => {
  try {
    console.log("Sending verification email with base URL:", verificationUrl);
    
    // Make sure verification URL doesn't end with a slash
    const baseUrl = verificationUrl.endsWith('/') ? verificationUrl.slice(0, -1) : verificationUrl;
    
    // Handle potential rate-limiting with retries
    let retries = 0;
    const maxRetries = EMAIL_RETRY_CONFIG.maxRetries;
    let success = false;
    let emailResponse;
    
    while (retries <= maxRetries && !success) {
      if (retries > 0) {
        console.log(`Retrying email send (attempt ${retries + 1}/${maxRetries + 1})...`);
        // Add delay between retries
        await new Promise(resolve => setTimeout(resolve, retries * EMAIL_RETRY_CONFIG.delayMultiplier));
      }
      
      // Check for test emails
      const testEmail = isTestEmail(email);
                          
      if (testEmail) {
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
    
    // Extract verification code
    const verificationCode = extractVerificationCode(emailResponse);
    const testBypass = isTestBypass(emailResponse);
    
    if (testBypass && verificationCode) {
      console.log(`🧪 TEST BYPASS MODE ACTIVE: Verification code is ${verificationCode}`);
      return { 
        success: true, 
        isTestEmail: true, 
        verificationCode: verificationCode,
        testBypass: true,
        data: emailResponse.data // Include full data for additional extraction if needed
      };
    } else if (verificationCode) {
      console.log(`🧪 TEST MODE: Verification code is ${verificationCode}`);
      return { 
        success: true, 
        isTestEmail: true, 
        verificationCode: verificationCode,
        data: emailResponse.data // Include full data for additional extraction if needed
      };
    }
    
    // If we couldn't find the code in the usual places, return the full data
    // for potential extraction in the calling code
    return { 
      success: true,
      data: emailResponse.data
    };
  } catch (error) {
    console.error("Failed to send custom verification email:", error);
    return { success: false, error };
  }
};
