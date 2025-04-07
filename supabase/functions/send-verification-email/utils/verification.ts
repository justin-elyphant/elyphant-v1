
/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Generated verification code: ${code}`);
  return code;
}

/**
 * Check if the provided email is a test email
 */
export function isTestEmail(email: string): boolean {
  // Normalize email to lowercase for consistent checking
  const normalizedEmail = email.toLowerCase();
  const isTestPattern = normalizedEmail.includes("test@example") || 
                         normalizedEmail.includes("justncmeeks");
  
  console.log(`Testing email ${normalizedEmail.substring(0, 3)}... for test pattern: ${isTestPattern}`);
  return isTestPattern;
}

/**
 * Check if we are in a test/development environment
 */
export function isTestEnvironment(): boolean {
  const environment = Deno.env.get("ENVIRONMENT");
  return environment !== "production";
}
