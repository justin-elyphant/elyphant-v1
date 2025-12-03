/**
 * Smart Product Title Display Utility
 * 
 * Handles truncation and cleaning of Amazon-style product titles
 * for optimal display across different devices and contexts.
 */

// Character limits by context
export const TITLE_LIMITS = {
  mobile: {
    card: 45,
    detail: 80,
  },
  tablet: {
    card: 60,
    detail: 100,
  },
  desktop: {
    card: 75,
    detail: 120,
  },
} as const;

// SEO patterns to remove from display titles
const SEO_PATTERNS = [
  /\|\s*Gifts?\s+(for|to)\s+\w+(\s+\w+)*/gi, // "| Gifts for Men Women"
  /\|\s*\w+\s+Collection/gi, // "| Mesa Collection"
  /\|\s*Official(ly)?\s+Licensed/gi,
  /\|\s*Premium\s+Quality/gi,
  /\|\s*Best\s+Seller/gi,
  /\|\s*Top\s+Rated/gi,
  /\|\s*Free\s+Shipping/gi,
  /\|\s*Fast\s+Delivery/gi,
  /\s*-\s*\[.*?\]/gi, // "- [Brand Name]"
];

// Words to remove that add no value
const FILLER_WORDS = [
  'Officially Licensed',
  'Premium Quality',
  'High Quality',
  'Best Quality',
  'Top Quality',
];

/**
 * Cleans Amazon SEO patterns from product title
 */
export function cleanTitle(title: string): string {
  if (!title) return '';
  
  let cleaned = title;
  
  // Remove SEO patterns
  for (const pattern of SEO_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remove filler words
  for (const filler of FILLER_WORDS) {
    cleaned = cleaned.replace(new RegExp(filler, 'gi'), '');
  }
  
  // Clean up multiple pipes
  cleaned = cleaned.replace(/\s*\|\s*\|\s*/g, ' | ');
  
  // Clean up trailing/leading pipes
  cleaned = cleaned.replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Removes duplicate brand mentions from title
 */
export function removeDuplicateBrand(title: string, brand?: string): string {
  if (!brand || !title) return title;
  
  // Count occurrences of brand
  const brandRegex = new RegExp(brand, 'gi');
  const matches = title.match(brandRegex);
  
  if (matches && matches.length > 1) {
    // Remove all but first occurrence
    let count = 0;
    return title.replace(brandRegex, (match) => {
      count++;
      return count === 1 ? match : '';
    }).replace(/\s+/g, ' ').trim();
  }
  
  return title;
}

/**
 * Smart truncation that preserves meaningful content
 * Tries to break at word boundaries and adds ellipsis
 */
export function smartTruncate(title: string, maxLength: number): string {
  if (!title || title.length <= maxLength) return title;
  
  // Find last space before maxLength
  const truncated = title.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // If we found a space, truncate there; otherwise use maxLength
  const breakPoint = lastSpace > maxLength * 0.6 ? lastSpace : maxLength;
  
  return title.substring(0, breakPoint).trim() + '...';
}

/**
 * Get the appropriate character limit based on device and context
 */
export function getTitleLimit(
  device: 'mobile' | 'tablet' | 'desktop',
  context: 'card' | 'detail'
): number {
  return TITLE_LIMITS[device][context];
}

/**
 * Main function: Get display-ready product title
 * 
 * @param title - Raw product title
 * @param options - Configuration options
 * @returns Cleaned and truncated title
 */
export function getDisplayTitle(
  title: string,
  options: {
    device?: 'mobile' | 'tablet' | 'desktop';
    context?: 'card' | 'detail';
    maxLength?: number;
    brand?: string;
    clean?: boolean;
  } = {}
): string {
  const {
    device = 'desktop',
    context = 'card',
    maxLength,
    brand,
    clean = true,
  } = options;
  
  if (!title) return '';
  
  let processed = title;
  
  // Step 1: Clean SEO patterns if enabled
  if (clean) {
    processed = cleanTitle(processed);
  }
  
  // Step 2: Remove duplicate brand mentions
  if (brand) {
    processed = removeDuplicateBrand(processed, brand);
  }
  
  // Step 3: Determine max length
  const limit = maxLength ?? getTitleLimit(device, context);
  
  // Step 4: Smart truncate
  return smartTruncate(processed, limit);
}

/**
 * Hook-friendly function that detects device automatically
 */
export function getDisplayTitleForDevice(
  title: string,
  isMobile: boolean,
  isTablet: boolean,
  context: 'card' | 'detail' = 'card',
  brand?: string
): string {
  const device = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
  return getDisplayTitle(title, { device, context, brand });
}
