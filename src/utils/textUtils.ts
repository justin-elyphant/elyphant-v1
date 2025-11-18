/**
 * Text utility functions for consistent string formatting across the application
 */

/**
 * Truncates a product title to a specified maximum length with ellipsis
 * Used for email templates and other contexts requiring character limits
 * 
 * @param title - The product title to truncate
 * @param maxLength - Maximum length before truncation (default: 60)
 * @returns Truncated string with "..." appended if truncated
 */
export const truncateProductTitle = (title: string, maxLength: number = 60): string => {
  if (!title) return '';
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength).trim() + '...';
};
