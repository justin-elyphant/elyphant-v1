
/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if an email is a test email that should bypass actual sending
 */
export function isTestEmail(email: string): boolean {
  if (!email) return false;
  
  const lowerEmail = email.toLowerCase();
  
  // List of test email patterns
  const testPatterns = [
    "justncmeeks",
    "test@example.com",
    "test+",
    "demo@"
  ];
  
  // ENHANCED LOGGING: Detailed pattern matching
  console.log(`🔍 TEST EMAIL PATTERNS CHECK for ${email}:`);
  for (const pattern of testPatterns) {
    const matches = lowerEmail.includes(pattern);
    console.log(`  - Pattern "${pattern}": ${matches ? 'MATCHES ✓' : 'does not match ✗'}`);
    if (matches) {
      console.log(`  > MATCHED PATTERN: "${pattern}" found in "${lowerEmail}"`);
    }
  }
  
  // Check if any pattern is found in the email
  const isTest = testPatterns.some(pattern => lowerEmail.includes(pattern));
  
  console.log(`Email ${email} final test status: ${isTest ? 'IS TEST EMAIL ✓' : 'is NOT a test email ✗'}`);
  return isTest;
}
