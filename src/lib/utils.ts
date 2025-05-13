
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency with proper formatting for the given locale and currency
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (e.g., 'USD', 'EUR')
 * @param {string} locale - The locale code (e.g., 'en-US', 'fr-FR')
 * @returns {string} The formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Normalizes tags by removing duplicates, trimming whitespace and converting to lowercase
 * @param {string[]} tags - The array of tags to normalize
 * @returns {string[]} The normalized array of tags
 */
export function normalizeTags(tags: string[]): string[] {
  // Convert to lowercase, trim whitespace, and filter out empties
  const processedTags = tags
    .map(tag => tag.toLowerCase().trim())
    .filter(tag => tag.length > 0);
  
  // Remove duplicates
  return [...new Set(processedTags)];
}

/**
 * Slugify a string for use in URLs
 * @param {string} text - The text to slugify
 * @returns {string} The slugified string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')        // Replace spaces with dashes
    .replace(/[^\w\-]+/g, '')     // Remove non-word characters
    .replace(/\-\-+/g, '-')       // Replace multiple dashes with single dash
    .replace(/^-+/, '')           // Trim dash from start
    .replace(/-+$/, '');          // Trim dash from end
}

/**
 * Truncates text to a specified length and adds an ellipsis if needed
 * @param {string} text - The text to truncate
 * @param {number} maxLength - The maximum length of the truncated text
 * @returns {string} The truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Checks if a URL is valid
 * @param {string} url - The URL to check
 * @returns {boolean} True if the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Gets a random item from an array
 * @param {Array} array - The array to get a random item from
 * @returns {*} A random item from the array
 */
export function getRandomItem<T>(array: T[]): T | undefined {
  if (!array || array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Formats a date in a human-readable format
 * @param {Date | string} date - The date to format
 * @param {string} format - The format to use (short, medium, long)
 * @returns {string} The formatted date
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'numeric' : 'long',
    day: 'numeric',
  };
  
  if (format === 'long') {
    options.weekday = 'long';
  }
  
  return dateObj.toLocaleDateString(undefined, options);
}
