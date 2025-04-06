
import { supabase } from "@/integrations/supabase/client";

// Helper function to check if an error is related to rate limiting
function isRateLimitError(response: any): boolean {
  // Check status code
  if (response.error?.status === 429 || response.status === 429) {
    return true;
  }
  
  // Check error message
  const errorMessage = response.error?.message || response.data?.error || '';
  if (
    errorMessage.toLowerCase().includes('rate') || 
    errorMessage.toLowerCase().includes('limit') ||
    errorMessage.toLowerCase().includes('too many')
  ) {
    return true;
  }
  
  // Check explicit rate limited flag
  if (response.data?.rateLimited) {
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
      
      emailResponse = await supabase.functions.invoke('send-verification-email', {
        body: {
          email: email,
          name: name,
          verificationUrl: baseUrl, // Send just the origin, the function will append the path
          useVerificationCode: true  // Explicitly request code-based verification
        }
      });
      
      console.log(`Email function response (attempt ${retries + 1}):`, emailResponse);
      
      if (!emailResponse.error) {
        success = true;
        break;
      }
      
      // If it's not a rate limit error, don't retry
      if (!isRateLimitError(emailResponse)) {
        break;
      }
      
      retries++;
    }
    
    if (emailResponse.error) {
      console.error("Email function error:", emailResponse.error);
      
      // Check for rate limiting from the error or data
      if (isRateLimitError(emailResponse)) {
        return { success: false, error: emailResponse.error, rateLimited: true };
      }
      
      throw new Error(emailResponse.error.message || "Failed to send verification email");
    }
    
    // Check for rate limiting in the response data
    if (emailResponse.data?.rateLimited) {
      return { success: false, error: "Rate limited", rateLimited: true };
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
