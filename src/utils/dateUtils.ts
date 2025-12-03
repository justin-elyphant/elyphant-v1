/**
 * Parse a date string as a local date, not UTC
 * Handles both YYYY-MM-DD format and full ISO strings
 * Prevents timezone shifting issues when displaying dates
 */
export function parseLocalDate(dateString: string | undefined | null): Date {
  if (!dateString) {
    return new Date(NaN); // Return invalid date for falsy values
  }
  
  // Handle full ISO string format (e.g., "2025-12-30T00:00:00.000Z")
  if (dateString.includes('T')) {
    const date = new Date(dateString);
    // Return a local date at noon to avoid timezone issues
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  }
  
  // Handle YYYY-MM-DD format
  const parts = dateString.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return new Date(NaN); // Return invalid date for malformed strings
  }
  
  const [year, month, day] = parts;
  return new Date(year, month - 1, day, 12, 0, 0); // Set to noon local time
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Format a date string for display
 */
export function formatScheduledDate(dateString: string): string {
  const date = parseLocalDate(dateString);
  if (!isValidDate(date)) {
    return 'Invalid date';
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
