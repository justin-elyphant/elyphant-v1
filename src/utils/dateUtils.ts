/**
 * Parse a date string (YYYY-MM-DD) as a local date, not UTC
 * Prevents timezone shifting issues when displaying dates
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // Set to noon local time
}

/**
 * Format a date string for display
 */
export function formatScheduledDate(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
