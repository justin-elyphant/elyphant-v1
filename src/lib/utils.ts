
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency with proper formatting for the given locale and currency
 * Handles thousand separators automatically and supports various price ranges
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
  // Handle edge cases
  if (typeof amount !== 'number' || isNaN(amount)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Enhanced price formatter with validation and conversion
 * Handles various price formats (cents, dollars) and edge cases with source-aware logic
 * @param {number | undefined | null} price - The price to format
 * @param {object} options - Formatting options
 * @returns {string} The formatted price string (e.g., "$1,999.99")
 */
export function formatPrice(
  price: number | undefined | null, 
  options: {
    detectCents?: boolean;
    fallbackText?: string;
    currency?: string;
    locale?: string;
    productSource?: 'zinc_api' | 'shopify' | 'vendor_portal' | 'manual';
    skipCentsDetection?: boolean;
  } = {}
): string {
  const {
    detectCents = true,
    fallbackText = "Price not available",
    currency = 'USD',
    locale = 'en-US',
    productSource,
    skipCentsDetection = false
  } = options;

  // Handle edge cases
  if (price === null || price === undefined || isNaN(price)) {
    return fallbackText;
  }

  // Validate price is a number
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 0) {
    console.warn(`[Price Validation] Invalid price value: ${price}`);
    return fallbackText;
  }

  // Source-aware price conversion logic
  let finalPrice = numPrice;
  let shouldDetectCents = detectCents;
  
  // Override cents detection based on product source
  if (skipCentsDetection) {
    shouldDetectCents = false;
  } else if (productSource) {
    switch (productSource) {
      case 'zinc_api':
        shouldDetectCents = true; // Zinc API uses cents
        break;
      case 'shopify':
      case 'vendor_portal':
      case 'manual':
        shouldDetectCents = false; // These sources use dollars
        break;
    }
  }
  
  // Auto-detect if price is in cents (for Zinc API and legacy products)
  // FIXED: Use "effectively integer" check to handle DB float storage (e.g., 1699.00)
  const isEffectivelyInteger = Number.isInteger(numPrice) || (numPrice % 1 === 0);
  
  if (shouldDetectCents && isEffectivelyInteger) {
    // For Zinc API products, detect cents more intelligently
    if (productSource === 'zinc_api') {
      // Zinc API prices are ALWAYS in cents, convert all integer values
      const possibleDollarAmount = numPrice / 100;
      if (possibleDollarAmount < 10000) { // Reasonable upper limit
        finalPrice = possibleDollarAmount;
        console.debug(`[Price Conversion] Converted ${numPrice} cents to $${finalPrice} (source: ${productSource})`);
      }
    } else if (numPrice > 1000) {
      // For other sources, use the old logic for backward compatibility
      const possibleDollarAmount = numPrice / 100;
      if (possibleDollarAmount < 10000) { // Reasonable upper limit
        finalPrice = possibleDollarAmount;
        console.debug(`[Price Conversion] Converted ${numPrice} cents to $${finalPrice} (source: ${productSource || 'auto-detected'})`);
      }
    }
  }

  return formatCurrency(finalPrice, currency, locale);
}

/**
 * Validates and normalizes price data from various sources
 * Database prices are stored in dollars - no cents detection needed.
 * @param {any} priceData - Raw price data from API/database
 * @returns {number | null} Normalized price in dollars or null if invalid
 */
export function validateAndNormalizePrice(priceData: any): number | null {
  if (priceData === null || priceData === undefined) return null;
  
  const numPrice = Number(priceData);
  if (isNaN(numPrice) || numPrice < 0) {
    console.warn(`[Price Validation] Invalid price data: ${priceData}`);
    return null;
  }

  // Trust the database value - prices are stored in dollars
  // REMOVED: Cents detection heuristic that caused $119 to become $1.19
  return numPrice;
}

/**
 * Creates a price debugging report for development
 * @param {any} priceData - Price data to analyze
 * @param {string} source - Source identifier for logging
 */
export function debugPrice(priceData: any, source: string = 'unknown'): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const normalized = validateAndNormalizePrice(priceData);
  console.group(`[Price Debug] ${source}`);
  console.log('Raw price:', priceData);
  console.log('Normalized price:', normalized);
  console.log('Formatted price:', formatPrice(normalized));
  console.groupEnd();
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
