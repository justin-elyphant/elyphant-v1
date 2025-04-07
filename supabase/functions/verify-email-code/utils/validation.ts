
/**
 * Validate code format (6 digits)
 */
export function isValidCodeFormat(code: string): boolean {
  return code.length === 6 && /^\d{6}$/.test(code);
}

/**
 * Check if code is a test code (in non-production environments)
 */
export function isTestCode(code: string): boolean {
  const environment = Deno.env.get("ENVIRONMENT");
  console.log(`Checking if ${code} is a test code in environment: ${environment || "not set"}`);
  
  // In non-production environments, accept 123456 as test code
  if (code === "123456" && environment !== "production") {
    console.log("Test code 123456 recognized in non-production environment");
    return true;
  }
  
  return false;
}
