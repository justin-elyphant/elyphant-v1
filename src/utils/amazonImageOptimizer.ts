/**
 * Amazon Image Optimizer Utility
 * 
 * Detects Amazon CDN URLs and optimizes them for different contexts:
 * - Marketplace cards: _SL1500_ (1500px for crisp retina display)
 * - Product detail carousel: _SL1500_ (high quality viewing)
 * - Fullscreen modal: Original quality (no suffix for max resolution)
 * - Thumbnails: _SL320_ (optimized for small previews)
 */

/**
 * Detect if URL is from Amazon CDN
 */
export const isAmazonImageUrl = (url: string): boolean => {
  if (!url) return false;
  return (
    url.includes('m.media-amazon.com') ||
    url.includes('images-amazon.com') ||
    url.includes('ssl-images-amazon.com')
  );
};

/**
 * Regex to strip ALL Amazon size suffixes
 * Matches patterns like: ._AC_UL320_. ._SL1500_. ._SS40_. etc.
 */
const AMAZON_SIZE_SUFFIX_REGEX = /\._[A-Z][A-Z0-9_,]+_\./;

/**
 * Get high-resolution Amazon image optimized for context
 * 
 * @param url - Original image URL
 * @param context - Display context (card, detail, fullscreen, thumbnail)
 * @returns Optimized image URL
 */
export const getHighResAmazonImage = (
  url: string,
  context: 'card' | 'detail' | 'fullscreen' | 'thumbnail' = 'card'
): string => {
  if (!url || !isAmazonImageUrl(url)) return url;

  // Strip existing size suffix to get base URL
  const baseUrl = url.replace(AMAZON_SIZE_SUFFIX_REGEX, '.');
  
  let optimizedUrl: string;

  // Apply appropriate resolution for each context
  switch (context) {
    case 'fullscreen':
      // Original quality - highest resolution for zoom
      optimizedUrl = baseUrl;
      break;
    case 'detail':
    case 'card':
      // 1500px for cards and product detail carousel (sharp on retina displays)
      optimizedUrl = baseUrl.replace(/\.(\w+)$/, '._SL1500_.$1');
      break;
    case 'thumbnail':
      // 320px for small thumbnails
      optimizedUrl = baseUrl.replace(/\.(\w+)$/, '._SL320_.$1');
      break;
    default:
      optimizedUrl = baseUrl.replace(/\.(\w+)$/, '._SL1500_.$1');
  }
  
  // Log optimization for debugging
  if (url !== optimizedUrl) {
    console.log(`[Image Optimizer] ${context}:`, {
      original: url.substring(url.lastIndexOf('/') + 1),
      optimized: optimizedUrl.substring(optimizedUrl.lastIndexOf('/') + 1)
    });
  }
  
  return optimizedUrl;
};

/**
 * Generate srcset for responsive images (retina display support)
 * Provides 1x, 2x, 3x variants for different screen densities
 * 
 * @param url - Original image URL
 * @returns srcSet string for img element
 */
export const getAmazonImageSrcSet = (url: string): string => {
  if (!url || !isAmazonImageUrl(url)) return '';

  const baseUrl = url.replace(AMAZON_SIZE_SUFFIX_REGEX, '.');

  return [
    `${baseUrl.replace(/\.(\w+)$/, '._SL500_.$1')} 500w`,
    `${baseUrl.replace(/\.(\w+)$/, '._SL1000_.$1')} 1000w`,
    `${baseUrl.replace(/\.(\w+)$/, '._SL1500_.$1')} 1500w`
  ].join(', ');
};

/**
 * Error fallback handler - returns array of fallback URLs to try
 * Gracefully degrades from high-res to lower resolutions
 * 
 * @param url - Original image URL
 * @returns Array of fallback URLs in order of quality (high to low)
 */
export const getImageFallbacks = (url: string): string[] => {
  if (!url || !isAmazonImageUrl(url)) return [url, '/placeholder.svg'];

  const baseUrl = url.replace(AMAZON_SIZE_SUFFIX_REGEX, '.');

  return [
    baseUrl.replace(/\.(\w+)$/, '._SL1500_.$1'), // High-res first
    baseUrl.replace(/\.(\w+)$/, '._SL1000_.$1'), // Medium-high
    baseUrl.replace(/\.(\w+)$/, '._SL500_.$1'),  // Medium
    baseUrl.replace(/\.(\w+)$/, '._SL320_.$1'),  // Low
    baseUrl,                                       // Original
    '/placeholder.svg'                             // Final fallback
  ];
};
