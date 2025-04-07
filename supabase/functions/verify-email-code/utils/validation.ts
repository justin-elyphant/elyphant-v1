
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
  return code === "123456" && Deno.env.get("ENVIRONMENT") !== "production";
}
