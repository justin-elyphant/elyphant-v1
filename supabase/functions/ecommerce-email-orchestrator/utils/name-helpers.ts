/**
 * Name Helper Utilities
 * Functions for extracting and formatting names in email templates
 */

/**
 * Extracts the first name from a full name string
 * Handles various name formats gracefully
 * 
 * @param fullName - The complete name (e.g., "Charles Meeks", "Madonna", "Mary Jane Watson")
 * @returns The first name (e.g., "Charles", "Madonna", "Mary")
 * 
 * @example
 * extractFirstName("Charles Meeks") // "Charles"
 * extractFirstName("Madonna") // "Madonna"
 * extractFirstName("Mary Jane Watson") // "Mary"
 * extractFirstName("  John  Doe  ") // "John"
 */
export function extractFirstName(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') {
    return 'there'; // Fallback for invalid input
  }
  
  // Trim and normalize whitespace
  const trimmedName = fullName.trim().replace(/\s+/g, ' ');
  
  if (!trimmedName) {
    return 'there'; // Fallback for empty string
  }
  
  // Split by space and take the first part
  const parts = trimmedName.split(' ');
  const firstName = parts[0];
  
  // Capitalize first letter if needed (handles lowercase inputs)
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}
