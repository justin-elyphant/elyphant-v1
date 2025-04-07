
/**
 * Extract verification code from various response formats
 */
export function extractVerificationCode(emailResponse: any): string | null {
  console.log("Checking for verification code in response:", emailResponse?.data);
  
  // Standard code properties
  let verificationCode = emailResponse?.data?.code;
  
  // Log all possible locations for the code
  console.log("Email function response data structure:", {
    directCode: emailResponse?.data?.code,
    verificationCode: emailResponse?.data?.verificationCode,
    dataCode: emailResponse?.data?.data?.code,
    hasData: !!emailResponse?.data,
    dataKeys: emailResponse?.data ? Object.keys(emailResponse?.data) : []
  });
  
  // If standard code property is not found, look for alternatives
  if (!verificationCode) {
    // Check for verificationCode property
    if (emailResponse?.data?.verificationCode) {
      verificationCode = emailResponse.data.verificationCode;
      console.log("Found verification code in verificationCode property:", verificationCode);
    } 
    // Check for nested data.code property
    else if (emailResponse?.data?.data?.code) {
      verificationCode = emailResponse.data.data.code;
      console.log("Found verification code in nested data.code:", verificationCode);
    }
    // Check for nested data.verificationCode property
    else if (emailResponse?.data?.data?.verificationCode) {
      verificationCode = emailResponse.data.data.verificationCode;
      console.log("Found verification code in nested data.verificationCode:", verificationCode);
    }
  }
  
  return verificationCode;
}

/**
 * Check if the response indicates a test bypass
 */
export function isTestBypass(emailResponse: any): boolean {
  return !!emailResponse?.data?.testBypass;
}

/**
 * Check if the provided email is a test email
 */
export function isTestEmail(email: string): boolean {
  if (!email) return false;
  
  // Always normalize to lowercase for consistent checking
  const normalizedEmail = email.toLowerCase();
  return normalizedEmail.includes("justncmeeks") || normalizedEmail.includes("test@example");
}
