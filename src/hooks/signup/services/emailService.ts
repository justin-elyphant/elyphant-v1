
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
        console.log(`Email function response type:`, typeof emailResponse);
        console.log(`Email function response data type:`, typeof emailResponse.data);
        
        // Enhanced debugging for response data structure
        if (emailResponse.data) {
          console.log(`Email function response data keys:`, Object.keys(emailResponse.data));
          console.log(`Email function response data:`, JSON.stringify(emailResponse.data));
          
          // Specifically check for code in various locations
          console.log(`Direct code property:`, emailResponse.data.code);
          console.log(`Direct verificationCode property:`, emailResponse.data.verificationCode);
          
          if (typeof emailResponse.data === 'object' && emailResponse.data !== null) {
            // If data is an object, check for nested data property
            if (emailResponse.data.data) {
              console.log(`Nested data property keys:`, Object.keys(emailResponse.data.data));
              console.log(`Nested data.code:`, emailResponse.data.data.code);
              console.log(`Nested data.verificationCode:`, emailResponse.data.data.verificationCode);
            }
          }
        }
        
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
    
    // Extract verification code with comprehensive logging
    console.log("Checking for verification code in response:", emailResponse.data);
    
    // Standard code properties
    let verificationCode = emailResponse.data?.code;
    let testBypass = emailResponse.data?.testBypass;
    
    // Log all possible locations for the code
    console.log("Email function response data structure:", {
      directCode: emailResponse.data?.code,
      verificationCode: emailResponse.data?.verificationCode,
      dataCode: emailResponse.data?.data?.code,
      testBypass,
      hasData: !!emailResponse.data,
      dataKeys: emailResponse.data ? Object.keys(emailResponse.data) : []
    });
    
    // If standard code property is not found, look for alternatives
    if (!verificationCode) {
      // Check for verificationCode property
      if (emailResponse.data?.verificationCode) {
        verificationCode = emailResponse.data.verificationCode;
        console.log("Found verification code in verificationCode property:", verificationCode);
      } 
      // Check for nested data.code property
      else if (emailResponse.data?.data?.code) {
        verificationCode = emailResponse.data.data.code;
        console.log("Found verification code in nested data.code:", verificationCode);
      }
      // Check for nested data.verificationCode property
      else if (emailResponse.data?.data?.verificationCode) {
        verificationCode = emailResponse.data.data.verificationCode;
        console.log("Found verification code in nested data.verificationCode:", verificationCode);
      }
    }
    
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
