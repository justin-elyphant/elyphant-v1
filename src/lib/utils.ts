
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency
 * @param value - The number to format
 * @param currency - The currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format a date string to a human-readable format
 * @param dateString - The date string to format
 * @param format - The format to use (default: 'medium')
 * @returns Formatted date string
 */
export function formatDate(dateString: string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  try {
    const date = new Date(dateString);
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: format === 'short' ? 'short' : 'long',
      day: 'numeric',
    };
    
    if (format === 'long') {
      options.hour = 'numeric';
      options.minute = 'numeric';
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    return dateString; // Return original if parsing fails
  }
}

/**
 * Truncate text to a specific length and add ellipsis if needed
 * @param text - The text to truncate
 * @param length - The maximum length (default: 100)
 * @returns Truncated text
 */
export function truncateText(text: string, length: number = 100): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Generate a unique ID with an optional prefix
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID string
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Normalize tag strings for consistent formatting
 * @param tags - Array of tag strings
 * @returns Array of normalized tag strings
 */
export function normalizeTags(tags: string[]): string[] {
  if (!tags || !Array.isArray(tags)) return [];
  
  return tags
    .filter(Boolean) // Remove empty tags
    .map(tag => tag.trim().toLowerCase())
    .filter((tag, index, self) => self.indexOf(tag) === index); // Remove duplicates
}
