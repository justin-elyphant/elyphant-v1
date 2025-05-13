

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge and apply Tailwind classes conditionally
 * @param inputs Class values to merge
 * @returns A string of merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price value to a localized currency string
 * @param value The price value
 * @param currency The currency code (default: USD)
 * @param locale The locale (default: en-US)
 * @returns A formatted currency string
 */
export function formatPrice(
  value: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Format a date string to a localized date format
 * @param date The date to format
 * @param locale The locale (default: en-US)
 * @returns A formatted date string
 */
export function formatDate(
  date: Date | string,
  locale: string = "en-US"
): string {
  if (typeof date === "string") {
    date = new Date(date);
  }
  
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Format a currency value for display
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @returns A formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Normalize tags by removing duplicates, empty tags, and trimming whitespace
 * @param tags Array of tags to normalize
 * @returns Normalized array of tags
 */
export function normalizeTags(tags: string[]): string[] {
  return [...new Set(
    tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
  )];
}

/**
 * Truncate a string to a specified length and append an ellipsis if needed
 * @param str The string to truncate
 * @param length The maximum length (default: 50)
 * @returns The truncated string
 */
export function truncateString(str: string, length: number = 50): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/**
 * Get a random item from an array
 * @param array The array to get a random item from
 * @returns A random item from the array
 */
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a random ID string
 * @param length The length of the ID (default: 8)
 * @returns A random ID string
 */
export function generateId(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Deep clone an object
 * @param obj The object to clone
 * @returns A deep clone of the object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce a function
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

