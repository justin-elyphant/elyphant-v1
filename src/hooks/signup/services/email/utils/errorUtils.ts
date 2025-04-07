
/**
 * Helper function to check if an error is related to rate limiting
 */
export function isRateLimitError(response: any): boolean {
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
